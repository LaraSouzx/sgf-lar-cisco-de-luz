# Publicar o sistema (Vercel + Supabase)

O site roda no **Vercel** (só arquivos estáticos) e conversa direto com o **Supabase** (banco, login e arquivos). Não existe servidor próprio.

Cada `git push` na branch `main` publica uma nova versão automaticamente.

## Antes de começar

- O repositório no GitHub (`LaraSouzx/sgf-lar-cisco-de-luz`) já com o código enviado.
- Um projeto no Supabase (o mesmo usado no desenvolvimento).

## 1. Preparar o banco (Supabase)

1. **SQL Editor > New query.** Aplique, **nesta ordem**, o conteúdo de cada arquivo de `supabase/migrations/`:
   `0001_dashboard_schema.sql`, `0002_doadores_documento.sql`, `0003_comprovantes_storage.sql`.
   Se aparecer "already exists", aquele passo já tinha sido aplicado: siga em frente.
2. **Conferir que todas as tabelas têm RLS ligado** (proteção de acesso por usuário). No SQL Editor:

   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```

   Todas as linhas (`categorias`, `doadores`, `lancamentos`) precisam mostrar `true`.
3. **Storage:** deve existir o bucket `comprovantes` com o cadeado de **Private**.
4. **Criar o usuário da responsável:** Authentication > Users > Add user (com e-mail e senha).

> Não rode os arquivos de `supabase/demo/` no banco de produção: são dados de exemplo.

## 2. Publicar no Vercel

1. Em vercel.com: **Add New > Project** e importe o repositório do GitHub.
2. O Vercel detecta **Vite** sozinho. Deixe o comando de build (`npm run build`) e a pasta de saída (`dist`) como estão.
3. Em **Environment Variables**, cadastre as duas variáveis (valores em Supabase > Project Settings > API):

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | "Project URL" |
   | `VITE_SUPABASE_ANON_KEY` | chave `anon` / `public` |

   **Nunca** use a chave `service_role`: ela tem acesso total ao banco. A `anon` é pública por desenho; quem protege os dados é o RLS.
4. Clique em **Deploy**. Ao terminar, o Vercel mostra o endereço (algo como `https://nome-do-projeto.vercel.app`).

> Se você cadastrar ou alterar uma variável **depois** do primeiro deploy, é preciso publicar de novo (Deployments > menu dos três pontos > Redeploy). As variáveis entram no site na hora do build.

## 3. Ensinar o login sobre o endereço do site (Supabase)

Sem isso o link de "Esqueci minha senha" do e-mail não volta para o site publicado.

Em **Authentication > URL Configuration**:

- **Site URL:** o endereço do Vercel (`https://nome-do-projeto.vercel.app`).
- **Redirect URLs:** adicione
  - `https://nome-do-projeto.vercel.app/redefinir-senha`
  - `http://localhost:5173/redefinir-senha` (para continuar testando no computador)

## 4. Conferir no site publicado

- [ ] Abrir o endereço abre a tela de login.
- [ ] Entrar com o usuário da responsável funciona.
- [ ] Abrir `/categorias` e apertar F5 (recarregar) **não** dá erro 404.
- [ ] Criar uma categoria e um lançamento funciona.
- [ ] Anexar uma foto ou PDF a um lançamento acima de R$ 50,00 e abrir com "Ver comprovante".
- [ ] "Esqueci minha senha": o e-mail chega e o link abre a tela de nova senha **no site publicado** (não em `localhost`).
- [ ] Sem estar logado, abrir `/lancamentos` leva ao login.

## 5. Backup

Em Supabase > Database > Backups, veja o que o **seu plano** oferece. Em planos gratuitos os backups automáticos podem não existir ou ter retenção curta. Se for o caso, exporte os dados com regularidade e guarde a cópia **fora** do computador da responsável (regra do projeto: nunca a única cópia dos dados fica em um só dispositivo).

## Dia a dia

- **Publicar uma mudança:** basta enviar para a `main` (`git push`). O Vercel publica sozinho.
- **Desfazer uma publicação com problema:** Vercel > Deployments > escolha a versão anterior que funcionava > **Promote to Production**.
- **Migrations novas:** o Vercel **não** aplica migrations. Sempre que uma nova entrar em `supabase/migrations/`, aplique no SQL Editor do Supabase (mesmo procedimento do passo 1).

## Se algo der errado

| Sintoma | Causa provável |
|---|---|
| Tela branca ou erro dizendo que `VITE_SUPABASE_URL` precisa estar definida | Variáveis de ambiente não cadastradas, ou cadastradas depois do deploy (faça Redeploy). |
| Erro 404 ao recarregar uma página interna | `vercel.json` não foi enviado para o repositório. |
| Link de redefinir senha leva a um endereço errado ou dá erro | Site URL / Redirect URLs não configurados no Supabase (passo 3). |
| Anexar comprovante dá erro | Migration `0003` não aplicada (passo 1). |
| Lista vazia ou "não foi possível carregar" | Migrations `0001` não aplicadas, ou usuário não está logado. |

## Cuidados

- O plano gratuito do Vercel (Hobby) pode restringir uso comercial. Confira os termos para o caso de uma OSC antes de depender dele.
- Um domínio próprio (ex.: `financeiro.orgexemplo.org.br`) é opcional: Vercel > Settings > Domains. Se adotar, atualize o **Site URL** e os **Redirect URLs** no Supabase.
