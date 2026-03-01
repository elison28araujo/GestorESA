-- 1) PERFIL DO USUÁRIO (ROLE)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'operator', -- 'admin' | 'operator'
  name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_read_own" on profiles;
create policy "profiles_read_own"
on profiles for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
on profiles for update
using (id = auth.uid());

-- Admin pode ler/alterar qualquer profile
drop policy if exists "profiles_admin_all" on profiles;
create policy "profiles_admin_all"
on profiles for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));


-- 2) ADD owner_id NAS TABELAS
alter table customers add column if not exists owner_id uuid references auth.users(id);
alter table servers add column if not exists owner_id uuid references auth.users(id);
alter table transactions add column if not exists owner_id uuid references auth.users(id);
alter table plans add column if not exists owner_id uuid references auth.users(id);

-- 3) REMOVER POLÍTICAS "PÚBLICAS" (muito perigoso)
-- customers
drop policy if exists "Allow public read access on customers" on customers;
drop policy if exists "Allow public insert access on customers" on customers;
drop policy if exists "Allow public update access on customers" on customers;
drop policy if exists "Allow public delete access on customers" on customers;

-- servers
drop policy if exists "Allow public read access on servers" on servers;
drop policy if exists "Allow public insert access on servers" on servers;
drop policy if exists "Allow public update access on servers" on servers;
drop policy if exists "Allow public delete access on servers" on servers;

-- transactions
drop policy if exists "Allow public read access on transactions" on transactions;
drop policy if exists "Allow public insert access on transactions" on transactions;
drop policy if exists "Allow public update access on transactions" on transactions;
drop policy if exists "Allow public delete access on transactions" on transactions;

-- plans
drop policy if exists "Allow public read access on plans" on plans;
drop policy if exists "Allow public insert access on plans" on plans;
drop policy if exists "Allow public update access on plans" on plans;
drop policy if exists "Allow public delete access on plans" on plans;


-- 4) POLÍTICAS CORRETAS (OPERADOR = apenas dele / ADMIN = tudo)

-- helper: admin check
-- (não é função, é só padrão de expressão repetida)
-- exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')

-- CUSTOMERS
create policy "customers_select"
on customers for select
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "customers_insert"
on customers for insert
with check (owner_id = auth.uid());

create policy "customers_update"
on customers for update
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "customers_delete"
on customers for delete
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

-- SERVERS
create policy "servers_select"
on servers for select
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "servers_insert"
on servers for insert
with check (owner_id = auth.uid());

create policy "servers_update"
on servers for update
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "servers_delete"
on servers for delete
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

-- TRANSACTIONS
create policy "transactions_select"
on transactions for select
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "transactions_insert"
on transactions for insert
with check (owner_id = auth.uid());

create policy "transactions_update"
on transactions for update
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "transactions_delete"
on transactions for delete
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

-- PLANS (se quiser que planos sejam por operador)
create policy "plans_select"
on plans for select
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "plans_insert"
on plans for insert
with check (owner_id = auth.uid());

create policy "plans_update"
on plans for update
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);

create policy "plans_delete"
on plans for delete
using (
  owner_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')
);
