-- Remove SÓ os dados criados por dados-ficticios.sql.
-- Como usar: Supabase Dashboard > SQL Editor > cole este arquivo e execute.
-- O SQL Editor ignora o RLS, por isso consegue apagar (o app nunca apaga nada).
--
-- Os lançamentos de exemplo são identificados pelo prefixo "[exemplo]" e os doadores pelo sufixo
-- "(exemplo)". As categorias só são apagadas se nenhum lançamento seu usar.

delete from lancamentos where descricao like '[exemplo]%';

delete from doadores
where nome like '% (exemplo)'
  and not exists (select 1 from lancamentos where lancamentos.doador_id = doadores.id);

delete from categorias
where nome in ('Doação', 'Bazar beneficente', 'Aluguel', 'Alimentação', 'Energia elétrica', 'Material de limpeza')
  and not exists (select 1 from lancamentos where lancamentos.categoria_id = categorias.id);
