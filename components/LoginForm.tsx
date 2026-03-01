'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Key, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[480px] bg-white dark:bg-slate-900 p-8 md:p-10 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Lock className="text-primary w-8 h-8" />
        </div>
        <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2">IPTV Control</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Acesso Restrito</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Username Field */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Usuário ou Email
          </label>
          <input 
            required
            className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-primary transition-all p-3.5 text-base outline-none border focus:ring-2 ring-offset-2 ring-transparent" 
            placeholder="Seu usuário ou email" 
            type="text" 
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
            <Key className="w-4 h-4" />
            Senha
          </label>
          <div className="relative flex items-center">
            <input 
              required
              className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-primary transition-all p-3.5 pr-12 text-base outline-none border focus:ring-2 ring-offset-2 ring-transparent" 
              placeholder="Sua senha" 
              type={showPassword ? "text" : "password"} 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" />
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Lembrar de mim</span>
          </label>
          <a className="text-primary text-sm font-semibold hover:underline" href="#">Esqueci minha senha</a>
        </div>

        {/* Login Button */}
        <button 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed" 
          type="submit"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Entrar no Sistema</span>
              <LogIn className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Secure Badge */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          Ambiente Seguro
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-xs text-center">
          © {new Date().getFullYear()} IPTV Control CRM. Todos os direitos reservados.
        </p>
      </div>
    </motion.div>
  );
}
