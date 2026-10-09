# Barbearia do Rafa — integração Supabase

## Atualizar no seu computador (sem perder sua configuração)

1. Faça backup da sua pasta atual.
2. Extraia o ZIP. Copie os arquivos da pasta `barbearia-do-rafa` extraída para sua pasta atual no VS Code, substituindo os arquivos correspondentes. **Não apague seu `.env.local`** e não copie sua pasta `.git` ou `node_modules`.
3. No terminal da pasta atual: `npm install` e `npm run dev`.
4. Teste no localhost uma reserva com data futura. Confira no Supabase > Table Editor > agendamentos se ela foi registrada. Use dados de teste, não pessoais.
5. Rode `npm run build`.
6. Configure em GitHub > repositório > Settings > Secrets and variables > Actions > Variables duas variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Em URL use `https://evhglzoffdpjanokalcn.supabase.co`. Em chave use sua **publishable key real** (não a senha e nunca uma secret/service_role).
7. Só depois de tudo testado: `git add .`, `git commit -m "Integrar Supabase"`, `git push origin master`.

## Funcionalidades
- Catálogo de barbeiros e serviços vindo do Supabase.
- Consulta dos períodos ocupados por barbeiro e data via função SQL.
- Criação de reservas via função `criar_agendamento`, com detecção de conflito no banco.
- Valores e duração conforme tabelas do Supabase.
- Painel administrativo antigo oculto até implementar autenticação real (nenhum nome/telefone exposto por consulta pública).

## Avisos antes de uso real
- A função SQL atual precisa reforço de horário de funcionamento, limites futuros, rate limiting/CAPTCHA e proteção contra spam. Não divulgue o QR Code para clientes reais antes disso.
- O WhatsApp em `src/App.jsx` está em `5571999999999` (exemplo): substitua pelo número real.
- A agenda é considerada no fuso `America/Bahia` (UTC-3) e funciona para funcionamento 09:00–20:00, mas essas regras ainda precisam ser **validadas também pelo servidor**.
- O botão Painel mostra aviso; não expõe dados de clientes enquanto o login seguro não existir.
- Variáveis `VITE_` são **públicas no frontend**. Nunca utilize chaves secret ou service_role nelas.
