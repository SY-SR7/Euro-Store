import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

function source(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('Supabase RPC contracts and Database schema', () => {
  it('defines all required atomic RPC functions in database types', () => {
    const typesContent = source('packages/database/src/types.ts');

    const expectedFunctions = [
      'add_customer_cart_item',
      'set_customer_cart_item_quantity',
      'remove_customer_cart_item',
      'place_order_atomic',
      'approve_exchange_request_atomic',
      'award_loyalty_points',
      'complete_helper_exchange',
      'catalog_search_with_facets',
      'admin_report_data',
      'admin_list_orders',
      'admin_save_collection',
      'admin_save_product_bundle',
    ];

    for (const fnName of expectedFunctions) {
      expect(typesContent).toContain(`${fnName}: {`);
    }
  });

  it('verifies SQL security hardening in migrations', () => {
    const hardeningMigration = source('supabase/migrations/20260804119000_database_security_hardening.sql');
    expect(hardeningMigration).toContain('REVOKE ALL ON FUNCTION');
    expect(hardeningMigration).toContain('ALTER TABLE');
    expect(hardeningMigration).toContain('ENABLE ROW LEVEL SECURITY');
  });
});
