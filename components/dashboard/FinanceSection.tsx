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
import TransactionModal from './TransactionModal';
import { useState } from 'react';

import { supabase } from '@/lib/supabase';

interface Transaction {
  id: any;
  customer: string;
  type: string;
  amount: string;
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSaveTransaction = async (data: any) => {
    try {
      // Convert amount string "R$ 49,90" to numeric for DB if needed, 
      // but here we'll just store the string or handle conversion.
      // The migration uses NUMERIC(10,2), so we should convert.
      const numericAmount = parseFloat(data.amount.replace('R$ ', '').replace('.', '').replace(',', '.'));

      if (data.id) {
        const { error } = await supabase
          .from('transactions')
          .update({
            customer: data.customer,
            type: data.type,
            amount: numericAmount,
            date: data.date,
            method: data.method,
            status: data.status
          })
          .eq('id', data.id);

        if (error) throw error;
        setTransactions(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data: newTransaction, error } = await supabase
          .from('transactions')
          .insert([{
            customer: data.customer,
            type: data.type,
            amount: numericAmount,
            date: data.date,
            method: data.method,
            status: data.status
          }])
          .select();

        if (error) throw error;
        if (newTransaction) {
          // Format back for UI
          const formatted = {
            ...newTransaction[0],
            amount: `R$ ${newTransaction[0].amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          };
          setTransactions(prev => [formatted, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error saving transaction to Supabase:', error);
      // Fallback
      if (data.id) {
        setTransactions(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const fallbackTransaction = {
          ...data,
          id: Math.max(...transactions.map(t => typeof t.id === 'number' ? t.id : 0), 0) + 1
        };
        setTransactions(prev => [fallbackTransaction, ...prev]);
      }
    }
  };

  const handleDeleteTransaction = async (id: any) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting transaction from Supabase:', error);
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const totalRevenue = transactions
    .filter(t => t.type === 'Receita')
    .reduce((acc, t) => acc + parseFloat(t.amount.replace('R$ ', '').replace(',', '.')), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Despesa')
    .reduce((acc, t) => acc + parseFloat(t.amount.replace('R$ ', '').replace(',', '.')), 0);

  const balance = totalRevenue - totalExpense;
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
          <p className="text-slate-500 text-sm sm:text-base">Acompanhe seu fluxo de caixa, receitas e despesas.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button 
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <DollarSign className="w-4 h-4" /> Nova Transação
          </button>
        </div>
      </header>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium">Saldo Total</p>
            <h2 className="text-3xl font-bold mt-1">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <div className="mt-6 flex items-center gap-2 text-sm bg-white/20 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-4 h-4" /> +15% este mês
            </div>
          </div>
          <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-500/10 p-3 rounded-xl">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receitas</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Recebido</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 dark:bg-red-500/10 p-3 rounded-xl">
              <ArrowDownLeft className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Gasto</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Últimas Transações</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
              <Calendar className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Descrição/Cliente</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'Receita' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'Receita' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{t.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{t.method}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${t.type === 'Receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'Receita' ? '+' : '-'} {t.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {t.status}
                    </span>
                  </td>
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
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        key={editingTransaction?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
