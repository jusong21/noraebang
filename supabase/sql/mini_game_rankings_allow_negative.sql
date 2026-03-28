-- =============================================================================
-- mini_game_rankings: allow negative scores (Supabase SQL Editor에서 순서대로 실행)
-- 증상: 음수 점수가 저장 안 되거나 / 랭킹 조회에 안 보일 때
-- 원인: (1) 테이블 CHECK 제약 (score >= 0)  (2) RLS의 WITH CHECK (score >= 0)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) 현재 정책·제약 확인 (이름을 알고 나서 아래에서 drop/교체)
-- ---------------------------------------------------------------------------
-- select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.mini_game_rankings'::regclass;

-- select policyname, cmd, roles, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and tablename = 'mini_game_rankings';

-- ---------------------------------------------------------------------------
-- 1) 테이블 CHECK: 음수 허용 (제약 이름이 다르면 Table → mini_game_rankings → Constraints에서 확인 후 수정)
-- ---------------------------------------------------------------------------
alter table public.mini_game_rankings
  drop constraint if exists mini_game_rankings_score_check;

alter table public.mini_game_rankings
  add constraint mini_game_rankings_score_check
  check (score between -10000 and 10000);

-- ---------------------------------------------------------------------------
-- 2) RLS: INSERT 정책이 score >= 0 이면 음수 insert가 거부됨
--    Dashboard → Authentication → Policies → mini_game_rankings 에서 INSERT 정책의
--    WITH CHECK 식을 열어서 음수 구간을 허용하거나, 아래처럼 정책을 새로 만든다.
--
--    기존 INSERT 정책 이름을 0) 쿼리로 확인한 뒤, 그 이름으로 DROP:
--    drop policy if exists "여기에_기존_정책_이름" on public.mini_game_rankings;
--
--    anon(브라우저에서 쓰는 공개 키)이 넣을 수 있게 예시:
-- ---------------------------------------------------------------------------
-- drop policy if exists "mini_game_rankings_insert_anon" on public.mini_game_rankings;
--
-- create policy "mini_game_rankings_insert_anon"
--   on public.mini_game_rankings
--   for insert
--   to anon
--   with check (score between -10000 and 10000);

-- SELECT도 음수 행을 막는 정책은 드물지만, 있다면 USING 절에서 score >= 0 을 쓰고 있으면 같은 방식으로 수정.

-- ---------------------------------------------------------------------------
-- 3) 확인: 음수 한 줄 넣어보기 (끝나면 delete로 지워도 됨)
-- ---------------------------------------------------------------------------
-- insert into public.mini_game_rankings (nickname, score)
-- values ('__test_negative__', -5);
--
-- select * from public.mini_game_rankings where nickname = '__test_negative__';
-- delete from public.mini_game_rankings where nickname = '__test_negative__';
