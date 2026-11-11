-- =====================================================================
-- 24AGÁ · Atendimento inteligente — estrutura do banco (Supabase / Postgres)
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
-- Pode rodar de novo sem quebrar (usa "if not exists" / "or replace").
-- Cada clínica (tenant) só enxerga os próprios dados (RLS).
-- O dono da plataforma (ROITY Academy) vê clientes, planos e consumo — nunca pacientes.
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- Plataforma ----------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text not null check (niche in ('estetica','odonto','medico','bemestar')),
  slogan text,
  city text,
  timezone text not null default 'America/Cuiaba',
  whatsapp_phone_id text,              -- id do número na Meta Cloud API
  status text not null default 'implantacao' check (status in ('implantacao','ativa','em_atraso','suspensa','cancelada')),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan text not null check (plan in ('essencial','profissional','premium')),
  monthly_price numeric(10,2) not null,
  setup_price numeric(10,2) not null default 0,
  conversations_limit int not null,
  billing_customer_id text,            -- id do cliente no Asaas
  status text not null default 'ativa' check (status in ('ativa','em_atraso','cancelada')),
  started_at date not null default current_date,
  min_months int not null default 6,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','recepcao','profissional')),
  display_name text,
  primary key (tenant_id, user_id)
);

-- ---------- Funções de acesso ----------
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where tenant_id = t and user_id = auth.uid());
$$;

create or replace function public.has_role(t uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where tenant_id = t and user_id = auth.uid() and role = any(roles));
$$;

-- ---------- Clínica ----------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null, short_name text, title text, registration text,
  role text not null default 'profissional' check (role in ('admin','recepcao','profissional')),
  active boolean not null default true
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, category text,
  duration_min int not null default 60, gap_min int not null default 10,
  price numeric(10,2),
  description text,
  ai_text text,                        -- texto aprovado que a IA pode usar
  keywords text,                       -- palavras que fazem a IA reconhecer o serviço
  active boolean not null default true
);

create table if not exists public.business_hours (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  opens time, closes time, lunch_start time, lunch_end time,
  primary key (tenant_id, weekday)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, phone text, email text,
  origin text, stage text not null default 'Novo contato',
  tags text[] not null default '{}', interests uuid[] not null default '{}',
  preference text, marketing_consent boolean not null default false,
  notes text,
  created_at timestamptz not null default now(), last_contact_at timestamptz
);
create index if not exists patients_tenant_phone on public.patients(tenant_id, phone);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid not null references public.staff(id),
  room_id uuid references public.rooms(id),
  kind text not null default 'avaliacao' check (kind in ('avaliacao','sessao','retorno','bloqueio','encaixe')),
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'solicitado' check (status in ('solicitado','reservado','confirmado','compareceu','concluido','cancelado','falta','bloqueio')),
  origin text not null default 'manual' check (origin in ('manual','ia')),
  cancel_reason text, notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- a garantia de "sem horário duplicado" fica no próprio banco:
  constraint no_overlap_professional exclude using gist (
    professional_id with =, tstzrange(starts_at, ends_at) with &&
  ) where (status not in ('cancelado','falta'))
);

create table if not exists public.appointment_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  at timestamptz not null default now(), by_name text, what text not null
);

-- Avaliação clínica: só admin e profissional (a recepção não vê)
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.staff(id),
  goal text, observations text, plan text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  channel text not null default 'whatsapp',
  state text not null default 'ia' check (state in ('ia','aguardando','humano','resolvida')),
  context jsonb not null default '{}',
  last_message_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('paciente','ia','humano','sistema')),
  body text not null,
  wa_message_id text,
  at timestamptz not null default now()
);
create index if not exists messages_conv on public.messages(conversation_id, at);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references public.staff(id),
  number text not null,
  status text not null default 'rascunho' check (status in ('rascunho','pronta para revisão','entregue','aguardando retorno','aceita','não aceita','expirada')),
  items jsonb not null default '[]',
  discount numeric(10,2) not null default 0,
  message text, objective text, payment text, notes text,
  valid_days int not null default 15,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null, body text not null, link text,
  read_at timestamptz, at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  body text not null, assignee uuid references public.staff(id),
  due_date date, done boolean not null default false
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, trigger text not null, template text not null,
  active boolean not null default true
);

create table if not exists public.ai_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  assistant_name text not null default 'Assistente 24h',
  enabled boolean not null default true,
  require_approval boolean not null default true,
  human_start time not null default '08:00', human_end time not null default '19:00',
  intro text, approved_messages text[] not null default '{}',
  payments_text text, address text, eval_price text, cancel_policy text
);

-- Consumo mensal (para limite do plano e cobrança de excedente)
create table if not exists public.usage_monthly (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  month date not null,
  ai_conversations int not null default 0,
  ai_cost_brl numeric(10,2) not null default 0,
  wa_templates int not null default 0,
  primary key (tenant_id, month)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  body text not null, status text not null default 'aberto' check (status in ('aberto','resolvido')),
  created_at timestamptz not null default now()
);

-- ---------- Follow-up automático ----------
create table if not exists public.followup_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  enabled boolean not null default true,
  stop_on_reply boolean not null default true,
  stop_on_booking boolean not null default true,
  quiet_start time default '20:00', quiet_end time default '08:00',
  skip_closed_days boolean not null default true,
  skip_health boolean not null default true,
  ai_personalize boolean not null default true,
  triggers text[] not null default '{semResposta,naoAgendou,proposta,faltou}'
);

create table if not exists public.followup_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  position int not null,
  delay_minutes int not null check (delay_minutes > 0),   -- 60 = 1 hora, 1440 = 1 dia, 4320 = 3 dias
  template text not null,
  wa_template_name text,                                  -- modelo aprovado pela Meta (fora da janela de 24h)
  active boolean not null default true
);

create table if not exists public.followup_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  reason text not null check (reason in ('semResposta','naoAgendou','proposta','faltou')),
  status text not null default 'ativo' check (status in ('ativo','respondeu','agendou','parou','concluido','pausado','saude')),
  current_step int not null default 0,
  last_message_at timestamptz not null default now(),
  next_send_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists followup_due on public.followup_runs(next_send_at) where status = 'ativo';

alter table public.patients add column if not exists followup_opt_out boolean not null default false;

-- ---------- Leads do site (formulário "Quero a 24h") ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  clinic text not null check (char_length(clinic) between 2 and 160),
  whatsapp text not null check (char_length(whatsapp) between 10 and 25),
  city text check (char_length(city) <= 80),
  niche text check (niche in ('estetica','odonto','medico','bemestar')),
  plan text check (plan in ('essencial','profissional','premium','indefinido')),
  consent boolean not null check (consent),
  source text check (char_length(source) <= 40),
  status text not null default 'novo' check (status in ('novo','contatado','demonstracao','fechado','perdido')),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Segurança (RLS)
-- =====================================================================
alter table public.platform_admins enable row level security;
alter table public.tenants          enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.memberships      enable row level security;
alter table public.leads            enable row level security;
alter table public.usage_monthly    enable row level security;
alter table public.support_tickets  enable row level security;

-- Tabelas da clínica: membro da clínica lê e escreve; ninguém de fora vê.
do $$
declare t text;
begin
  foreach t in array array['staff','rooms','services','business_hours','patients','appointments','appointment_log',
                           'conversations','messages','proposals','notifications','tasks','automations','ai_settings',
                           'followup_settings','followup_steps','followup_runs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists tenant_rw on public.%I', t);
    execute format('create policy tenant_rw on public.%I for all to authenticated
                    using (public.is_member(tenant_id)) with check (public.is_member(tenant_id))', t);
  end loop;
end $$;

-- Avaliações: só admin e profissional
alter table public.evaluations enable row level security;
drop policy if exists eval_clinical on public.evaluations;
create policy eval_clinical on public.evaluations for all to authenticated
  using (public.has_role(tenant_id, array['admin','profissional']))
  with check (public.has_role(tenant_id, array['admin','profissional']));

-- Clínica vê a própria ficha; dono da plataforma vê todas
drop policy if exists tenants_read on public.tenants;
create policy tenants_read on public.tenants for select to authenticated
  using (public.is_member(id) or public.is_platform_admin());
drop policy if exists tenants_admin on public.tenants;
create policy tenants_admin on public.tenants for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists subs_read on public.subscriptions;
create policy subs_read on public.subscriptions for select to authenticated
  using (public.has_role(tenant_id, array['admin']) or public.is_platform_admin());
drop policy if exists subs_admin on public.subscriptions;
create policy subs_admin on public.subscriptions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists usage_read on public.usage_monthly;
create policy usage_read on public.usage_monthly for select to authenticated
  using (public.has_role(tenant_id, array['admin']) or public.is_platform_admin());

drop policy if exists tickets_rw on public.support_tickets;
create policy tickets_rw on public.support_tickets for all to authenticated
  using (public.is_member(tenant_id) or public.is_platform_admin())
  with check (public.is_member(tenant_id) or public.is_platform_admin());

drop policy if exists members_read on public.memberships;
create policy members_read on public.memberships for select to authenticated
  using (user_id = auth.uid() or public.has_role(tenant_id, array['admin']) or public.is_platform_admin());
drop policy if exists members_admin on public.memberships;
create policy members_admin on public.memberships for all to authenticated
  using (public.has_role(tenant_id, array['admin']) or public.is_platform_admin())
  with check (public.has_role(tenant_id, array['admin']) or public.is_platform_admin());

drop policy if exists pa_self on public.platform_admins;
create policy pa_self on public.platform_admins for select to authenticated using (user_id = auth.uid());

-- Leads: o site (anônimo) só consegue INSERIR; ler e editar só o dono da plataforma.
drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert to anon, authenticated
  with check (consent and status = 'novo');
drop policy if exists leads_admin on public.leads;
create policy leads_admin on public.leads for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

grant insert on public.leads to anon;

-- =====================================================================
-- Depois de criar o seu usuário em Authentication → Users, rode (trocando o e-mail):
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = 'SEU-EMAIL-AQUI';
-- =====================================================================
