'use client';

import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import TransactionModal from '@/components/TransactionModal';
import { supabase } from '@/lib/supabase';

// Converte valor vindo do modal/DB para número (aceita number ou "R$ 1.234,56")
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

function formatMoneyBR(value: any): string {
  const n = parseAmountBR(value);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Transaction {
  id: any;
  customer: string;
  type: string;
  amount: any; // number (DB) ou string (compat)
  date: string;
  method: string;
  status: string;
}

interface FinanceSectionProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export default function FinanceSection({ transactions, setTransactions }: FinanceSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Todos');

  const filteredTransactions = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      const matchesSearch =
        (t.customer ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.method ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.status ?? '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'Todos' ? true : t.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, selectedType]);

  const totals = useMemo(() => {
    const income = (transactions ?? [])
      .filter((t) => t.type === 'Receita')
      .reduce((acc, t) => acc + parseAmountBR(t.amount), 0);

    const expense = (transactions ?? [])
      .filter((t) => t.type === 'Despesa')
      .reduce((acc, t) => acc + parseAmountBR(t.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  const handleSaveTransaction = async (data: any) => {
    try {
      const numericAmount = parseAmountBR(data.amount);

      if (data.id) {
        const { error } = await supabase
          .from('transactions')
          .update({
            customer: data.customer,
            type: data.type,
            amount: numericAmount,
            date: data.date,
            method: data.method,
            status: data.status,
          })
          .eq('id', data.id);

        if (error) throw error;

        setTransactions((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, ...data, amount: numericAmount } : t))
        );
      } else {
        const { data: newTransaction, error } = await supabase
          .from('transactions')
          .insert([
            {
              customer: data.customer,
              type: data.type,
              amount: numericAmount,
              date: data.date,
              method: data.method,
              status: data.status,
            },
          ])
          .select();

        if (error) throw error;

        if (newTransaction?.[0]) {
          setTransactions((prev) => [
            { ...newTransaction[0], amount: newTransaction[0].amount },
            ...(prev ?? []),
          ]);
        }
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      alert(error?.message ?? 'Erro ao salvar transação.');
    }
  };

  const handleDeleteTransaction = async (id: any) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions((prev) => (prev ?? []).filter((t) => t.id !== id));
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      alert(error?.message ?? 'Erro ao excluir transação.');
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
          <p className="text-slate-500 text-sm sm:text-base">Controle receitas, despesas e fluxo de caixa.</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <CreditCard className="w-4 h-4" /> Nova Transação
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Receitas</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoneyBR(totals.income)}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Despesas</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoneyBR(totals.expense)}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Saldo</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoneyBR(totals.balance)}</div>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Transações</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm"
              >
                <option value="Todos">Todos</option>
                <option value="Receita">Receitas</option>
                <option value="Despesa">Despesas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{t.customer}</td>
                  <td className="px-6 py-4 text-sm">{t.type}</td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {t.type === 'Receita' ? '+' : '-'} {formatMoneyBR(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.method}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.status}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}