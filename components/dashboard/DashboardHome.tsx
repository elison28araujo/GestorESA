'use client';

import { useMemo } from 'react';
import { DollarSign, Users, Server, CreditCard } from 'lucide-react';

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

interface DashboardHomeProps {
  customers: any[];
  servers: any[];
  plans: any[];
  transactions: any[];
}

export default function DashboardHome({ customers, servers, plans, transactions }: DashboardHomeProps) {
  const stats = useMemo(() => {
    const totalIncome = (transactions ?? [])
      .filter((t) => t.type === 'Receita')
      .reduce((acc, t) => acc + parseAmountBR(t.amount), 0);

    return {
      customers: (customers ?? []).length,
      servers: (servers ?? []).length,
      plans: (plans ?? []).length,
      income: totalIncome,
    };
  }, [customers, servers, plans, transactions]);

  const money = (v: number) =>
    Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Clientes</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.customers}</div>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Servidores</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.servers}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <Server className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Planos</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.plans}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Receitas</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{money(stats.income)}</div>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}