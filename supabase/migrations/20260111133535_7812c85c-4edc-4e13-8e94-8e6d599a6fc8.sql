-- Create table for open orders (limit orders that haven't been fully filled)
CREATE TABLE public.open_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id UUID REFERENCES public.user_markets(id) ON DELETE CASCADE,
  market_title TEXT,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  outcome TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0 AND price <= 1),
  shares NUMERIC NOT NULL CHECK (shares > 0),
  filled_shares NUMERIC NOT NULL DEFAULT 0 CHECK (filled_shares >= 0),
  total_value NUMERIC NOT NULL,
  expiration TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'filled', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.open_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders" 
ON public.open_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.open_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.open_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" 
ON public.open_orders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_open_orders_updated_at
BEFORE UPDATE ON public.open_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();