-- Create enum for market status
CREATE TYPE public.market_status AS ENUM ('draft', 'active', 'paused', 'resolved', 'cancelled');

-- Create enum for market resolution
CREATE TYPE public.market_resolution AS ENUM ('yes', 'no', 'invalid', 'pending');

-- Create user_markets table for creator-managed markets
CREATE TABLE public.user_markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status market_status NOT NULL DEFAULT 'draft',
  resolution market_resolution NOT NULL DEFAULT 'pending',
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  yes_price NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  no_price NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  volume NUMERIC(15,2) NOT NULL DEFAULT 0,
  liquidity NUMERIC(15,2) NOT NULL DEFAULT 0,
  twitter_post_id TEXT,
  twitter_embed_enabled BOOLEAN NOT NULL DEFAULT false,
  news_source_url TEXT,
  news_headline TEXT,
  revenue_share_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_participants table
CREATE TABLE public.market_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.user_markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  shares NUMERIC(15,4) NOT NULL DEFAULT 0,
  avg_price NUMERIC(5,4) NOT NULL DEFAULT 0,
  total_invested NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(market_id, user_id, position)
);

-- Create market_trades table
CREATE TABLE public.market_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.user_markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  shares NUMERIC(15,4) NOT NULL,
  price NUMERIC(5,4) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creator_payouts table
CREATE TABLE public.creator_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.user_markets(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create news_topics table for auto-generated markets
CREATE TABLE public.news_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headline TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT,
  category TEXT NOT NULL DEFAULT 'news',
  suggested_market_title TEXT,
  suggested_end_date TIMESTAMP WITH TIME ZONE,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  auto_created_market_id UUID REFERENCES public.user_markets(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_markets
CREATE POLICY "Anyone can view active markets" ON public.user_markets
  FOR SELECT USING (status = 'active');

CREATE POLICY "Creators can view their own markets" ON public.user_markets
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create markets" ON public.user_markets
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own markets" ON public.user_markets
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete draft markets" ON public.user_markets
  FOR DELETE USING (auth.uid() = creator_id AND status = 'draft');

-- RLS policies for market_participants
CREATE POLICY "Anyone can view market participants" ON public.market_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own positions" ON public.market_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions" ON public.market_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for market_trades
CREATE POLICY "Anyone can view trades" ON public.market_trades
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own trades" ON public.market_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for creator_payouts
CREATE POLICY "Creators can view their own payouts" ON public.creator_payouts
  FOR SELECT USING (auth.uid() = creator_id);

-- RLS policies for news_topics (public read for active topics)
CREATE POLICY "Anyone can view news topics" ON public.news_topics
  FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_user_markets_updated_at
  BEFORE UPDATE ON public.user_markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_market_participants_updated_at
  BEFORE UPDATE ON public.market_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();