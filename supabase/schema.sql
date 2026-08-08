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
  
  -- Initialize User Progress
  INSERT INTO public.user_progress (user_id, xp, rank_title)
  VALUES (new.id, 0, 'Iniciado')
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

-- ===================================================
-- FASE 4: TABELAS DE ECONOMIA, XP & CONQUISTAS
-- ===================================================

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
-- ECONOMY & PROGRESSION RPC SECURITY FUNCTIONS
-- ===================================================

-- RPC 1: Admin Coin Adjustment Function
CREATE OR REPLACE FUNCTION public.add_coins_admin(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: Somente administradores podem ajustar moedas.';
  END IF;

  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'admin', p_description);

  UPDATE public.profiles
  SET belmont_coins = GREATEST(0, belmont_coins + p_amount),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: Add XP and Evaluate Rank Progression
CREATE OR REPLACE FUNCTION public.add_xp_and_evaluate_rank(
  p_user_id UUID,
  p_xp_amount INTEGER
)
RETURNS TEXT AS $$
DECLARE
  new_xp INTEGER;
  new_rank TEXT;
BEGIN
  INSERT INTO public.user_progress (user_id, xp, rank_title)
  VALUES (p_user_id, GREATEST(0, p_xp_amount), 'Iniciado')
  ON CONFLICT (user_id) DO UPDATE
  SET xp = GREATEST(0, user_progress.xp + p_xp_amount),
      updated_at = NOW()
  RETURNING xp INTO new_xp;

  IF new_xp >= 10000 THEN
    new_rank := 'Mestre da Mansão';
  ELSIF new_xp >= 5000 THEN
    new_rank := 'Conselheiro';
  ELSIF new_xp >= 2500 THEN
    new_rank := 'Guardião';
  ELSIF new_xp >= 1000 THEN
    new_rank := 'Veterano';
  ELSIF new_xp >= 500 THEN
    new_rank := 'Membro';
  ELSIF new_xp >= 100 THEN
    new_rank := 'Habitante';
  ELSE
    new_rank := 'Iniciado';
  END IF;

  UPDATE public.profiles
  SET rank_title = new_rank,
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE public.user_progress
  SET rank_title = new_rank
  WHERE user_id = p_user_id;

  RETURN new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: Unlock Achievement Function
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  p_user_id UUID,
  p_achievement_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_xp_reward INTEGER;
  v_coins_reward INTEGER;
  v_title TEXT;
BEGIN
  SELECT xp_reward, coins_reward, title INTO v_xp_reward, v_coins_reward, v_title
  FROM public.achievements
  WHERE id = p_achievement_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  IF v_xp_reward > 0 THEN
    PERFORM public.add_xp_and_evaluate_rank(p_user_id, v_xp_reward);
  END IF;

  IF v_coins_reward > 0 THEN
    INSERT INTO public.coin_transactions (user_id, amount, type, description, reference_id)
    VALUES (p_user_id, v_coins_reward, 'reward', 'Conquista desbloqueada: ' || v_title, p_achievement_id);

    UPDATE public.profiles
    SET belmont_coins = belmont_coins + v_coins_reward
    WHERE id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coin transactions - read own" ON public.coin_transactions;
CREATE POLICY "Coin transactions - read own" ON public.coin_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "User progress - read all authenticated" ON public.user_progress;
CREATE POLICY "User progress - read all authenticated" ON public.user_progress FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Achievements - read all authenticated" ON public.achievements;
CREATE POLICY "Achievements - read all authenticated" ON public.achievements FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Achievements - admin modify" ON public.achievements;
CREATE POLICY "Achievements - admin modify" ON public.achievements FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "User achievements - read all authenticated" ON public.user_achievements;
CREATE POLICY "User achievements - read all authenticated" ON public.user_achievements FOR SELECT USING (auth.role() = 'authenticated');

-- ===================================================
-- INITIAL SEED DATA FOR ACHIEVEMENTS & CONVERSATIONS
-- ===================================================

INSERT INTO public.conversations (id, title, is_group, is_general_chat)
VALUES ('00000000-0000-0000-0000-000000000001', 'Chat Geral Belmont', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.welcome_content (id, title, content, rules)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Bem-vindo ao Belmont Core 2.0',
  'Esta é a plataforma social privada e exclusiva da Mansão Belmont. Aqui reunimos inteligência, discussões estratégicas, projetos pessoais e comunicação em tempo real em um ambiente refinado.',
  ARRAY[
    'Mantenha a confidencialidade das discussões da Mansão.',
    'Respeite a ordem visual e a etiqueta de comunicação.',
    'Contribua com insights de valor nos tópicos e chats.'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Achievements Catalogue
INSERT INTO public.achievements (id, title, description, icon, category, rarity, xp_reward, coins_reward)
VALUES
  ('first_post', 'Primeiro Passo', 'Criou sua primeira publicação no Feed da Mansão.', 'Compass', 'social', 'common', 50, 25),
  ('first_chat', 'Voz da Mansão', 'Enviou sua primeira mensagem no Chat Geral.', 'MessageSquare', 'community', 'common', 50, 25),
  ('first_dm', 'Primeiro Contato', 'Enviou uma mensagem privada para outro membro.', 'Send', 'social', 'common', 50, 25),
  ('chroncler', 'Cronista', 'Criou 10 publicações no Feed.', 'Feather', 'community', 'rare', 200, 100),
  ('founder', 'Fundador da Mansão', 'Membro fundador presente na inauguração do Belmont Core 2.0.', 'Shield', 'special', 'legendary', 500, 250)
ON CONFLICT (id) DO NOTHING;
