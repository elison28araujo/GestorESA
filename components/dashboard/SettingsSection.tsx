'use client';

import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Smartphone,
  ChevronRight,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';

const settingsGroups = [
  {
    title: 'Perfil & Conta',
    items: [
      { icon: User, label: 'Informações Pessoais', desc: 'Nome, email e foto de perfil' },
      { icon: Shield, label: 'Segurança', desc: 'Senha, 2FA e sessões ativas' },
      { icon: Bell, label: 'Notificações', desc: 'Alertas de vencimento e sistema' },
    ]
  },
  {
    title: 'Sistema & Rede',
    items: [
      { icon: Globe, label: 'Configurações de DNS', desc: 'Domínios e redirecionamentos' },
      { icon: Database, label: 'Banco de Dados', desc: 'Backup e otimização de tabelas' },
      { icon: Smartphone, label: 'Aplicativos', desc: 'Configuração de apps Android/iOS' },
    ]
  }
];

export default function SettingsSection() {
  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-slate-500">Personalize sua plataforma e gerencie preferências do sistema.</p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Save className="w-4 h-4" /> Salvar Alterações
        </button>
      </header>

      <div className="space-y-6">
        {settingsGroups.map((group, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">{group.title}</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((item, j) => (
                  <button 
                    key={j}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                        <item.icon className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 dark:text-white">{item.label}</h3>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="pt-8">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-6">
          <h3 className="text-red-600 dark:text-red-400 font-bold mb-2">Zona de Perigo</h3>
          <p className="text-red-500/70 text-sm mb-4">Ações irreversíveis que podem afetar permanentemente sua conta ou sistema.</p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            Excluir Todos os Dados
          </button>
        </div>
      </div>
    </div>
  );
}
