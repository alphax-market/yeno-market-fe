-- Drop the restrictive position check constraint to allow multi-outcome market positions
ALTER TABLE public.market_trades DROP CONSTRAINT IF EXISTS market_trades_position_check;