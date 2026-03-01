'use client';

import { useState } from 'react';
import { 
  Server, 
  Search, 
  Plus, 
  Filter,
  Edit2,
  Trash2,
  Shield,
  Lock,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import ServerModal from './ServerModal';
import { supabase } from '@/lib/supabase';

interface ServerData {
  id: any;
  name: string;
  login: string;
  password: string;
  max_clients_per_user: number;
  status: string;
}

interface ServersSectionProps {
  servers: ServerData[];
  setServers: React.Dispatch<React.SetStateAction<ServerData[]>>;
}

export default function ServersSection({ servers, setServers }: ServersSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);

  const filteredServers = servers.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveServer = async (data: any) => {
    try {
      if (data.id) {
        const { error } = await supabase
          .from('servers')
          .update({
            name: data.name,
            login: data.login,
            password: data.password,
            max_clients_per_user: data.max_clients_per_user,
            status: data.status
          })
          .eq('id', data.id);

        if (error) throw error;
        setServers(prev => prev.map(s => s.id === data.id ? data : s));
      } else {
        const { data: newServer, error } = await supabase
          .from('servers')
          .insert([data])
          .select();

        if (error) throw error;
        if (newServer) setServers(prev => [newServer[0], ...prev]);
      }
    } catch (error) {
      console.error('Error saving server to Supabase:', error);
      if (data.id) {
        setServers(prev => prev.map(s => s.id === data.id ? data : s));
      } else {
        const fallbackServer = {
          ...data,
          id: Math.max(...servers.map(s => typeof s.id === 'number' ? s.id : 0), 0) + 1
        };
        setServers(prev => [fallbackServer, ...prev]);
      }
    }
  };

  const handleDeleteServer = async (id: any) => {
    if (confirm('Tem certeza que deseja excluir este servidor?')) {
      try {
        const { error } = await supabase
          .from('servers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setServers(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting server from Supabase:', error);
        setServers(prev => prev.filter(s => s.id !== id));
      }
    }
  };

  const openAddModal = () => {
    setEditingServer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (server: ServerData) => {
    setEditingServer(server);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Servidores</h1>
          <p className="text-slate-500 text-sm sm:text-base">Gerencie seus servidores e limites de acesso.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Cadastrar Servidor
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Lista de Servidores</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar servidor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Servidor</th>
                <th className="px-6 py-4">Login</th>
                <th className="px-6 py-4">Limite/Usuário</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredServers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                        <Server className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {item.login}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {item.max_clients_per_user} clientes
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Online' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteServer(item.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum servidor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ServerModal 
        key={editingServer?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveServer}
        editingServer={editingServer}
      />
    </div>
  );
}
