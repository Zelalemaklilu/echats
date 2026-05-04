create unique index if not exists idx_etok_sounds_title_author
on public.etok_sounds (lower(title), lower(author_name));

create or replace function public.sync_etok_video_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tag text;
  sound_author text;
begin
  if new.sound_name is not null and length(trim(new.sound_name)) > 0 then
    select coalesce(nullif(username, ''), nullif(name, ''), 'creator')
      into sound_author
    from public.profiles
    where id = new.author_id;

    sound_author := coalesce(sound_author, 'creator');

    insert into public.etok_sounds (title, author_name, cover_emoji, duration, video_count, is_original)
    values (trim(new.sound_name), sound_author, '🎵', greatest(coalesce(new.duration, 1), 1), 1, true)
    on conflict (lower(title), lower(author_name)) do update
      set video_count = public.etok_sounds.video_count + 1,
          duration = greatest(public.etok_sounds.duration, excluded.duration);
  end if;

  if new.hashtags is not null then
    foreach tag in array new.hashtags loop
      tag := lower(regexp_replace(trim(tag), '^#', ''));
      if tag <> '' then
        insert into public.etok_hashtags (name, view_count, trending)
        values (tag, 1, false)
        on conflict (name) do update
          set view_count = public.etok_hashtags.view_count + 1;
      end if;
    end loop;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_etok_video_metadata() from public;
revoke all on function public.sync_etok_video_metadata() from anon;
revoke all on function public.sync_etok_video_metadata() from authenticated;

drop trigger if exists trg_sync_etok_video_metadata on public.etok_videos;
create trigger trg_sync_etok_video_metadata
after insert on public.etok_videos
for each row
execute function public.sync_etok_video_metadata();