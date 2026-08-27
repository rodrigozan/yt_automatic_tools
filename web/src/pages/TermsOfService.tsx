import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight">YT Automatic Tools</Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Entrar</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Termos de Serviço</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: 27 de agosto de 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar ou utilizar o YT Automatic Tools (&quot;Plataforma&quot;), você concorda integralmente com estes Termos de Serviço. Caso não concorde, não utilize a Plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Descrição do Serviço</h2>
            <p>A Plataforma oferece ferramentas de automação para criação de conteúdo no YouTube, incluindo geração de roteiros com inteligência artificial, geração de thumbnails, músicas e montagem/upload automatizado de vídeos. O serviço depende de integrações com terceiros (Google/YouTube, Gemini, Suno, entre outros) e pode sofrer alterações sem aviso prévio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Cadastro e Conta</h2>
            <p>Para utilizar recursos restritos é necessário criar uma conta informando dados verídicos. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta. Contas com informações falsas ou uso abusivo poderão ser suspensas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Uso Aceitável</h2>
            <p>Você se compromete a não utilizar a Plataforma para: (a) violar leis, direitos de terceiros ou políticas do YouTube/Google; (b) enviar spam, conteúdo enganoso ou que infrinja direitos autorais; (c) tentar acessar áreas restritas, fazer engenharia reversa ou sobrecarregar a infraestrutura; (d) automatizar ações que violem os Termos do YouTube.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Conteúdo Gerado</h2>
            <p>O conteúdo gerado por IA (roteiros, imagens, músicas) é fornecido &quot;como está&quot; para fins criativos. Você é o único responsável por revisar, editar e garantir que o conteúdo publicado esteja em conformidade com as políticas do YouTube e legislação aplicável antes de publicá-lo.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Integração com YouTube / Google</h2>
            <p>Ao autorizar sua conta do YouTube, você concede permissão para que a Plataforma acesse, gerencie e publique conteúdos em seu canal conforme os escopos OAuth autorizados. Você pode revogar o acesso a qualquer momento nas configurações da sua Conta Google. O uso dos dados do Google segue a Política de Privacidade do Google.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Privacidade e Dados</h2>
            <p>Coletamos apenas os dados necessários para prestação do serviço (e-mail, dados de canal, tokens OAuth, histórico de vídeos). Não vendemos seus dados. Você pode solicitar a exclusão dos seus dados a qualquer momento pela página de exclusão de dados.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Propriedade Intelectual</h2>
            <p>A Plataforma, seu código, design e marca são de propriedade do YT Automatic Tools. Nenhuma licença sobre propriedade intelectual é concedida além do direito limitado de uso do serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Limitação de Responsabilidade</h2>
            <p>A Plataforma é fornecida &quot;como está&quot;, sem garantias de disponibilidade contínua ou ausência de erros. Não nos responsabilizamos por perdas, suspensão de canais, demonetização ou sanções aplicadas pelo YouTube decorrentes do uso do conteúdo gerado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Alterações dos Termos</h2>
            <p>Podemos atualizar estes Termos a qualquer momento. A versão vigente estará sempre disponível nesta URL. O uso continuado após alterações implica aceitação dos novos Termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Contato</h2>
            <p>Em caso de dúvidas sobre estes Termos, entre em contato pelo e-mail de suporte informado na Plataforma ou pela página de exclusão de dados.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">12. Foro</h2>
            <p>Fica eleito o foro da comarca de São Paulo/SP, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir dúvidas oriundas destes Termos.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
