'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: any;
  name: string;
  months: number;
  value: number;
}

export default function PlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    months: 1,
    value: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
    if (data) setPlans(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        months: Number(formData.months),
        value: Number(formData.value)
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Erro ao salvar plano. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Deseja excluir este plano?')) {
      await supabase.from('plans').delete().eq('id', id);
      fetchPlans();
    }
  };

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ name: plan.name, months: plan.months, value: plan.value });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', months: 1, value: 0 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planos</h1>
          <p className="text-slate-500">Configure os pacotes e valores oferecidos.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(plan)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar className="w-4 h-4" /> {plan.months} {plan.months === 1 ? 'Mês' : 'Meses'}
              </div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
                <DollarSign className="w-5 h-5 text-emerald-500" /> R$ {plan.value.toFixed(2)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <Plus className="w-5 h-5 text-slate-500 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome do Plano</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Premium Mensal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Meses</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={formData.months}
                    onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) })}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Valor (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all mt-4">
                Salvar Plano
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
