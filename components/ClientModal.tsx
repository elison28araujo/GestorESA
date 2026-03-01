'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Tv, Calendar, ShieldCheck, Server, Lock, Plus, Trash2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface Client {
  id: any;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  expiry: string;
  image: string;
  server_id: any;
  login: string;
  password: string;
  server_accesses?: { server_id: any, login: string, password: string }[];
}

interface ClientModalProps {
// ... (rest of the interface)
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
  const [plans, setPlans] = useState<any[]>([]);
  
  const getDefaultExpiry = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0].split('-').reverse().join('/');
  };

  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    email: editingClient?.email || '',
    phone: editingClient?.phone || '',
    plan: editingClient?.plan || '',
    status: editingClient?.status || 'Ativo',
    expiry: editingClient?.expiry || (editingClient ? '' : getDefaultExpiry()),
    server_accesses: editingClient?.server_accesses && editingClient.server_accesses.length > 0
      ? editingClient.server_accesses 
      : (editingClient?.server_id 
          ? [{ server_id: editingClient.server_id, login: editingClient.login, password: editingClient.password }] 
          : [{ server_id: '', login: '', password: '' }]),
  });

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from('plans').select('*');
      if (data) {
        setPlans(data);
        // Only set default plan if not editing and no plan is selected
        if (!editingClient && !formData.plan && data.length > 0) {
          setFormData(prev => ({ ...prev, plan: data[0].name }));
        }
      }
    };
    fetchPlans();
  }, [editingClient, formData.plan]);

  const [error, setError] = useState<string | null>(null);

  const addAccess = () => {
    setFormData({
      ...formData,
      server_accesses: [...formData.server_accesses, { server_id: '', login: '', password: '' }]
    });
  };

  const removeAccess = (index: number) => {
    if (formData.server_accesses.length > 1) {
      setFormData({
        ...formData,
        server_accesses: formData.server_accesses.filter((_, i) => i !== index)
      });
    }
  };

  const updateAccess = (index: number, field: string, value: any) => {
    const newAccesses = [...formData.server_accesses];
    newAccesses[index] = { ...newAccesses[index], [field]: value };
    
    // Auto-populate if server_id changes
    if (field === 'server_id') {
      const selectedServer = servers.find(s => s.id.toString() === value.toString());
      if (selectedServer) {
        newAccesses[index].login = selectedServer.login || '';
        newAccesses[index].password = selectedServer.password || '';
      }
    }
    
    setFormData({ ...formData, server_accesses: newAccesses });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: Check each access
    for (const access of formData.server_accesses) {
      if (access.login && access.password && access.server_id) {
        // Count clients using this login/password on this server
        const existingCount = allClients.filter(c => {
          // Check old fields
          const matchesOld = c.server_id === access.server_id && c.login === access.login && c.password === access.password;
          // Check new array
          const matchesNew = c.server_accesses?.some(a => a.server_id === access.server_id && a.login === access.login && a.password === access.password);
          
          return (matchesOld || matchesNew) && c.id !== editingClient?.id;
        }).length;

        if (existingCount >= 3) {
          setError(`Atenção: O usuário "${access.login}" já possui 3 clientes vinculados no servidor selecionado. Limite atingido.`);
          return;
        }
      }
    }

    // Map the first access to the old fields for backward compatibility if needed, 
    // but the main data is now in server_accesses
    const firstAccess = formData.server_accesses[0];
    const finalData = {
      ...formData,
      server_id: firstAccess?.server_id || null,
      login: firstAccess?.login || '',
      password: firstAccess?.password || '',
    };

    onSave(editingClient ? { ...finalData, id: editingClient.id } : finalData);
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

        <div className="grid grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Telefone
            </label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="(00) 00000-0000"
            />
          </div>
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
              {plans.length > 0 ? (
                plans.map(p => <option key={p.id} value={p.name}>{p.name} - R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>)
              ) : (
                <>
                  <option>Basic SD</option>
                  <option>Standard HD</option>
                  <option>Premium 4K</option>
                </>
              )}
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Acessos aos Servidores</h3>
            <button
              type="button"
              onClick={addAccess}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="w-3 h-3" /> Adicionar Acesso
            </button>
          </div>

          {formData.server_accesses.map((access, index) => (
            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 relative">
              {formData.server_accesses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAccess(index)}
                  className="absolute top-4 right-4 p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Server className="w-4 h-4" /> Servidor {index + 1}
                </label>
                <select
                  required
                  value={access.server_id}
                  onChange={(e) => updateAccess(index, 'server_id', e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">Selecione um servidor</option>
                  {servers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {access.server_id && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logins em uso neste servidor:</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(allClients.filter(c => {
                      const matchesOld = c.server_id?.toString() === access.server_id.toString();
                      const matchesNew = c.server_accesses?.some(a => a.server_id?.toString() === access.server_id.toString());
                      return matchesOld || matchesNew;
                    }).flatMap(c => {
                      const logins = [];
                      if (c.server_id?.toString() === access.server_id.toString()) logins.push(c.login);
                      c.server_accesses?.forEach(a => {
                        if (a.server_id?.toString() === access.server_id.toString()) logins.push(a.login);
                      });
                      return logins;
                    }))).map(login => {
                      const count = allClients.reduce((acc, c) => {
                        let cCount = 0;
                        if (c.server_id?.toString() === access.server_id.toString() && c.login === login) cCount++;
                        c.server_accesses?.forEach(a => {
                          if (a.server_id?.toString() === access.server_id.toString() && a.login === login) cCount++;
                        });
                        return acc + cCount;
                      }, 0);
                      const isFull = count >= 3;
                      return (
                        <button
                          key={login}
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            // Find any client that has this login on this server to get the password
                            const clientWithThisLogin = allClients.find(c => {
                              if (c.server_id?.toString() === access.server_id.toString() && c.login === login) return true;
                              return c.server_accesses?.some(a => a.server_id?.toString() === access.server_id.toString() && a.login === login);
                            });
                            if (clientWithThisLogin) {
                              const targetAccess = clientWithThisLogin.server_id?.toString() === access.server_id.toString() && clientWithThisLogin.login === login
                                ? { login: clientWithThisLogin.login, password: clientWithThisLogin.password }
                                : clientWithThisLogin.server_accesses?.find(a => a.server_id?.toString() === access.server_id.toString() && a.login === login);
                              
                              if (targetAccess) {
                                updateAccess(index, 'login', targetAccess.login);
                                updateAccess(index, 'password', targetAccess.password);
                              }
                            }
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isFull ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white'}`}
                        >
                          {login} ({count}/3)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4" /> Login
                  </label>
                  <input
                    required
                    value={access.login}
                    onChange={(e) => updateAccess(index, 'login', e.target.value)}
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
                    value={access.password}
                    onChange={(e) => updateAccess(index, 'password', e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Senha"
                  />
                </div>
              </div>
            </div>
          ))}
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
