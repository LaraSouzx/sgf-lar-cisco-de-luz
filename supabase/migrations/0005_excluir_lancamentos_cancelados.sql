-- Permite excluir de vez um lançamento, MAS SÓ se ele já estiver cancelado.
--
-- A regra do projeto continua sendo cancelar (mantém o histórico da prestação de contas); excluir é para
-- limpar lançamentos de teste ou registrados por engano, depois de cancelados. A condição fica aqui,
-- no banco, para valer mesmo que alguém tente excluir por fora do app.
--
-- Atenção: o comprovante anexado não é apagado do armazenamento (o bucket não tem policy de DELETE),
-- então o arquivo fica guardado sem lançamento ligado a ele.
create policy "Usuários autenticados excluem lançamentos cancelados"
  on lancamentos for delete
  to authenticated
  using (cancelado = true);
