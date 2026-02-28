'use client';

import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'motion/react';

const stats = [
  { label: 'Clientes Ativos', value: '1,284', change: '+12%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Receita Mensal', value: 'R$ 42.500', change: '+8%', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Novas Assinaturas', value: '156', change: '+24%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Status do Servidor', value: '99.9%', change: 'Estável', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

interface DashboardHomeProps {
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  StatusBadge: any;
}

export default function DashboardHome({ customers, setCustomers, StatusBadge }: DashboardHomeProps) {
  const handleDeleteClient = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bem-vindo de volta, Administrador</h1>
        <p className="text-slate-500">Aqui está o que está acontecendo com sua rede hoje.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Clientes Recentes</h2>
          <button className="text-primary text-sm font-semibold hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.slice(0, 5).map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative">
                        <Image 
                          src={customer.image} 
                          alt={customer.name} 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                        <p className="text-slate-500 text-xs">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{customer.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      {customer.expiry}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(customer.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
