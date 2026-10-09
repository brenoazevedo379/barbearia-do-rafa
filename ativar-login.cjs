const fs = require('fs');

const arquivo = 'src/App.jsx';
let codigo = fs.readFileSync(arquivo, 'utf8');

const importacao = "import AdminLogin from './AdminLogin'";
if (!codigo.includes(importacao)) {
  codigo = importacao + '\n' + codigo;
}

const marcador = "  const [view, setView] = useState('booking')";
if (!codigo.includes('const [adminAutorizado, setAdminAutorizado]')) {
  if (!codigo.includes(marcador)) {
    throw new Error('Estado view não encontrado');
  }
  codigo = codigo.replace(
    marcador,
    marcador + "\n  const [adminAutorizado, setAdminAutorizado] = useState(false)"
  );
}

const inicio = codigo.indexOf("      {view === 'admin' && (");
const fim = codigo.indexOf('\n      )}', inicio);

if (inicio === -1 || fim === -1) {
  throw new Error('Bloco do painel não encontrado');
}

const painel = `      {view === 'admin' && (
        adminAutorizado ? (
          <section className="card main-card">
            <h2>Acesso autorizado</h2>
            <p>Login administrativo realizado com sucesso.</p>
            <button
              className="primary"
              onClick={() => setAdminAutorizado(false)}
            >
              Sair do painel
            </button>
          </section>
        ) : (
          <AdminLogin onAuthenticated={() => setAdminAutorizado(true)} />
        )
      )}`;

codigo = codigo.slice(0, inicio) + painel + codigo.slice(fim + 10);

fs.writeFileSync(arquivo, codigo, 'utf8');
console.log('Tela de login conectada!');
