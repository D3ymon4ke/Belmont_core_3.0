-- ===================================================
-- BELMONT CORE 2.0 — SUPABASE SCHEMA, SECURITY RLS & ECONOMY
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  status_text TEXT DEFAULT 'Na Mansão Belmont',
  is_admin BOOLEAN DEFAULT FALSE,
  belmont_coins INTEGER DEFAULT 100,
  rank_title TEXT DEFAULT 'Iniciado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Security RPC Function to check if calling user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_username TEXT;
  clean_name TEXT;
BEGIN
  clean_username := COALESCE(
    (new.raw_user_meta_data->>'username'),
    LOWER(SPLIT_PART(new.email, '@', 1))
  );
  clean_name := COALESCE(
    (new.raw_user_meta_data->>'display_name'),
    (new.raw_user_meta_data->>'name'),
    SPLIT_PART(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    clean_username,
    clean_name,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize User Progress & Bank Account
  INSERT INTO public.user_progress (user_id, xp, rank_title)
  VALUES (new.id, 0, 'Iniciado')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.bank_accounts (user_id, balance, accrued_yield)
  VALUES (new.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. WELCOME CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.welcome_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rules TEXT[] DEFAULT '{}',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POSTS TABLE (FEED)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 5. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. POST COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  is_general_chat BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 9. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. COIN TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions(user_id, created_at DESC);

-- 12. USER PROGRESS TABLE (XP & RANKS)
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  rank_title TEXT DEFAULT 'Iniciado',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACHIEVEMENTS CATALOGUE TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  coins_reward INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. USER ACHIEVEMENTS UNLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ===================================================
-- FASE 5: TABELAS DE BANCO, BOLSA & MERCADO
-- ===================================================

-- 15. BANK ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  accrued_yield INTEGER DEFAULT 0 CHECK (accrued_yield >= 0),
  yield_rate NUMERIC(5,4) DEFAULT 0.0100, -- 1.00% ao dia
  last_yield_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. BANK TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'yield', 'transfer_in', 'transfer_out'
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_tx_user ON public.bank_transactions(user_id, created_at DESC);

-- 17. ASSETS TABLE (BOLSA BELMONT)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  current_price INTEGER DEFAULT 100 CHECK (current_price > 0),
  change_24h NUMERIC(6,2) DEFAULT 0.00,
  volume_24h INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ASSET PRICES HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.asset_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price > 0),
  volume INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_prices_asset ON public.asset_prices(asset_id, created_at DESC);

-- 19. MARKET AGENTS (NPCs)
CREATE TABLE IF NOT EXISTS public.market_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  personality TEXT NOT NULL, -- 'conservative', 'trader', 'accumulator', 'realizer', 'speculator'
  cash_balance INTEGER DEFAULT 10000 CHECK (cash_balance >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. ORDERS TABLE (BOOK DE ORDENS)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.market_agents(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  side TEXT NOT NULL, -- 'buy', 'sell'
  order_type TEXT NOT NULL, -- 'market', 'limit'
  price INTEGER NOT NULL CHECK (price > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  filled_quantity INTEGER DEFAULT 0 CHECK (filled_quantity >= 0),
  status TEXT DEFAULT 'pending', -- 'pending', 'filled', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_order_owner CHECK (user_id IS NOT NULL OR agent_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_orders_asset_status ON public.orders(asset_id, status, side, price, created_at);

-- 21. TRADES TABLE (EXECUÇÕES DE MERCADO)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  buy_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sell_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_asset ON public.trades(asset_id, created_at DESC);

-- 22. HOLDINGS TABLE (CARTEIRA DE INVESTIMENTOS)
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  average_price INTEGER NOT NULL DEFAULT 0 CHECK (average_price >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user ON public.holdings(user_id);

-- ===================================================
-- FASE 5: FUNCTIONS & RPCs ATÔMICAS DE SEGURANÇA
-- ===================================================

-- RPC 1: Depósito no Banco Belmont
CREATE OR REPLACE FUNCTION public.bank_deposit(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_coins INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'O valor do depósito deve ser maior que zero.';
  END IF;

  SELECT belmont_coins INTO v_coins
  FROM public.profiles
  WHERE id = p_user_id FOR UPDATE;

  IF v_coins IS NULL OR v_coins < p_amount THEN
    RAISE EXCEPTION 'Saldo em Belmont Coins insuficiente para realizar o depósito.';
  END IF;

  -- Débito no saldo de moedas líquidas
  UPDATE public.profiles
  SET belmont_coins = belmont_coins - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Crédito na conta bancária
  INSERT INTO public.bank_accounts (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = bank_accounts.balance + p_amount,
      updated_at = NOW();

  -- Registra transações auditáveis
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'bank_deposit', 'Depósito no Banco Belmont');

  INSERT INTO public.bank_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'deposit', p_amount, 'Depósito realizado com sucesso');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: Saque do Banco Belmont
CREATE OR REPLACE FUNCTION public.bank_withdraw(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_bank_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'O valor do saque deve ser maior que zero.';
  END IF;

  SELECT balance INTO v_bank_balance
  FROM public.bank_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_bank_balance IS NULL OR v_bank_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo bancário insuficiente para realizar o saque.';
  END IF;

  -- Débito na conta bancária
  UPDATE public.bank_accounts
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Crédito nas moedas líquidas
  UPDATE public.profiles
  SET belmont_coins = belmont_coins + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registra transações auditáveis
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'bank_withdraw', 'Saque do Banco Belmont');

  INSERT INTO public.bank_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'withdraw', p_amount, 'Saque realizado com sucesso');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: Cálculo Idempotente de Rendimento do Banco
CREATE OR REPLACE FUNCTION public.calculate_bank_yield_idempotent(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
  v_rate NUMERIC;
  v_last_calc TIMESTAMPTZ;
  v_days INTEGER;
  v_yield INTEGER := 0;
BEGIN
  SELECT balance, yield_rate, last_yield_calculated_at
  INTO v_balance, v_rate, v_last_calc
  FROM public.bank_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL OR v_balance <= 0 THEN
    RETURN 0;
  END IF;

  -- Calcula quantidade de dias desde a última apuração
  v_days := EXTRACT(DAY FROM (NOW() - v_last_calc));

  IF v_days >= 1 THEN
    v_yield := FLOOR(v_balance * v_rate * v_days);

    IF v_yield > 0 THEN
      UPDATE public.bank_accounts
      SET balance = balance + v_yield,
          accrued_yield = accrued_yield + v_yield,
          last_yield_calculated_at = NOW(),
          updated_at = NOW()
      WHERE user_id = p_user_id;

      INSERT INTO public.bank_transactions (user_id, type, amount, description)
      VALUES (p_user_id, 'yield', v_yield, 'Rendimento automático do Banco Belmont');
    END IF;
  END IF;

  RETURN v_yield;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: Transferência P2P entre Membros (Atômica & Segura)
CREATE OR REPLACE FUNCTION public.transfer_coins_p2p(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_balance INTEGER;
  v_recipient_name TEXT;
BEGIN
  IF p_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Não é permitido transferir moedas para você mesmo.';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'O valor da transferência deve ser maior que zero.';
  END IF;

  -- Lock no saldo do remetente
  SELECT belmont_coins INTO v_sender_balance
  FROM public.profiles
  WHERE id = p_sender_id FOR UPDATE;

  IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente para realizar a transferência.';
  END IF;

  -- Obter nome do destinatário
  SELECT display_name INTO v_recipient_name
  FROM public.profiles
  WHERE id = p_recipient_id;

  IF v_recipient_name IS NULL THEN
    RAISE EXCEPTION 'Membro destinatário não foi localizado no Belmont Core.';
  END IF;

  -- Débito no remetente
  UPDATE public.profiles
  SET belmont_coins = belmont_coins - p_amount,
      updated_at = NOW()
  WHERE id = p_sender_id;

  -- Crédito no destinatário
  UPDATE public.profiles
  SET belmont_coins = belmont_coins + p_amount,
      updated_at = NOW()
  WHERE id = p_recipient_id;

  -- Registra histórico para o remetente
  INSERT INTO public.coin_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_sender_id, -p_amount, 'transfer_out', COALESCE(p_description, 'Transferência enviada para ' || v_recipient_name), p_recipient_id::text);

  -- Registra histórico para o destinatário
  INSERT INTO public.coin_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_recipient_id, p_amount, 'transfer_in', 'Transferência recebida de membro da Mansão', p_sender_id::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — FASE 5
-- ===================================================

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bank accounts - read own" ON public.bank_accounts;
CREATE POLICY "Bank accounts - read own" ON public.bank_accounts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Bank transactions - read own" ON public.bank_transactions;
CREATE POLICY "Bank transactions - read own" ON public.bank_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Assets - read all authenticated" ON public.assets;
CREATE POLICY "Assets - read all authenticated" ON public.assets FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Asset prices - read all authenticated" ON public.asset_prices;
CREATE POLICY "Asset prices - read all authenticated" ON public.asset_prices FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Market agents - read all authenticated" ON public.market_agents;
CREATE POLICY "Market agents - read all authenticated" ON public.market_agents FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Orders - read all authenticated" ON public.orders;
CREATE POLICY "Orders - read all authenticated" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Trades - read all authenticated" ON public.trades;
CREATE POLICY "Trades - read all authenticated" ON public.trades FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Holdings - read all authenticated" ON public.holdings;
CREATE POLICY "Holdings - read all authenticated" ON public.holdings FOR SELECT USING (auth.role() = 'authenticated');

-- ===================================================
-- SEED DATA: ATIVOS E NPCs DA BOLSA
-- ===================================================

INSERT INTO public.assets (id, symbol, name, description, current_price, change_24h, volume_24h)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'BELMONT', 'Belmont Core Token', 'Ativo nativo e de governança principal da Mansão Belmont.', 250, 4.50, 15000),
  ('a0000000-0000-0000-0000-000000000002', 'VAMP', 'Vampire Syndicate', 'Fundo de liquidez e alto risco controlado por membros selecionados.', 120, -1.80, 8400),
  ('a0000000-0000-0000-0000-000000000003', 'CASTLE', 'Castle Holding', 'Ativo lastreado nos ativos físicos e infraestrutura da Mansão.', 450, 2.10, 22000),
  ('a0000000-0000-0000-0000-000000000004', 'NOCT', 'Nocturne Energy', 'Empresa privada de tecnologia noturna e comunicação criptografada.', 85, 8.90, 11200),
  ('a0000000-0000-0000-0000-000000000005', 'TRANS', 'Transylvania Logistics', 'Fundo imobiliário e logístico da região de Transilvânia.', 180, 0.50, 6700),
  ('a0000000-0000-0000-0000-000000000006', 'HELL', 'Hellfire Venture', 'Fundo especulativo para alavancagem e projetos de alta incerteza.', 55, -5.20, 19500)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO public.market_agents (id, name, personality, cash_balance)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Victor Belmont (NPC)', 'accumulator', 50000),
  ('b0000000-0000-0000-0000-000000000002', 'Carmilla Trades (NPC)', 'trader', 35000),
  ('b0000000-0000-0000-0000-000000000003', 'Dracula Ventures (NPC)', 'speculator', 80000),
  ('b0000000-0000-0000-0000-000000000004', 'Sypha Analytics (NPC)', 'conservative', 25000)
ON CONFLICT (name) DO NOTHING;
