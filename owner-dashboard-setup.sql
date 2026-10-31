create table public.store_admins (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.store_admins enable row level security;
revoke all on public.store_admins from anon, authenticated;
grant select on public.store_admins to authenticated;

create policy "Owners can read their own admin record"
on public.store_admins for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.store_admins
        where user_id = (select auth.uid())
    );
$$;

grant execute on function public.is_store_admin() to anon, authenticated;

create table public.products (
    id uuid primary key default gen_random_uuid(),
    sku text not null default '',
    name text not null check (length(trim(name)) > 0),
    description text not null default '',
    specifications text not null default '',
    price_usd numeric(12, 2) not null check (price_usd >= 0),
    discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
    image_url text not null default '',
    image_urls text[] not null default '{}',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Run these ALTER statements when the products table already exists.
alter table public.products add column if not exists sku text not null default '';
alter table public.products add column if not exists specifications text not null default '';
alter table public.products add column if not exists discount_percent numeric(5, 2) not null default 0;
alter table public.products add column if not exists image_urls text[] not null default '{}';
alter table public.products add column if not exists setup_category text not null default '';
alter table public.products drop constraint if exists products_discount_percent_check;
alter table public.products add constraint products_discount_percent_check check (discount_percent >= 0 and discount_percent <= 100);

alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create policy "Anyone can read active products"
on public.products for select to anon, authenticated
using (is_active or (select public.is_store_admin()));

create policy "Owners can add products"
on public.products for insert to authenticated
with check ((select public.is_store_admin()));

create policy "Owners can edit products"
on public.products for update to authenticated
using ((select public.is_store_admin()))
with check ((select public.is_store_admin()));

create policy "Owners can delete products"
on public.products for delete to authenticated
using ((select public.is_store_admin()));

create table public.site_content (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

create policy "Anyone can read site content"
on public.site_content for select to anon, authenticated
using (true);

create policy "Owners can add site content"
on public.site_content for insert to authenticated
with check ((select public.is_store_admin()));

create policy "Owners can edit site content"
on public.site_content for update to authenticated
using ((select public.is_store_admin()))
with check ((select public.is_store_admin()));

insert into public.site_content (key, value)
values
    ('home_title', 'Next-Gen Gaming Laptops & Custom Rigs'),
    ('home_body', 'Discover top-tier laptops, custom PC builds, and gaming accessories with official warranty and fast local delivery.'),
    ('about_title', 'About RezekeeeShop'),
    ('about_body', 'Welcome to RezekeeeShop, your trusted online destination for top-quality computer hardware, laptops, custom desktop PCs, and tech accessories in Cambodia.')
on conflict (key) do nothing;

-- First create the owner's email/password account in Supabase Authentication.
-- Then replace the email below and run this statement to grant owner access:
-- insert into public.store_admins (user_id)
-- select id from auth.users where email = 'OWNER_EMAIL@example.com'
-- on conflict (user_id) do nothing;
