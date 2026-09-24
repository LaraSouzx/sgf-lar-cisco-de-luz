-- Bucket dos comprovantes dos lançamentos (notas, recibos, fotos). Comprovantes podem conter CPF e dados
-- de terceiros, por isso o bucket é PRIVADO: os arquivos só abrem por link temporário assinado.
--
-- Tipos e tamanho valem aqui também (além da validação do app). Mantenha em sincronia com
-- src/lib/regrasDeComprovante.ts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Só usuário autenticado lê e envia. Não há policy de UPDATE nem de DELETE: nada é apagado ou
-- sobrescrito, então substituir um comprovante grava um arquivo novo e o antigo continua guardado
-- (rastreabilidade da prestação de contas).
create policy "Usuários autenticados leem comprovantes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'comprovantes');

create policy "Usuários autenticados enviam comprovantes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'comprovantes');
