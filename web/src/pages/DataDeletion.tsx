import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import api from '../lib/api';
import { isValidEmail } from '../lib/validators';

export function DataDeletion() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [lookupCode, setLookupCode] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/data-deletion/request', { email });
      setCode(res.data.code);
      setSuccess(res.data.message || 'Solicitação registrada com sucesso.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao solicitar exclusão.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusResult(null);
    if (!lookupCode.trim()) {
      setError('Informe o código de confirmação.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/data-deletion/status/${lookupCode.trim()}`);
      setStatusResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Em processamento',
    completed: 'Concluída — dados excluídos',
    not_found: 'Nenhum dado encontrado para este e-mail',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight">YT Automatic Tools</Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Entrar</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Exclusão de Dados do Usuário</h1>
          <p className="text-sm text-muted-foreground">Conforme LGPD e requisitos do Facebook Data Deletion Callback.</p>
        </div>

        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-semibold">Como solicitar a exclusão</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Informe seu e-mail no formulário abaixo e clique em &quot;Solicitar exclusão&quot;.</li>
            <li>Você receberá um <strong className="text-foreground">código de confirmação</strong> e uma URL de acompanhamento.</li>
            <li>Seus dados (conta, canais vinculados e histórico de vídeos) serão excluídos em até <strong className="text-foreground">7 dias</strong>.</li>
            <li>Você pode consultar o status a qualquer momento informando o código na seção &quot;Consultar status&quot;.</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Para integração com o Facebook: configure como <strong className="text-foreground">Data Deletion Callback URL</strong> o endereço{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/data-deletion/callback</code> ou{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/data-deletion/request</code> com <code className="bg-muted px-1.5 py-0.5 rounded text-xs">signed_request</code>. Retornaremos <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{`{ url, confirmation_code }`}</code> conforme exigido.
          </p>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Solicitar exclusão dos meus dados</h2>
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-mail cadastrado</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>
            {error && !statusResult && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm">
                <p className="text-green-600 dark:text-green-400 font-medium">{success}</p>
                {code && (
                  <p className="mt-2 text-muted-foreground">
                    Código de confirmação: <code className="bg-muted px-2 py-1 rounded font-mono text-foreground">{code}</code>
                  </p>
                )}
                {code && (
                  <p className="mt-1 text-xs text-muted-foreground break-all">
                    Acompanhe em: /api/data-deletion/status/{code}
                  </p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Solicitar exclusão'}
            </button>
          </form>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Consultar status da solicitação</h2>
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Código de confirmação</label>
              <input
                type="text"
                placeholder="ex: a1b2c3..."
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-lg border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {loading ? 'Consultando...' : 'Consultar status'}
            </button>
          </form>
          {statusResult && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">E-mail:</span> {statusResult.email}</p>
              <p><span className="text-muted-foreground">Status:</span> <span className="font-semibold">{statusLabel[statusResult.status] || statusResult.status}</span></p>
              <p><span className="text-muted-foreground">Solicitado em:</span> {new Date(statusResult.requestedAt).toLocaleString('pt-BR')}</p>
              {statusResult.completedAt && <p><span className="text-muted-foreground">Concluído em:</span> {new Date(statusResult.completedAt).toLocaleString('pt-BR')}</p>}
            </div>
          )}
        </section>

        <section className="text-sm text-muted-foreground">
          <p>Dúvidas? Entre em contato pelo e-mail de suporte ou responda diretamente ao e-mail de confirmação da solicitação.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
