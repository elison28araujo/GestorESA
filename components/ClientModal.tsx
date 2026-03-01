'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Tv, Calendar, ShieldCheck, Server, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Client {
  id: any;
  name: string;
  email: string;
  plan: string;
  status: string;
  expiry: string;
  image: string;
  server_id: any;
  login: string;
  password: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  editingClient?: Client | null;
  servers: any[];
  allClients: Client[]; // Needed for validation
}

export default function ClientModal({ isOpen, onClose, onSave, editingClient, servers, allClients }: ClientModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            key={editingClient?.id || 'new'}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <ClientForm 
              editingClient={editingClient} 
              onSave={onSave} 
              onClose={onClose} 
              servers={servers} 
              allClients={allClients}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ClientForm({ editingClient, onSave, onClose, servers, allClients }: { editingClient?: Client | null, onSave: any, onClose: any, servers: any[], allClients: Client[] }) {
  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    email: editingClient?.email || '',
    plan: editingClient?.plan || 'Standard HD',
    status: editingClient?.status || 'Ativo',
    expiry: editingClient?.expiry || '',
    server_id: editingClient?.server_id || '',
    login: editingClient?.login || '',
    password: editingClient?.password || '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: Check if this login/password already has 3 clients
    if (formData.login && formData.password) {
      const existingCount = allClients.filter(c => 
        c.login === formData.login && 
        c.password === formData.password && 
        c.id !== editingClient?.id
      ).length;

      if (existingCount >= 3) {
        setError(`Atenção: O usuário "${formData.login}" já possui 3 clientes vinculados. Limite atingido.`);
        return;
      }
    }

    onSave(editingClient ? { ...formData, id: editingClient.id } : formData);
    onClose();
  };

  return (
    <>
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm font-bold"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <User className="w-4 h-4" /> Nome Completo
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Ex: João Silva"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email
          </label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="joao@exemplo.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Tv className="w-4 h-4" /> Plano
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option>Basic SD</option>
              <option>Standard HD</option>
              <option>Premium 4K</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Vencimento
            </label>
            <input
              required
              value={formData.expiry}
              onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="DD/MM/AAAA"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Acesso ao Servidor</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4" /> Servidor
            </label>
            <select
              required
              value={formData.server_id}
              onChange={(e) => {
                const serverId = e.target.value;
                const selectedServer = servers.find(s => s.id === serverId);
                if (selectedServer) {
                  setFormData({ 
                    ...formData, 
                    server_id: serverId,
                    login: selectedServer.login || '',
                    password: selectedServer.password || ''
                  });
                } else {
                  setFormData({ ...formData, server_id: serverId });
                }
              }}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">Selecione um servidor</option>
              {servers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" /> Login
              </label>
              <input
                required
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Login"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Senha
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Senha"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Status
          </label>
          <div className="flex gap-4">
            {['Ativo', 'Vencendo', 'Inativo'].map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === s}
                  onChange={() => setFormData({ ...formData, status: s })}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 rounded-lg font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>
    </>
  );
}
