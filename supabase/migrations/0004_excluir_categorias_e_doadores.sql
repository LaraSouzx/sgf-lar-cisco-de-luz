-- Permite excluir categorias e doadores CADASTRADOS POR ENGANO (ou de teste).
--
-- A regra "com lançamentos vinculados não pode ser excluído" continua valendo sem depender do app:
-- lancamentos.categoria_id e lancamentos.doador_id têm chave estrangeira, então o banco recusa
-- o DELETE de qualquer categoria ou doador que ainda tenha lançamento (inclusive cancelado).
-- Lançamentos continuam sem policy de DELETE: nunca são excluídos, só cancelados.
create policy "Usuários autenticados excluem categorias"
  on categorias for delete
  to authenticated
  using (true);

create policy "Usuários autenticados excluem doadores"
  on doadores for delete
  to authenticated
  using (true);
