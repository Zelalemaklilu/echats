
-- ============================================================
-- ETOK PRODUCTION SCHEMA
-- ============================================================

-- ─── Live streams ────────────────────────────────────────
CREATE TABLE public.etok_live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Music',
  viewer_count integer NOT NULL DEFAULT 0,
  gift_total integer NOT NULL DEFAULT 0,
  thumbnail_color text NOT NULL DEFAULT 'from-violet-900 to-purple-900',
  thumbnail_emoji text NOT NULL DEFAULT '📡',
  is_live boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_live_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_streams_select" ON public.etok_live_streams FOR SELECT USING (true);
CREATE POLICY "live_streams_insert" ON public.etok_live_streams FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "live_streams_update" ON public.etok_live_streams FOR UPDATE USING (auth.uid() = host_id);
CREATE INDEX idx_live_streams_active ON public.etok_live_streams (is_live, started_at DESC) WHERE is_live = true;

-- ─── Live comments ───────────────────────────────────────
CREATE TABLE public.etok_live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.etok_live_streams(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  text text NOT NULL,
  is_gift boolean NOT NULL DEFAULT false,
  gift_emoji text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_live_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_comments_select" ON public.etok_live_comments FOR SELECT USING (true);
CREATE POLICY "live_comments_insert" ON public.etok_live_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE INDEX idx_live_comments_stream ON public.etok_live_comments (stream_id, created_at DESC);

-- ─── Live viewers (presence) ────────────────────────────
CREATE TABLE public.etok_live_viewers (
  stream_id uuid NOT NULL REFERENCES public.etok_live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stream_id, user_id)
);
ALTER TABLE public.etok_live_viewers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_viewers_select" ON public.etok_live_viewers FOR SELECT USING (true);
CREATE POLICY "live_viewers_insert" ON public.etok_live_viewers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "live_viewers_delete" ON public.etok_live_viewers FOR DELETE USING (auth.uid() = user_id);

-- ─── Scheduled lives ─────────────────────────────────────
CREATE TABLE public.etok_scheduled_lives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Music',
  scheduled_at timestamptz NOT NULL,
  thumbnail_emoji text NOT NULL DEFAULT '📅',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_scheduled_lives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sched_select" ON public.etok_scheduled_lives FOR SELECT USING (true);
CREATE POLICY "sched_insert" ON public.etok_scheduled_lives FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "sched_update" ON public.etok_scheduled_lives FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "sched_delete" ON public.etok_scheduled_lives FOR DELETE USING (auth.uid() = host_id);

CREATE TABLE public.etok_scheduled_reminders (
  scheduled_id uuid NOT NULL REFERENCES public.etok_scheduled_lives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scheduled_id, user_id)
);
ALTER TABLE public.etok_scheduled_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rem_select" ON public.etok_scheduled_reminders FOR SELECT USING (true);
CREATE POLICY "rem_insert" ON public.etok_scheduled_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rem_delete" ON public.etok_scheduled_reminders FOR DELETE USING (auth.uid() = user_id);

-- ─── Coins balance ───────────────────────────────────────
CREATE TABLE public.etok_coins (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 500,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_coins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coins_select" ON public.etok_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coins_insert" ON public.etok_coins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coins_update" ON public.etok_coins FOR UPDATE USING (auth.uid() = user_id);

-- ─── Gifts sent log ──────────────────────────────────────
CREATE TABLE public.etok_gifts_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.etok_live_streams(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  gift_id text NOT NULL,
  gift_emoji text NOT NULL,
  gift_name text NOT NULL,
  coins integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_gifts_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts_select" ON public.etok_gifts_sent FOR SELECT USING (true);
CREATE POLICY "gifts_insert" ON public.etok_gifts_sent FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ─── Sounds library ──────────────────────────────────────
CREATE TABLE public.etok_sounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_name text NOT NULL,
  cover_emoji text NOT NULL DEFAULT '🎵',
  duration integer NOT NULL DEFAULT 30,
  video_count integer NOT NULL DEFAULT 0,
  is_original boolean NOT NULL DEFAULT false,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_sounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sounds_select" ON public.etok_sounds FOR SELECT USING (true);

-- ─── Hashtags ────────────────────────────────────────────
CREATE TABLE public.etok_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  view_count bigint NOT NULL DEFAULT 0,
  trending boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hashtags_select" ON public.etok_hashtags FOR SELECT USING (true);

-- ─── Per-day video analytics ────────────────────────────
CREATE TABLE public.etok_video_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.etok_videos(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  date date NOT NULL,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  avg_watch_percent numeric(5,2) NOT NULL DEFAULT 0,
  source_fyp integer NOT NULL DEFAULT 0,
  source_following integer NOT NULL DEFAULT 0,
  source_search integer NOT NULL DEFAULT 0,
  source_profile integer NOT NULL DEFAULT 0,
  UNIQUE (video_id, date)
);
ALTER TABLE public.etok_video_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vad_select_owner" ON public.etok_video_analytics_daily FOR SELECT USING (auth.uid() = author_id);
CREATE INDEX idx_vad_author_date ON public.etok_video_analytics_daily (author_id, date DESC);

-- ─── Creator rewards ─────────────────────────────────────
CREATE TABLE public.etok_creator_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  views_earned bigint NOT NULL DEFAULT 0,
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_creator_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_select" ON public.etok_creator_rewards FOR SELECT USING (auth.uid() = user_id);

-- ─── Shop items ──────────────────────────────────────────
CREATE TABLE public.etok_shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  emoji text NOT NULL DEFAULT '📦',
  category text NOT NULL DEFAULT 'Other',
  sold integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_select" ON public.etok_shop_items FOR SELECT USING (true);
CREATE POLICY "shop_insert" ON public.etok_shop_items FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "shop_update" ON public.etok_shop_items FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "shop_delete" ON public.etok_shop_items FOR DELETE USING (auth.uid() = seller_id);

-- ─── Series ──────────────────────────────────────────────
CREATE TABLE public.etok_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  episode_count integer NOT NULL DEFAULT 0,
  cover_emoji text NOT NULL DEFAULT '🎬',
  subscribers integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_select" ON public.etok_series FOR SELECT USING (true);
CREATE POLICY "series_insert" ON public.etok_series FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "series_update" ON public.etok_series FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "series_delete" ON public.etok_series FOR DELETE USING (auth.uid() = creator_id);

CREATE TABLE public.etok_series_subscribers (
  series_id uuid NOT NULL REFERENCES public.etok_series(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (series_id, user_id)
);
ALTER TABLE public.etok_series_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sersub_select" ON public.etok_series_subscribers FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.etok_series s WHERE s.id = series_id AND s.creator_id = auth.uid()));
CREATE POLICY "sersub_insert" ON public.etok_series_subscribers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Blocked users (Etok-specific) ──────────────────────
CREATE TABLE public.etok_blocked_users (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
ALTER TABLE public.etok_blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etok_blocks_select" ON public.etok_blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "etok_blocks_insert" ON public.etok_blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "etok_blocks_delete" ON public.etok_blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- ─── Reports ─────────────────────────────────────────────
CREATE TABLE public.etok_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video','user','comment','live')),
  content_id text NOT NULL,
  reason text NOT NULL,
  reported_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select" ON public.etok_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_insert" ON public.etok_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ─── Privacy settings ────────────────────────────────────
CREATE TABLE public.etok_privacy_settings (
  user_id uuid PRIMARY KEY,
  private_account boolean NOT NULL DEFAULT false,
  is_business_account boolean NOT NULL DEFAULT false,
  default_video_privacy text NOT NULL DEFAULT 'everyone' CHECK (default_video_privacy IN ('everyone','friends','only_me')),
  allow_comments text NOT NULL DEFAULT 'everyone' CHECK (allow_comments IN ('everyone','friends','no_one')),
  comment_keywords text[] NOT NULL DEFAULT '{}',
  filter_spam boolean NOT NULL DEFAULT true,
  duet_permission text NOT NULL DEFAULT 'everyone' CHECK (duet_permission IN ('everyone','friends','no_one')),
  stitch_permission text NOT NULL DEFAULT 'everyone' CHECK (stitch_permission IN ('everyone','friends','no_one')),
  allow_download boolean NOT NULL DEFAULT true,
  screen_time_limit_minutes integer NOT NULL DEFAULT 0,
  screen_time_reminder_enabled boolean NOT NULL DEFAULT false,
  screen_time_reminder_interval integer NOT NULL DEFAULT 30,
  family_pairing_linked boolean NOT NULL DEFAULT false,
  family_pairing_email text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_select" ON public.etok_privacy_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ps_insert" ON public.etok_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ps_update" ON public.etok_privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- ─── WebRTC signaling (for real live broadcast) ─────────
CREATE TABLE public.etok_webrtc_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.etok_live_streams(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('offer','answer','ice','request')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etok_webrtc_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rtc_select" ON public.etok_webrtc_signals FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "rtc_insert" ON public.etok_webrtc_signals FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "rtc_delete" ON public.etok_webrtc_signals FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE INDEX idx_rtc_to ON public.etok_webrtc_signals (to_user_id, created_at DESC);

-- ─── Realtime publications ──────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.etok_live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.etok_live_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.etok_live_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.etok_gifts_sent;
ALTER PUBLICATION supabase_realtime ADD TABLE public.etok_webrtc_signals;
