-- Add market_title column to market_participants to store the market title for display purposes
ALTER TABLE public.market_participants 
ADD COLUMN IF NOT EXISTS market_title TEXT;