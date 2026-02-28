import LoginForm from '@/components/LoginForm';
import { Tv, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 bg-primary rounded-lg text-white">
            <Tv className="w-6 h-6" />
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">IPTV Control</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span className="truncate">Ajuda</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-background-light to-slate-100 dark:from-background-dark dark:to-slate-950">
        <LoginForm />

        {/* Footer Links */}
        <div className="mt-8 flex gap-6 text-slate-500 dark:text-slate-400 text-sm">
          <a className="hover:text-primary transition-colors" href="#">Termos de Uso</a>
          <a className="hover:text-primary transition-colors" href="#">Política de Privacidade</a>
          <a className="hover:text-primary transition-colors" href="#">Suporte Técnico</a>
        </div>
      </main>
    </div>
  );
}
