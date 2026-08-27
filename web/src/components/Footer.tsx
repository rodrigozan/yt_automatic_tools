import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-white/[0.02] py-4">
      <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} YT Automatic Tools. Todos os direitos reservados.</span>
        <div className="flex items-center gap-4">
          <Link to="/termos-de-servico" className="hover:text-primary transition-colors underline underline-offset-4">
            Termos de Serviço
          </Link>
          <Link to="/exclusao-de-dados" className="hover:text-primary transition-colors underline underline-offset-4">
            Exclusão de Dados
          </Link>
        </div>
      </div>
    </footer>
  );
}
