/**
 * @eurostore/adapters — ISearchAdapter
 *
 * Interface for full-text search engine integrations.
 * Business logic NEVER calls Supabase/Algolia SDKs directly for search — always through this interface.
 *
 * Current implementation: SupabaseFTSSearchAdapter (PostgreSQL FTS via tsvector)
 * Future: AlgoliaSearchAdapter (v2 — if FTS performance requires it)
 */

export interface SearchFilters {
  /** Filter by category UUID */
  categoryId?: string;
  /** Filter by brand UUID */
  brandId?: string;
  /** Minimum price in whole SYP */
  minPriceSYP?: number;
  /** Maximum price in whole SYP */
  maxPriceSYP?: number;
  /** Filter by specific attribute_value UUIDs (e.g., size: Large, color: Red) */
  attributeValues?: string[];
  /** If true, only return products with stock_quantity > 0 */
  inStockOnly?: boolean;
}

export interface SearchParams {
  /** The search query string — must be validated/sanitized before passing to this interface */
  query: string;
  /**
   * Language context for FTS weighting.
   * 'ar' — Arabic tsvector column
   * 'en' — English tsvector column
   * 'both' — search both columns and merge results (default)
   */
  language?: 'ar' | 'en' | 'both';
  filters?: SearchFilters;
  /** 1-indexed page number */
  page?: number;
  /** Results per page — capped at 100 by implementations */
  limit?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}

export interface SearchResult<T = unknown> {
  hits: T[];
  /** Total number of matching records (for pagination UI) */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  totalPages: number;
  /** Query execution time in milliseconds */
  took: number;
}

/**
 * Interface for full-text search engines.
 *
 * Implementations:
 * - `SupabaseFTSSearchAdapter` — PostgreSQL tsvector FTS (primary)
 * - `AlgoliaSearchAdapter` — future (swap if FTS is insufficient)
 *
 * Note: searchProducts returns `SearchResult<unknown>` by design.
 * Callers should cast to their expected product type after validation.
 * This keeps the adapter layer decoupled from domain types.
 */
export interface ISearchAdapter {
  /**
   * Perform a full-text product search.
   * Input query is expected to be pre-sanitized by the API route handler.
   */
  searchProducts(params: SearchParams): Promise<SearchResult>;

  /**
   * Trigger re-indexing of a single product (called after product updates).
   * For Supabase FTS, this updates the tsvector computed column.
   */
  indexProduct(productId: string): Promise<void>;

  /**
   * Remove a product from the search index (called on product deletion/archival).
   */
  removeProduct(productId: string): Promise<void>;

  /**
   * Rebuild the entire search index from scratch.
   * Should only be called by admin — expensive operation.
   * @returns count of successfully indexed and failed products
   */
  reindexAll(): Promise<{ indexed: number; failed: number }>;
}

/** Thrown when a search query fails at the provider level */
export class SearchAdapterError extends Error {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly providerCode?: string,
  ) {
    super(message);
    this.name = 'SearchAdapterError';
  }
}
