CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('arabic', COALESCE(NEW.name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(unaccent(NEW.name_en), '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.description_ar, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(unaccent(NEW.description_en), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name_ar, name_en, description_ar, description_en
  ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
