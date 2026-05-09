-- ============================================================
-- GROCERY OVERHAUL — single perpetual list per user.
-- Replaces multi-list model (grocery_lists + grocery_items) with
-- per-user aisles + per-user items.
-- ============================================================

drop table if exists grocery_items cascade;
drop table if exists grocery_lists cascade;

create table grocery_aisles (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table grocery_items (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  aisle_id      uuid references grocery_aisles(id) on delete set null,
  name          text not null,
  quantity      text,
  unit          text,
  source_recipe text,
  checked       boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index grocery_aisles_user_idx on grocery_aisles(user_id, sort_order);
create index grocery_items_user_idx  on grocery_items(user_id, aisle_id, sort_order);

alter table grocery_aisles enable row level security;
alter table grocery_items  enable row level security;

create policy "owner_all" on grocery_aisles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on grocery_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
