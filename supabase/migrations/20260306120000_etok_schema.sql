-- Etok (TikTok-like) database schema
-- Apply this migration via the Supabase dashboard SQL editor

-- etok_videos: stores all short-form video metadata
create table if not exists public.etok_videos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  thumbnail_url text,
  description text not null default '',
  hashtags text[] not null default '{}',
  sound_name text not null default 'Original Sound',
  duration integer not null default 15,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  privacy text not null default 'everyone' check (privacy in ('everyone', 'friends', 'only_me')),
  allow_comments boolean not null default true,
  allow_duet boolean not null default true,
  allow_stitch boolean not null default true,
  allow_download boolean not null default true,
  is_sponsored boolean not null default false,
  created_at timestamptz not null default now()
);

-- etok_likes: user likes on videos
create table if not exists public.etok_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.etok_videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, video_id)
);

-- etok_comments: comments on videos
create table if not exists public.etok_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.etok_videos(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  likes integer not null default 0,
  is_pinned boolean not null default false,
  parent_id uuid references public.etok_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- etok_follows: follow relationships
create table if not exists public.etok_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- Enable RLS
alter table public.etok_videos enable row level security;
alter table public.etok_likes enable row level security;
alter table public.etok_comments enable row level security;
alter table public.etok_follows enable row level security;

-- RLS policies: anyone can read public videos; authenticated users can write
create policy "Public videos are viewable by everyone" on public.etok_videos
  for select using (privacy = 'everyone' or auth.uid() = author_id);

create policy "Users can insert their own videos" on public.etok_videos
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own videos" on public.etok_videos
  for update using (auth.uid() = author_id);

create policy "Likes are viewable by everyone" on public.etok_likes
  for select using (true);

create policy "Users can manage their own likes" on public.etok_likes
  for all using (auth.uid() = user_id);

create policy "Comments are viewable by everyone" on public.etok_comments
  for select using (true);

create policy "Users can insert their own comments" on public.etok_comments
  for insert with check (auth.uid() = author_id);

create policy "Users can delete their own comments" on public.etok_comments
  for delete using (auth.uid() = author_id);

create policy "Follows are viewable by everyone" on public.etok_follows
  for select using (true);

create policy "Users can manage their own follows" on public.etok_follows
  for all using (auth.uid() = follower_id);

-- Storage bucket for video files
-- Run this in the Supabase dashboard Storage section:
-- Create a bucket named 'etok-videos' and set it to public
