-- O documento (CPF/CNPJ) identifica o doador: sem unicidade, o mesmo doador poderia ser cadastrado
-- duas vezes e distorcer a contagem de "doadores do mês". O índice é parcial porque o documento é
-- opcional -- vários doadores sem documento continuam permitidos.
create unique index if not exists doadores_documento_unico
  on doadores (documento)
  where documento is not null;

-- O documento é guardado só com dígitos (11 de CPF ou 14 de CNPJ); a máscara é aplicada na tela.
alter table doadores
  add constraint doadores_documento_formato
  check (documento is null or documento ~ '^([0-9]{11}|[0-9]{14})$');
