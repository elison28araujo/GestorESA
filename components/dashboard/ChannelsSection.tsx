'use client';

import { useState } from 'react';
import { 
  Tv, 
  Film, 
  PlayCircle, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  ChevronRight,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import ChannelModal from './ChannelModal';

import { supabase } from '@/lib/supabase';

const categories = [
  { name: 'Canais Ao Vivo', count: 450, icon: Tv, color: 'text-blue-500' },
  { name: 'Filmes', count: 1200, icon: Film, color: 'text-primary' },
  { name: 'Séries', count: 350, icon: PlayCircle, color: 'text-emerald-500' },
];

interface Channel {
  id: any;
  title: string;
  type: string;
  category: string;
  status: string;
  bitrate: string;
}

interface ChannelsSectionProps {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
}

export default function ChannelsSection({ channels, setChannels }: ChannelsSectionProps) {
  const [activeTab, setActiveTab] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const filteredContent = channels.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'todos' || item.type.toLowerCase() === activeTab.replace('canais', 'canal').replace('séries', 'série').replace('filmes', 'filme');
    return matchesSearch && matchesTab;
  });

  const handleSaveChannel = async (data: any) => {
    try {
      if (data.id) {
        const { error } = await supabase
          .from('channels')
          .update({
            title: data.title,
            type: data.type,
            category: data.category,
            status: data.status,
            bitrate: data.bitrate
          })
          .eq('id', data.id);

        if (error) throw error;
        setChannels(prev => prev.map(c => c.id === data.id ? data : c));
      } else {
        const { data: newChannel, error } = await supabase
          .from('channels')
          .insert([data])
          .select();

        if (error) throw error;
        if (newChannel) setChannels(prev => [newChannel[0], ...prev]);
      }
    } catch (error) {
      console.error('Error saving channel to Supabase:', error);
      // Fallback
      if (data.id) {
        setChannels(prev => prev.map(c => c.id === data.id ? data : c));
      } else {
        const fallbackChannel = {
          ...data,
          id: Math.max(...channels.map(c => typeof c.id === 'number' ? c.id : 0), 0) + 1
        };
        setChannels(prev => [fallbackChannel, ...prev]);
      }
    }
  };

  const handleDeleteChannel = async (id: any) => {
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
      try {
        const { error } = await supabase
          .from('channels')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setChannels(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting channel from Supabase:', error);
        setChannels(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const openAddModal = () => {
    setEditingChannel(null);
    setIsModalOpen(true);
  };

  const openEditModal = (channel: Channel) => {
    setEditingChannel(channel);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Canais & VOD</h1>
          <p className="text-slate-500">Gerencie sua grade de programação e biblioteca de vídeos.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold border border-slate-200 dark:border-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" /> Categorias
          </button>
          <button 
            onClick={openAddModal}
            className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Conteúdo
          </button>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg group-hover:bg-primary/10 transition-colors">
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                <p className="text-slate-500 text-sm">{cat.count} itens</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Content List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-4">
            {['Todos', 'Canais', 'Filmes', 'Séries'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.toLowerCase() ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar conteúdo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Qualidade/Status</th>
                <th className="px-6 py-4">Bitrate</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                        {item.type === 'Canal' ? <Tv className="w-4 h-4 text-blue-500" /> : <Film className="w-4 h-4 text-primary" />}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Online' || item.status === '4K' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.bitrate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteChannel(item.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum conteúdo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ChannelModal 
        key={editingChannel?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChannel}
        editingChannel={editingChannel}
      />
    </div>
  );
}
