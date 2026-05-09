-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- TABLES
-- ============================================================

create table cookbooks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  cover_image text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table recipes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  description    text,
  source_url     text,
  source_type    text check (source_type in ('url','paste','manual')) not null default 'manual',
  cover_image    text,
  servings       integer not null default 4,
  prep_time_mins integer,
  cook_time_mins integer,
  cuisine        text,
  tags           text[] not null default '{}',
  calories       numeric(8,2),
  protein_g      numeric(8,2),
  carbs_g        numeric(8,2),
  fat_g          numeric(8,2),
  share_token    text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table ingredients (
  id          uuid primary key default uuid_generate_v4(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  sort_order  integer not null default 0,
  name        text not null,
  quantity    numeric(10,4),
  unit        text,
  notes       text
);

create table steps (
  id           uuid primary key default uuid_generate_v4(),
  recipe_id    uuid not null references recipes(id) on delete cascade,
  step_number  integer not null,
  instruction  text not null
);

create table recipe_cookbooks (
  recipe_id   uuid not null references recipes(id) on delete cascade,
  cookbook_id uuid not null references cookbooks(id) on delete cascade,
  primary key (recipe_id, cookbook_id)
);

create table meal_plan_slots (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  day_of_week integer not null check (day_of_week between 1 and 7),
  meal_type   text not null check (meal_type in ('breakfast','lunch','dinner')),
  recipe_id   uuid references recipes(id) on delete set null,
  unique (user_id, week_start, day_of_week, meal_type)
);

create table grocery_lists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table grocery_items (
  id              uuid primary key default uuid_generate_v4(),
  grocery_list_id uuid not null references grocery_lists(id) on delete cascade,
  name            text not null,
  quantity        text,
  unit            text,
  aisle           text,
  source_recipe   text,
  checked         boolean not null default false,
  sort_order      integer not null default 0
);

-- ============================================================
-- INDEXES
-- ============================================================
create index recipes_user_id_idx       on recipes(user_id);
create index recipes_share_token_idx   on recipes(share_token) where share_token is not null;
create index recipes_title_trgm_idx    on recipes using gin(title gin_trgm_ops);
create index recipes_tags_idx          on recipes using gin(tags);
create index ingredients_recipe_id_idx on ingredients(recipe_id, sort_order);
create index steps_recipe_id_idx       on steps(recipe_id, step_number);
create index meal_plan_user_week_idx   on meal_plan_slots(user_id, week_start);
create index grocery_items_list_idx    on grocery_items(grocery_list_id, aisle, sort_order);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

create trigger cookbooks_updated_at
  before update on cookbooks
  for each row execute function set_updated_at();

create trigger grocery_lists_updated_at
  before update on grocery_lists
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table cookbooks        enable row level security;
alter table recipes          enable row level security;
alter table ingredients      enable row level security;
alter table steps            enable row level security;
alter table recipe_cookbooks enable row level security;
alter table meal_plan_slots  enable row level security;
alter table grocery_lists    enable row level security;
alter table grocery_items    enable row level security;

create policy "owner_all" on cookbooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on meal_plan_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on grocery_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on ingredients
  for all using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

create policy "owner_all" on steps
  for all using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

create policy "owner_all" on recipe_cookbooks
  for all using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

create policy "owner_all" on grocery_items
  for all using (
    exists (select 1 from grocery_lists gl where gl.id = grocery_list_id and gl.user_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKET SETUP NOTE
-- ============================================================
-- After running this migration, create the storage bucket via the Supabase dashboard:
--   Bucket name: recipe-images
--   Public: yes
--   File size limit: 10MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/avif
--
-- RLS policy on storage.objects (in dashboard or via API):
--   SELECT: public (allow all)
--   INSERT/UPDATE/DELETE: auth.uid()::text = (storage.foldername(name))[1]
