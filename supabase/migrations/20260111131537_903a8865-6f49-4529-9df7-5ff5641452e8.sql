-- Add market_title column to market_trades to store the market title for display purposes
-- This allows tracking trades on mock markets that don't have a database record
ALTER TABLE public.market_trades 
ADD COLUMN IF NOT EXISTS market_title TEXT;

-- Make market_id nullable to support mock markets
ALTER TABLE public.market_trades 
ALTER COLUMN market_id DROP NOT NULL;

-- Add a check constraint to ensure either market_id or market_title is provided
ALTER TABLE public.market_trades
ADD CONSTRAINT market_trades_market_reference_check 
CHECK (market_id IS NOT NULL OR market_title IS NOT NULL);