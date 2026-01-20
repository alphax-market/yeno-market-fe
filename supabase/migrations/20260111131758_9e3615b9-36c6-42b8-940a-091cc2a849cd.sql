-- Make market_id nullable for market_participants to support mock markets
ALTER TABLE public.market_participants 
ALTER COLUMN market_id DROP NOT NULL;

-- Add a check constraint to ensure either market_id or market_title is provided
ALTER TABLE public.market_participants
ADD CONSTRAINT market_participants_market_reference_check 
CHECK (market_id IS NOT NULL OR market_title IS NOT NULL);