-- DADOS FICTÍCIOS PARA DEMONSTRAÇÃO -- não é uma migration e não deve ser aplicada em produção.
-- Como usar: Supabase Dashboard > SQL Editor > cole este arquivo e execute.
-- Para desfazer: execute remover-dados-ficticios.sql.
--
-- Pode ser executado mais de uma vez: categorias e doadores só são criados se ainda não existirem,
-- e os lançamentos só entram se não houver lançamentos de exemplo. As datas são relativas a hoje,
-- então o dashboard sempre mostra movimentação recente. Documentos são exemplos de teste, não pessoas reais.

do $$
declare
  usuario uuid := (select id from auth.users order by created_at limit 1);
begin
  if usuario is null then
    raise exception 'Crie um usuário em Authentication > Users antes de rodar este script.';
  end if;

  insert into categorias (nome, tipo)
  select nome, tipo
  from (values
    ('Doação', 'entrada'),
    ('Bazar beneficente', 'entrada'),
    ('Aluguel', 'saida'),
    ('Alimentação', 'saida'),
    ('Energia elétrica', 'saida'),
    ('Material de limpeza', 'saida')
  ) as novas(nome, tipo)
  where not exists (select 1 from categorias where categorias.nome = novas.nome);

  insert into doadores (nome, tipo, documento)
  select nome, tipo, documento
  from (values
    ('Maria Souza (exemplo)', 'pessoa_fisica', '52998224725'),
    ('João Pereira (exemplo)', 'pessoa_fisica', '11144477735'),
    ('Padaria Boa Massa (exemplo)', 'empresa', '11222333000181'),
    ('Ana Lima (exemplo)', 'pessoa_fisica', null)
  ) as novos(nome, tipo, documento)
  where not exists (select 1 from doadores where doadores.nome = novos.nome);

  if exists (select 1 from lancamentos where descricao like '[exemplo]%') then
    raise notice 'Lançamentos de exemplo já existem; nada foi inserido.';
    return;
  end if;

  insert into lancamentos (data, valor, tipo, categoria_id, usuario_id, doador_id, descricao, cancelado)
  select
    current_date - dias,
    valor,
    tipo,
    (select id from categorias where nome = categoria),
    usuario,
    (select id from doadores where nome = doador),
    '[exemplo] ' || descricao,
    cancelado
  from (values
    (2,  500.00, 'entrada', 'Doação',              'Maria Souza (exemplo)',       'Doação mensal',                false),
    (4,  1200.00, 'entrada', 'Doação',             'Padaria Boa Massa (exemplo)', 'Doação de empresa parceira',   false),
    (6,  850.00, 'entrada', 'Bazar beneficente',   null::text,                    'Vendas do bazar de sábado',    false),
    (8,  300.00, 'entrada', 'Doação',              'João Pereira (exemplo)',      'Doação avulsa',                false),
    (10, 1800.00, 'saida',  'Aluguel',             null::text,                    'Aluguel da sede',              false),
    (12, 320.50, 'saida',   'Energia elétrica',    null::text,                    'Conta de luz',                 false),
    (14, 640.00, 'saida',   'Alimentação',         null::text,                    'Compras do mês no atacado',    false),
    (16, 145.90, 'saida',   'Material de limpeza', null::text,                    'Produtos de limpeza',          false),
    (18, 200.00, 'entrada', 'Doação',              'Ana Lima (exemplo)',          'Doação pelo PIX',              false),
    (20, 99.90,  'saida',   'Alimentação',         null::text,                    'Compra lançada por engano',    true),
    (35, 500.00, 'entrada', 'Doação',              'Maria Souza (exemplo)',       'Doação mensal',                false),
    (38, 1800.00, 'saida',  'Aluguel',             null::text,                    'Aluguel da sede',              false),
    (41, 290.75, 'saida',   'Energia elétrica',    null::text,                    'Conta de luz',                 false),
    (45, 720.00, 'saida',   'Alimentação',         null::text,                    'Compras do mês no atacado',    false),
    (48, 600.00, 'entrada', 'Bazar beneficente',   null::text,                    'Vendas do bazar',              false),
    (52, 250.00, 'entrada', 'Doação',              'João Pereira (exemplo)',      'Doação avulsa',                false)
  ) as v(dias, valor, tipo, categoria, doador, descricao, cancelado);
end $$;
