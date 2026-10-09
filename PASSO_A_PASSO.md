# Passo a passo — VS Code + GitHub

## 1. Abrir o projeto

1. Descompacte `barbearia-do-rafa.zip`.
2. Abra o VS Code.
3. Vá em **File > Open Folder** / **Arquivo > Abrir Pasta**.
4. Selecione a pasta `barbearia-do-rafa`.

## 2. Verificar o Node.js

No VS Code, abra **Terminal > New Terminal** e rode:

```bash
node -v
npm -v
```

Se aparecerem números de versão, está tudo certo.
Se o comando não for reconhecido, instale a versão LTS em https://nodejs.org/ e reinicie o VS Code.

## 3. Instalar e rodar o site

No terminal, dentro da pasta do projeto:

```bash
npm install
npm run dev
```

O terminal mostrará um endereço semelhante a:

```text
http://localhost:5173/
```

Segure `Ctrl` e clique no endereço para abrir no navegador.

## 4. Testar o fluxo

Faça um agendamento e depois clique em **Painel** no topo.
O horário aparecerá separado pelo barbeiro escolhido.
Tente marcar outro serviço no mesmo período: horários que colidirem serão bloqueados automaticamente.

## 5. Alterar informações da barbearia

Abra `src/App.jsx`.

No começo do arquivo você encontrará:

- `BARBERS`: os 3 profissionais.
- `SERVICES`: serviços, valores e duração.
- `SHOP_WHATSAPP`: número para o botão do WhatsApp.
- `OPEN_MINUTES` / `CLOSE_MINUTES`: início e fim do expediente.

## 6. Criar um repositório no GitHub

No GitHub, crie um repositório novo, por exemplo:

```text
barbearia-do-rafa
```

Pode deixar sem README, sem `.gitignore` e sem licença, pois o projeto já contém os arquivos necessários.

Copie a URL HTTPS do repositório.

## 7. Ligar a pasta ao GitHub

No terminal do VS Code:

```bash
git init
git add .
git commit -m "Primeira versão do sistema de agendamento"
git branch -M main
git remote add origin COLE_AQUI_A_URL_DO_SEU_REPOSITORIO
git push -u origin main
```

O GitHub/VS Code poderá pedir para você entrar na sua conta. Pode ser uma conta com e-mail diferente do usado no ChatGPT.

## 8. Próximo passo para produção

Esta primeira versão usa `localStorage`. Isso significa que ela funciona muito bem como protótipo, mas os dados ficam no navegador onde o agendamento foi feito.

Para clientes reais acessando por QR Code em aparelhos diferentes, será necessário substituir essa persistência por um banco online, como Supabase ou Firebase. Assim todos verão a mesma agenda e dois clientes não poderão reservar o mesmo horário em celulares diferentes.
