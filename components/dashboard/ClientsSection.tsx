'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'motion/react';
import ClientModal from '@/components/ClientModal';

import { supabase } from '@/lib/supabase';

interface Client {
  id: any;
  name: string;
  email: string;
  plan: string;
  status: string;
  expiry: string;
  image: string;
}

interface ClientsSectionProps {
  customers: Client[];
  setCustomers: React.Dispatch<React.SetStateAction<Client[]>>;
  StatusBadge: any;
}

export default function ClientsSection({ customers, setCustomers, StatusBadge }: ClientsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveClient = async (clientData: any) => {
    try {
      if (clientData.id) {
        // Update Supabase
        const { error } = await supabase
          .from('customers')
          .update({
            name: clientData.name,
            email: clientData.email,
            plan: clientData.plan,
            status: clientData.status,
            expiry: clientData.expiry,
            image: clientData.image
          })
          .eq('id', clientData.id);

        if (error) throw error;
        setCustomers(prev => prev.map(c => c.id === clientData.id ? { ...c, ...clientData } : c));
      } else {
        // Create Supabase
        const newClientData = {
          name: clientData.name,
          email: clientData.email,
          plan: clientData.plan,
          status: clientData.status,
          expiry: clientData.expiry,
          image: `https://picsum.photos/seed/${clientData.name}/40/40`
        };

        const { data, error } = await supabase
          .from('customers')
          .insert([newClientData])
          .select();

        if (error) throw error;
        if (data) setCustomers(prev => [data[0], ...prev]);
      }
    } catch (error) {
      console.error('Error saving client to Supabase:', error);
      // Fallback to local state if Supabase fails (for demo)
      if (clientData.id) {
        setCustomers(prev => prev.map(c => c.id === clientData.id ? { ...c, ...clientData } : c));
      } else {
        const fallbackClient = {
          ...clientData,
          id: Math.max(...customers.map(c => typeof c.id === 'number' ? c.id : 0), 0) + 1,
          image: `https://picsum.photos/seed/${clientData.name}/40/40`
        };
        setCustomers(prev => [fallbackClient, ...prev]);
      }
    }
  };

  const handleDeleteClient = async (id: any) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting client from Supabase:', error);
        setCustomers(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const openAddModal = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Clientes</h1>
          <p className="text-slate-500">Adicione, edite ou remova clientes da sua base.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
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
              {filteredCustomers.map((customer) => (
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
                        onClick={() => openEditModal(customer)}
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
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />
    </div>
  );
}
