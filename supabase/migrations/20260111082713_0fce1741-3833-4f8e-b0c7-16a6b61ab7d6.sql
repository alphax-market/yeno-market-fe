-- Add validation constraints to user_markets table
-- Using validation trigger instead of CHECK for end_date (time-based validation)

-- Add length constraints
ALTER TABLE public.user_markets 
  ADD CONSTRAINT title_length CHECK (length(title) >= 10 AND length(title) <= 200);

ALTER TABLE public.user_markets 
  ADD CONSTRAINT description_length CHECK (description IS NULL OR length(description) <= 5000);

ALTER TABLE public.user_markets 
  ADD CONSTRAINT valid_liquidity CHECK (liquidity >= 0);

ALTER TABLE public.user_markets 
  ADD CONSTRAINT valid_category CHECK (category IN ('crypto', 'politics', 'sports', 'entertainment', 'technology', 'finance', 'science', 'general', 'news'));

-- Create validation trigger for end_date (must be in future)
CREATE OR REPLACE FUNCTION public.validate_market_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date <= now() THEN
    RAISE EXCEPTION 'End date must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_market_end_date_trigger
BEFORE INSERT OR UPDATE ON public.user_markets
FOR EACH ROW
EXECUTE FUNCTION public.validate_market_end_date();