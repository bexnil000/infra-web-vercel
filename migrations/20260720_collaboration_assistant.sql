-- NEXCORE: colaboración, comentarios y notificaciones.
alter table public.tasks add column if not exists assignee_id bigint references public.users(id) on delete set null;

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  role varchar(20) not null default 'collaborator' check (role in ('manager','collaborator','viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id bigint not null references public.users(id) on delete cascade,
  body varchar(1200) not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.users(id) on delete cascade,
  type varchar(40) not null,
  title varchar(160) not null,
  message varchar(500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists task_comments_task_idx on public.task_comments(task_id, created_at);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id, status);

alter table public.project_members enable row level security;
alter table public.task_comments enable row level security;
alter table public.notifications enable row level security;
revoke all on public.project_members, public.task_comments, public.notifications from anon, authenticated;
grant all on public.project_members, public.task_comments, public.notifications to service_role;
