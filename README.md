# Barbearia do Rafa

Sistema mobile-first de agendamento de horários para barbearia.

## Rodar no VS Code

1. Instale o Node.js LTS: https://nodejs.org/
2. Abra esta pasta no VS Code.
3. Abra **Terminal > New Terminal**.
4. Rode:

```bash
npm install
npm run dev
```

5. Abra o endereço mostrado no terminal, normalmente `http://localhost:5173`.

## Onde editar os dados da barbearia

No arquivo `src/App.jsx`:

- `BARBERS`: nomes e especialidades dos barbeiros.
- `SERVICES`: serviços, preços e durações.
- `SHOP_WHATSAPP`: número do WhatsApp com DDI + DDD + número, somente dígitos.
- `OPEN_MINUTES` e `CLOSE_MINUTES`: horário de abertura e fechamento.

## Como funciona a agenda

Os horários são oferecidos a cada 15 minutos. Antes de mostrar um horário, o sistema verifica a duração completa do serviço contra todos os agendamentos do mesmo barbeiro e da mesma data.

Exemplo: se um serviço de 45 minutos estiver marcado às 14:00, o sistema considera ocupado o intervalo 14:00–14:45 e não oferece nenhum novo horário que colida com esse período.

## Persistência

Nesta versão, os agendamentos ficam em `localStorage`, isto é, no próprio navegador/dispositivo.

Isso é excelente para protótipo e teste, mas **não é suficiente para produção com clientes usando celulares diferentes**, porque cada aparelho teria sua própria agenda. Para a versão publicada, o próximo passo recomendado é conectar um banco online como Supabase/Firebase e colocar autenticação no painel do barbeiro.

## Build

```bash
npm run build
```

Os arquivos finais serão gerados na pasta `dist/`.
