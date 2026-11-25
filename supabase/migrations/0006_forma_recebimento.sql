-- Como cada entrada foi recebida. Doação em dinheiro vivo não tem comprovante, então o sistema
-- precisa saber a forma para dispensá-lo (as regras de doador e comprovante ficam no app).
--
-- Anulável de propósito: saídas não têm forma, e as entradas lançadas antes desta migração ficam
-- sem valor em vez de receberem um palpite.
alter table lancamentos
  add column if not exists forma_recebimento text
  check (forma_recebimento in ('dinheiro', 'pix', 'transferencia', 'outro'));
