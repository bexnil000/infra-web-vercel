-- NEXCORE: perfil, proyectos y tareas. Ejecutar después de supabase_schema.sql.
create extension if not exists pgcrypto;

alter table public.users
  add column if not exists username varchar(30) unique,
  add column if not exists phone varchar(25),
  add column if not exists city varchar(100),
  add column if not exists company varchar(120),
  add column if not exists job_title varchar(120),
  add column if not exists bio varchar(500),
  add column if not exists website varchar(300);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id bigint not null references public.users(id) on delete cascade,
  name varchar(120) not null check (char_length(trim(name)) between 2 and 120),
  description varchar(1000),
  status varchar(20) not null default 'planning' check (status in ('planning','active','paused','completed','archived')),
  priority varchar(10) not null default 'medium' check (priority in ('low','medium','high','urgent')),
  start_date date,
  due_date date,
  color varchar(7) not null default '#3b82f6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id bigint not null references public.users(id) on delete cascade,
  title varchar(160) not null check (char_length(trim(title)) between 2 and 160),
  description varchar(2000),
  status varchar(20) not null default 'pending' check (status in ('pending','in_progress','review','completed')),
  priority varchar(10) not null default 'medium' check (priority in ('low','medium','high','urgent')),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date)
);

create index if not exists projects_owner_status_idx on public.projects(owner_id, status);
create index if not exists projects_owner_updated_idx on public.projects(owner_id, updated_at desc);
create index if not exists tasks_owner_status_idx on public.tasks(owner_id, status);
create index if not exists tasks_project_status_idx on public.tasks(project_id, status);
create index if not exists tasks_due_date_idx on public.tasks(owner_id, due_date);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- La app usa autenticación propia y la service role solo dentro de funciones Vercel.
-- No se concede acceso directo a anon/authenticated: la API valida propietario en cada operación.
revoke all on public.projects, public.tasks from anon, authenticated;
grant all on public.projects, public.tasks to service_role;

