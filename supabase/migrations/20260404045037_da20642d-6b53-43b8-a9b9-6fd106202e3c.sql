
-- =============================================
-- 1. TYPING INDICATORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_typing_per_chat UNIQUE (chat_id, user_id)
);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "typing_select" ON public.typing_indicators FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chats WHERE chats.id = typing_indicators.chat_id AND (chats.participant_1 = auth.uid() OR chats.participant_2 = auth.uid())));

CREATE POLICY "typing_insert" ON public.typing_indicators FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "typing_update" ON public.typing_indicators FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "typing_delete" ON public.typing_indicators FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_typing_chat_id ON public.typing_indicators(chat_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- =============================================
-- 2. WALLET ENUMS & TABLES
-- =============================================
CREATE TYPE public.wallet_status AS ENUM ('active', 'suspended', 'pending_activation');

CREATE TYPE public.wallet_transaction_type AS ENUM (
  'deposit', 'withdrawal', 'transfer_in', 'transfer_out',
  'payment', 'refund', 'bonus', 'fee'
);

CREATE TYPE public.wallet_transaction_status AS ENUM (
  'pending', 'completed', 'failed', 'cancelled', 'reversed'
);

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'ETB',
  status public.wallet_status NOT NULL DEFAULT 'pending_activation',
  pin_hash TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  daily_limit NUMERIC(15,2) NOT NULL DEFAULT 50000.00,
  monthly_limit NUMERIC(15,2) NOT NULL DEFAULT 500000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type public.wallet_transaction_type NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  fee NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  balance_before NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2) NOT NULL,
  status public.wallet_transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  reference_id TEXT,
  counterparty_wallet_id UUID REFERENCES public.wallets(id),
  counterparty_name TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "wallet_tx_insert" ON public.wallet_transactions FOR INSERT TO authenticated
  WITH CHECK (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE TABLE public.wallet_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.wallet_terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own terms" ON public.wallet_terms_acceptance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms" ON public.wallet_terms_acceptance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_idempotency ON public.wallet_transactions(idempotency_key);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- =============================================
-- 3. ETOK TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS public.etok_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  sound_name TEXT NOT NULL DEFAULT 'Original Sound',
  duration INTEGER NOT NULL DEFAULT 15,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  privacy TEXT NOT NULL DEFAULT 'everyone' CHECK (privacy IN ('everyone', 'friends', 'only_me')),
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  allow_duet BOOLEAN NOT NULL DEFAULT true,
  allow_stitch BOOLEAN NOT NULL DEFAULT true,
  allow_download BOOLEAN NOT NULL DEFAULT true,
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etok_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.etok_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.etok_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.etok_videos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES public.etok_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etok_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.etok_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etok_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etok_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etok_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etok_videos_select" ON public.etok_videos FOR SELECT USING (privacy = 'everyone' OR auth.uid() = author_id);
CREATE POLICY "etok_videos_insert" ON public.etok_videos FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "etok_videos_update" ON public.etok_videos FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "etok_likes_select" ON public.etok_likes FOR SELECT USING (true);
CREATE POLICY "etok_likes_insert" ON public.etok_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "etok_likes_delete" ON public.etok_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "etok_comments_select" ON public.etok_comments FOR SELECT USING (true);
CREATE POLICY "etok_comments_insert" ON public.etok_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "etok_comments_delete" ON public.etok_comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "etok_follows_select" ON public.etok_follows FOR SELECT USING (true);
CREATE POLICY "etok_follows_insert" ON public.etok_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "etok_follows_delete" ON public.etok_follows FOR DELETE USING (auth.uid() = follower_id);

-- =============================================
-- 4. MISSING FUNCTIONS
-- =============================================

-- find_or_create_chat
CREATE OR REPLACE FUNCTION public.find_or_create_chat(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_chat_id UUID;
  new_chat_id UUID;
  p1 UUID;
  p2 UUID;
BEGIN
  IF auth.uid() != user1_id AND auth.uid() != user2_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF user1_id < user2_id THEN p1 := user1_id; p2 := user2_id;
  ELSE p1 := user2_id; p2 := user1_id; END IF;

  SELECT id INTO existing_chat_id FROM public.chats
  WHERE (participant_1 = p1 AND participant_2 = p2)
     OR (participant_1 = p2 AND participant_2 = p1);

  IF existing_chat_id IS NOT NULL THEN RETURN existing_chat_id; END IF;

  INSERT INTO public.chats (participant_1, participant_2) VALUES (p1, p2)
  RETURNING id INTO new_chat_id;

  RETURN new_chat_id;
END;
$$;

-- search_users_public
CREATE OR REPLACE FUNCTION public.search_users_public(search_term TEXT)
RETURNS TABLE(id UUID, username TEXT, name TEXT, avatar_url TEXT, bio TEXT, is_online BOOLEAN, last_seen TIMESTAMPTZ, is_active BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.name, p.avatar_url, p.bio, p.is_online, p.last_seen, p.is_active
  FROM public.profiles p
  WHERE p.username ILIKE '%' || search_term || '%'
     OR p.name ILIKE '%' || search_term || '%'
  LIMIT 50;
$$;

-- get_wallet_balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(balance, 0.00) FROM public.wallets WHERE id = p_wallet_id;
$$;

-- has_accepted_wallet_terms
CREATE OR REPLACE FUNCTION public.has_accepted_wallet_terms(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.wallet_terms_acceptance WHERE user_id = p_user_id);
$$;

-- get_user_wallet
CREATE OR REPLACE FUNCTION public.get_user_wallet(p_user_id UUID)
RETURNS TABLE(id UUID, user_id UUID, balance NUMERIC, currency TEXT, status public.wallet_status, terms_accepted BOOLEAN, daily_limit NUMERIC, monthly_limit NUMERIC, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.user_id, w.balance, w.currency, w.status, w.terms_accepted, w.daily_limit, w.monthly_limit, w.created_at
  FROM public.wallets w WHERE w.user_id = p_user_id;
$$;

-- prevent_transaction_modification
CREATE OR REPLACE FUNCTION public.prevent_transaction_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status IN ('completed', 'failed', 'reversed') THEN
    RAISE EXCEPTION 'Cannot modify a completed, failed, or reversed transaction';
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================
-- 5. MISSING TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER prevent_wallet_transaction_update
  BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_transaction_modification();

-- Update handle_new_user to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 6. MISSING INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_chats_participant_1 ON public.chats(participant_1);
CREATE INDEX IF NOT EXISTS idx_chats_participant_2 ON public.chats(participant_2);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_time ON public.chats(last_message_time DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_status_receiver ON public.messages(status, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at);

-- =============================================
-- 7. STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('etok-videos', 'etok-videos', true) ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Etok video storage policies
CREATE POLICY "Etok videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'etok-videos');
CREATE POLICY "Users can upload etok videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'etok-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their etok videos" ON storage.objects FOR DELETE USING (bucket_id = 'etok-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Chat media storage policies (bucket already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-media') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);
  END IF;
END $$;

CREATE POLICY "chat_media_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
CREATE POLICY "chat_media_view" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
CREATE POLICY "chat_media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);
