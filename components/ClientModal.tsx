'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, User, Mail, Tv, Calendar, ShieldCheck, Server, Lock, Plus, Trash2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

/**
 * IMPORTANTE:
 * - No Supabase, o campo customers.expiry deve ser do tipo DATE.
 * - O Supabase retorna DATE como string ISO: 'YYYY-MM-DD'.
 * - Aqui usamos <input type="date"> pra salvar sem erro.
 */

type Plan = {
  id: string;
  name: string;
  months: number;
  value: number;
};

interface Client {
  id: any;
  name: string;
  email: string;
  phone?: string;

  plan: string;
  // opcional (se você criar no banco)
  plan_id?: string | null;
  plan_months?: number | null;
  plan_value?: number | null;

  status: string;
  // ISO date: YYYY-MM-DD
  expiry: string;

  image: string;
  server_id: any;
  login: string;
  password: string;
  server_accesses?: { server_id: any; login: string; password: string }[];
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  editingClient?: Client | null;
  servers: any[];
  allClients: Client[];
}

function addMonthsISO(isoDate: string, months: number) {
  const d = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + Math.max(1, Number(months) || 1));
  return d.toISOString().slice(0, 10);
}

function getDefaultExpiryISO(months = 1) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + Math.max(1, Number(months) || 1));
  return d.toISOString().slice(0, 10);
}

function normalizeExpiryToISO(raw: any) {
  if (!raw) return '';
  if (typeof raw !== 'string') return '';
  // vem dd/mm/aaaa de versões antigas
  if (raw.includes('/')) {
    const [dd, mm, yyyy] = raw.split('/');
    if (!dd || !mm || !yyyy) return '';
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  // já deve ser ISO
  return raw;
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

function ClientForm({
  editingClient,
  onSave,
  onClose,
  servers,
  allClients,
}: {
  editingClient?: Client | null;
  onSave: any;
  onClose: any;
  servers: any[];
  allClients: Client[];
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState(() => {
    const isoExpiry = normalizeExpiryToISO((editingClient as any)?.expiry);

    return {
      name: editingClient?.name || '',
      email: editingClient?.email || '',
      phone: editingClient?.phone || '',

      plan: editingClient?.plan || '',
      plan_id: (editingClient as any)?.plan_id ?? null,
      plan_months: (editingClient as any)?.plan_months ?? null,
      plan_value: (editingClient as any)?.plan_value ?? null,

      status: editingClient?.status || 'Ativo',
      expiry: isoExpiry || (editingClient ? '' : getDefaultExpiryISO(1)),

      server_accesses:
        editingClient?.server_accesses && editingClient.server_accesses.length > 0
          ? editingClient.server_accesses
          : editingClient?.server_id
            ? [{ server_id: editingClient.server_id, login: editingClient.login, password: editingClient.password }]
            : [{ server_id: '', login: '', password: '' }],
    };
  });

  // ao abrir modal, sincroniza com o editingClient
  useEffect(() => {
    const isoExpiry = normalizeExpiryToISO((editingClient as any)?.expiry);
    setFormData({
      name: editingClient?.name || '',
      email: editingClient?.email || '',
      phone: editingClient?.phone || '',

      plan: editingClient?.plan || '',
      plan_id: (editingClient as any)?.plan_id ?? null,
      plan_months: (editingClient as any)?.plan_months ?? null,
      plan_value: (editingClient as any)?.plan_value ?? null,

      status: editingClient?.status || 'Ativo',
      expiry: isoExpiry || (editingClient ? '' : getDefaultExpiryISO(1)),

      server_accesses:
        editingClient?.server_accesses && editingClient.server_accesses.length > 0
          ? editingClient.server_accesses
          : editingClient?.server_id
            ? [{ server_id: editingClient.server_id, login: editingClient.login, password: editingClient.password }]
            : [{ server_id: '', login: '', password: '' }],
    });
  }, [editingClient]);

  // buscar planos
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, months, value')
        .order('value', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        setPlans([]);
        setLoadingPlans(false);
        return;
      }

      const normalized: Plan[] = (data as any[] | null)?.map((p) => ({
        id: p.id,
        name: p.name,
        months: Number(p.months ?? 1),
        value: Number(p.value ?? 0),
      })) ?? [];

      setPlans(normalized);

      // default plan (novo cliente)
      if (!editingClient && normalized.length > 0 && !formData.plan_id) {
        const p0 = normalized[0];
        setFormData((prev: any) => ({
          ...prev,
          plan: p0.name,
          plan_id: p0.id,
          plan_months: p0.months,
          plan_value: p0.value,
          expiry: prev.expiry || getDefaultExpiryISO(p0.months),
        }));
      }

      setLoadingPlans(false);
    };

    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlan = useMemo(() => {
    if (!formData.plan_id) return null;
    return plans.find((p) => p.id === formData.plan_id) ?? null;
  }, [plans, formData.plan_id]);

  const money = (v: number) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const addAccess = () => {
    setFormData((prev: any) => ({
      ...prev,
      server_accesses: [...prev.server_accesses, { server_id: '', login: '', password: '' }],
    }));
  };

  const removeAccess = (index: number) => {
    if (formData.server_accesses.length <= 1) return;
    setFormData((prev: any) => ({
      ...prev,
      server_accesses: prev.server_accesses.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateAccess = (index: number, field: string, value: any) => {
    const newAccesses = [...formData.server_accesses];
    newAccesses[index] = { ...newAccesses[index], [field]: value };

    // auto-preencher login/senha do servidor, se existirem
    if (field === 'server_id') {
      const selectedServer = servers.find((s) => s.id?.toString() === value?.toString());
      if (selectedServer) {
        newAccesses[index].login = selectedServer.login || '';
        newAccesses[index].password = selectedServer.password || '';
      }
    }

    setFormData((prev: any) => ({ ...prev, server_accesses: newAccesses }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // validação: cada login/senha no mesmo server pode ter no máximo 3 clientes
    for (const access of formData.server_accesses) {
      if (access.login && access.password && access.server_id) {
        const existingCount = allClients.filter((c) => {
          const matchesOld = c.server_id === access.server_id && c.login === access.login && c.password === access.password;
          const matchesNew = c.server_accesses?.some((a) => a.server_id === access.server_id && a.login === access.login && a.password === access.password);
          return (matchesOld || matchesNew) && c.id !== editingClient?.id;
        }).length;

        if (existingCount >= 3) {
          setError(`Atenção: o usuário "${access.login}" já possui 3 clientes vinculados no servidor selecionado. Limite atingido.`);
          return;
        }
      }
    }

    const firstAccess = formData.server_accesses[0];

    const finalData = {
      ...formData,
      // compat antigo
      server_id: firstAccess?.server_id || null,
      login: firstAccess?.login || '',
      password: firstAccess?.password || '',

      // plan compat
      plan: selectedPlan?.name ?? formData.plan,
      plan_id: selectedPlan?.id ?? formData.plan_id,
      plan_months: selectedPlan?.months ?? formData.plan_months,
      plan_value: selectedPlan?.value ?? formData.plan_value,
    };

    onSave(editingClient ? { ...finalData, id: editingClient.id } : finalData);
    onClose();
  };

  return (
    <>
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm font-bold">
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
            onChange={(e) => setFormData((p: any) => ({ ...p, name: e.target.value }))}
            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Ex: João Silva"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p: any) => ({ ...p, email: e.target.value }))}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="exemplo@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Telefone
            </label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData((p: any) => ({ ...p, phone: e.target.value }))}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="(DD) 9XXXX-XXXX"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Tv className="w-4 h-4" /> Plano
            </label>
            <select
              required
              value={formData.plan_id ?? ''}
              onChange={(e) => {
                const id = e.target.value || null;
                const p = plans.find((x) => x.id === id) ?? null;
                setFormData((prev: any) => ({
                  ...prev,
                  plan_id: id,
                  plan: p?.name ?? prev.plan,
                  plan_months: p?.months ?? prev.plan_months,
                  plan_value: p?.value ?? prev.plan_value,
                  expiry: prev.expiry || getDefaultExpiryISO(p?.months ?? 1),
                }));
              }}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">{loadingPlans ? 'Carregando planos...' : 'Selecione um plano'}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(p.value)} / {p.months} mês(es)
                </option>
              ))}
            </select>
            {selectedPlan && (
              <div className="text-xs text-slate-500">
                <b>Valor:</b> {money(selectedPlan.value)} &nbsp;|&nbsp; <b>Duração:</b> {selectedPlan.months} mês(es)
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Vencimento
            </label>
            <div className="flex gap-2">
              <input
                required
                type="date"
                value={formData.expiry}
                onChange={(e) => setFormData((p: any) => ({ ...p, expiry: e.target.value }))}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const m = formData.plan_months ?? selectedPlan?.months ?? 1;
                  setFormData((p: any) => ({ ...p, expiry: addMonthsISO(p.expiry || getDefaultExpiryISO(1), m) }));
                }}
                className="shrink-0 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                title="Renovar somando meses do plano"
              >
                +{formData.plan_months ?? selectedPlan?.months ?? 1}m
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((p: any) => ({ ...p, status: e.target.value }))}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="Ativo">Ativo</option>
              <option value="Vencendo">Vencendo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Server className="w-4 h-4" /> Acessos (Servidor/Login)
            </span>
            <button type="button" onClick={addAccess} className="text-primary font-bold text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Adicionar Acesso
            </button>
          </label>

          <div className="space-y-3">
            {formData.server_accesses.map((access: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Servidor</label>
                    <select
                      value={access.server_id || ''}
                      onChange={(e) => updateAccess(idx, 'server_id', e.target.value)}
                      className="mt-1 w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="">Selecione</option>
                      {(servers ?? []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name ?? s.url ?? `Servidor ${s.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Login</label>
                    <div className="relative mt-1">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={access.login}
                        onChange={(e) => updateAccess(idx, 'login', e.target.value)}
                        className="w-full pl-10 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="login"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Senha</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={access.password}
                        onChange={(e) => updateAccess(idx, 'password', e.target.value)}
                        className="w-full pl-10 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="senha"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeAccess(idx)}
                    className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center gap-1"
                    disabled={formData.server_accesses.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
            {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>
    </>
  );
}
