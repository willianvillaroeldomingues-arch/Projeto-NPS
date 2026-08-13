# NPS · CS

Ferramenta interna para enviar formulários de NPS aos clientes, acompanhar
o histórico individual de cada um e ver a evolução do NPS geral ao longo
do tempo.

## O que já está pronto

- Schema completo no Supabase (`schema_nps.sql`)
- Dashboard geral (`/`) — protegido por login
- Pasta de cada cliente (`/clientes/[id]`) — histórico completo de respostas
- Criação de rodada + geração de links (`/nova-rodada`)
- Formulário público (`/responder/[token]`) — sem necessidade de login
- API routes seguras (`/api/nps/link`, `/api/nps/responder`) usando a
  chave secreta do Supabase, nunca exposta no navegador

## Antes de rodar: criar seu usuário de acesso

O painel (`/`, `/clientes`, `/nova-rodada`) exige login. Ainda não existe
tela de cadastro pública — de propósito, pra só a equipe de CS entrar.
Pra criar o primeiro usuário:

1. No Supabase, vá em **Authentication → Users → Add user**
2. Crie com seu email e uma senha
3. Use esse email/senha na tela de login do site

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — vai pedir login.

O arquivo `.env.local` já está preenchido com a URL e a chave publishable
do seu projeto Supabase. **Falta só uma coisa**: abra `.env.local` e troque
`cole_aqui_sua_secret_key` pela sua **secret key** (Supabase →
Project Settings → API → Secret keys). Sem ela, o formulário público e a
criação de rodadas não funcionam, porque essas ações passam pelas API
routes que usam essa chave.

## Cadastrando clientes

Por enquanto, cadastre os clientes direto pela tabela `clients` no
Supabase (Table Editor → clients → Insert row). Se quiser, no próximo
passo eu monto uma tela de cadastro de clientes dentro do próprio painel.

## Publicando (deploy)

1. Suba este projeto para um repositório no GitHub (ele já tem `.gitignore`
   configurado pra não subir o `.env.local` com suas chaves)
2. Na Netlify: **Add new site → Import an existing project** → selecione
   o repositório
3. Em **Site settings → Environment variables**, adicione as 3 variáveis
   que estão no seu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. O `netlify.toml` já está configurado com o plugin do Next.js.

## Fluxo de uso mensal

1. Logue no painel
2. Clique em **+ Nova rodada**, dê um título (ex: "NPS Outubro/2026") e
   confirme
3. O sistema gera um link único por cliente ativo — copie e envie
   (WhatsApp, email, etc)
4. Conforme os clientes respondem, os dados aparecem automaticamente no
   dashboard geral e na pasta de cada cliente
