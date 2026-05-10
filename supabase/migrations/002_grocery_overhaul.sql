-- ============================================================
-- GROCERY OVERHAUL — single perpetual flat list per user.
-- Replaces the multi-list model (grocery_lists + grocery_items)
-- with one flat per-user grocery_items table. No aisles, no
-- categories — items are ordered by sort_order with checked
-- items rendered at the bottom by the UI.
-- ============================================================

drop table if exists grocery_items cascade;
drop table if exists grocery_lists cascade;

create table grocery_items (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  quantity      text,
  unit          text,
  -- Comma-separated recipe titles when sourced from the meal-plan
  -- suggestions panel; null for manually-added items.
  source_recipe text,
  checked       boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index grocery_items_user_idx on grocery_items(user_id, sort_order);

alter table grocery_items enable row level security;

create policy "owner_all" on grocery_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
