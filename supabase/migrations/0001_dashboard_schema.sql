-- Categorias, doadores e lançamentos financeiros.
-- Regras de negócio (ver CONTEXT.md): valor sempre positivo, tipo define o
-- sinal, data não pode ser futura, lançamento nunca é excluído (só
-- cancelado, mantendo histórico) -- por isso não existe policy de DELETE.

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo text not null check (tipo in ('entrada', 'saida')),
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists doadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  tipo text not null check (tipo in ('pessoa_fisica', 'empresa')),
  created_at timestamptz not null default now()
);

create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null check (data <= current_date),
  valor numeric(12, 2) not null check (valor > 0),
  tipo text not null check (tipo in ('entrada', 'saida')),
  categoria_id uuid not null references categorias(id),
  usuario_id uuid not null references auth.users(id) default auth.uid(),
  doador_id uuid references doadores(id),
  descricao text not null,
  comprovante_url text,
  cancelado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table categorias enable row level security;
alter table doadores enable row level security;
alter table lancamentos enable row level security;

-- Qualquer usuário autenticado do sistema pode ler e escrever -- não há
-- exclusão em nenhuma das três tabelas (nenhuma policy de DELETE é criada).
create policy "Usuários autenticados leem categorias"
  on categorias for select
  to authenticated
  using (true);

create policy "Usuários autenticados criam categorias"
  on categorias for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados atualizam categorias"
  on categorias for update
  to authenticated
  using (true);

create policy "Usuários autenticados leem doadores"
  on doadores for select
  to authenticated
  using (true);

create policy "Usuários autenticados criam doadores"
  on doadores for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados atualizam doadores"
  on doadores for update
  to authenticated
  using (true);

create policy "Usuários autenticados leem lançamentos"
  on lancamentos for select
  to authenticated
  using (true);

create policy "Usuários autenticados criam lançamentos"
  on lancamentos for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados atualizam lançamentos"
  on lancamentos for update
  to authenticated
  using (true);
