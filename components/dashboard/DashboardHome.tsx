'use client';

import {
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Bell,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useState } from 'react';

function parseAmountBR(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const cleaned = value
      .trim()
      .replace(/[^\d.,-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;

  // compat legado dd/mm/aaaa
  let iso = dateStr;
  if (typeof iso === 'string' && iso.includes('/')) {
    const [dd, mm, yyyy] = iso.split('/');
    if (!dd || !mm || !yyyy) return null;
    iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  const d = new Date(`${iso}T00:00:00`);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface DashboardHomeProps {
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>; // ✅ ESSENCIAL (corrige o build)
  StatusBadge: any;
}

export default function DashboardHome({ customers, setCustomers, StatusBadge }: DashboardHomeProps) {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase.from('transactions').select('*');
      setTransactions(data ?? []);
    };
    fetchTransactions();
  }, []);

  const activeClients = useMemo(
    () => (customers ?? []).filter((c) => c.status === 'Ativo').length,
    [customers]
  );

  const expiredClients = useMemo(
    () =>
      (customers ?? []).filter((c) => {
        const d = daysUntil(c.expiry);
        return d !== null && d < 0;
      }).length,
    [customers]
  );

  const expiringSoon = useMemo(
    () =>
      (customers ?? []).filter((c) => {
        const d = daysUntil(c.expiry);
        return d !== null && d >= 0 && d <= 3;
      }),
    [customers]
  );

  const monthlyRevenue = useMemo(() => {
    return (transactions ?? [])
      .filter((t) => t.type === 'Receita' && t.status === 'Concluído')
      .reduce((acc, t) => acc + parseAmountBR(t.amount), 0);
  }, [transactions]);

  const handleDeleteClient = async (id: any) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;

      setCustomers((prev) => (prev ?? []).filter((c) => c.id !== id));
    } catch (error: any) {
      console.error('Error deleting client from Supabase:', error);
      alert(error?.message ?? 'Erro ao excluir cliente.');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Bem-vindo de volta
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Aqui está o resumo do seu sistema hoje.
          </p>
        </div>

        {expiringSoon.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 animate-pulse w-full sm:w-auto">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {expiringSoon.length} cliente(s) vencem em até 3 dias
            </span>
          </div>
        )}
      </header>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Clientes Ativos</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeClients}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Receita Mensal</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Total Clientes</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{customers?.length ?? 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Clientes Vencidos</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{expiredClients}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista vencendo */}
      {expiringSoon.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Vencendo em breve</h2>
            <p className="text-slate-500 text-sm">Clientes com vencimento nos próximos 3 dias.</p>
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
                {expiringSoon.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold">{c.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.plan_name ?? c.plan ?? '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">{c.expiry}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteClient(c.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}