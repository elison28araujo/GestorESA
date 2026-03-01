'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Server,
  Shield,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import ClientModal from '@/components/ClientModal';
import { supabase } from '@/lib/supabase';

interface Client {
  id: any;
  name: string;
  email: string;
  phone?: string;

  plan: string;
  plan_id?: string | null;
  plan_months?: number | null;
  plan_value?: number | null;

  status: string;
  // Supabase DATE -> ISO 'YYYY-MM-DD'
  expiry: string;
  image: string;
  server_id: any;
  login: string;
  password: string;
  server_accesses?: { server_id: any; login: string; password: string }[];
}

interface ClientsSectionProps {
  customers: Client[];
  setCustomers: React.Dispatch<React.SetStateAction<Client[]>>;
  servers: any[];
  StatusBadge: any;
}

function formatDateBR(iso: string) {
  if (!iso) return '';
  // se vier dd/mm/aaaa por legado
  if (iso.includes('/')) return iso;
  const [yyyy, mm, dd] = iso.split('-');
  if (!yyyy || !mm || !dd) return iso;
  return `${dd}/${mm}/${yyyy}`;
}

function daysUntil(iso: string) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function addMonthsISO(iso: string, months: number) {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + Math.max(1, Number(months) || 1));
  return d.toISOString().slice(0, 10);
}

export default function ClientsSection({ customers, setCustomers, servers, StatusBadge }: ClientsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // filtros simples (opção #5 UI)
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Vencendo' | 'Inativo'>('Todos');
  const [expiringFilter, setExpiringFilter] = useState<'Todos' | 'Vencidos' | 'VenceEm3' | 'VenceEm7'>('Todos');

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return customers.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.login || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        c.server_accesses?.some((a) => (a.login || '').toLowerCase().includes(q));

      const matchStatus = statusFilter === 'Todos' ? true : c.status === statusFilter;

      const du = daysUntil(c.expiry);
      const isExpired = du !== null && du < 0;
      const isIn3 = du !== null && du >= 0 && du <= 3;
      const isIn7 = du !== null && du >= 0 && du <= 7;

      const matchExpiry =
        expiringFilter === 'Todos'
          ? true
          : expiringFilter === 'Vencidos'
            ? isExpired
            : expiringFilter === 'VenceEm3'
              ? isIn3
              : isIn7;

      return matchSearch && matchStatus && matchExpiry;
    });
  }, [customers, searchQuery, statusFilter, expiringFilter]);

  const stats = useMemo(() => {
    const total = customers.length;
    const expired = customers.filter((c) => (daysUntil(c.expiry) ?? 0) < 0).length;
    const exp3 = customers.filter((c) => {
      const d = daysUntil(c.expiry);
      return d !== null && d >= 0 && d <= 3;
    }).length;
    return { total, expired, exp3 };
  }, [customers]);

  const handleSaveClient = async (clientData: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        alert('Você precisa estar logado para salvar um cliente.');
        return;
      }

      // NOTE: no banco, expiry é DATE (ISO). Se vier dd/mm/aaaa, tenta converter.
      const expiryISO = (() => {
        const raw = clientData.expiry;
        if (!raw) return raw;
        if (typeof raw === 'string' && raw.includes('/')) {
          const [dd, mm, yyyy] = raw.split('/');
          if (dd && mm && yyyy) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        return raw;
      })();

      if (clientData.id) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            plan: clientData.plan,
            status: clientData.status,
            expiry: expiryISO,
            server_id: clientData.server_id,
            login: clientData.login,
            password: clientData.password,
            server_accesses: clientData.server_accesses,
            // opcional no banco:
            plan_id: clientData.plan_id ?? null,
            plan_months: clientData.plan_months ?? null,
            plan_value: clientData.plan_value ?? null,
          })
          .eq('id', clientData.id);

        if (error) throw error;
        setCustomers((prev) => prev.map((c) => (c.id === clientData.id ? { ...c, ...clientData, expiry: expiryISO } : c)));
      } else {
        const newClientData = {
          owner_id: user.id, // se sua tabela tiver owner_id (multioperador)
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          plan: clientData.plan,
          status: clientData.status,
          expiry: expiryISO,
          image: `https://picsum.photos/seed/${clientData.name}/40/40`,
          server_id: clientData.server_id,
          login: clientData.login,
          password: clientData.password,
          server_accesses: clientData.server_accesses,
          plan_id: clientData.plan_id ?? null,
          plan_months: clientData.plan_months ?? null,
          plan_value: clientData.plan_value ?? null,
        };

        const { data, error } = await supabase.from('customers').insert([newClientData]).select();
        if (error) throw error;
        if (data) setCustomers((prev) => [data[0] as any, ...prev]);
      }
    } catch (error: any) {
      console.error('Error saving client to Supabase:', error);
      alert(error?.message ?? 'Erro ao salvar cliente.');
    }
  };

  const handleDeleteClient = async (id: any) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    // otimista
    const before = customers;
    setCustomers((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting client from Supabase:', error);
      alert(error.message);
      setCustomers(before);
    }
  };

  const handleRenewClient = async (client: Client) => {
    try {
      const months = client.plan_months ?? 1;
      const newExpiry = addMonthsISO(client.expiry, months);

      const { error } = await supabase
        .from('customers')
        .update({
          expiry: newExpiry,
          status: 'Ativo',
        })
        .eq('id', client.id);

      if (error) throw error;

      setCustomers((prev) => prev.map((c) => (c.id === client.id ? { ...c, expiry: newExpiry, status: 'Ativo' } : c)));
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Erro ao renovar.');
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

  const getServerName = (id: any) => {
    const server = servers.find((s) => s.id === id);
    return server ? server.name : 'Nenhum';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
          <p className="text-slate-500 text-sm sm:text-base">Gerencie sua base de assinantes e acessos.</p>
          <div className="mt-2 text-xs text-slate-500 flex gap-3 flex-wrap">
            <span><b>Total:</b> {stats.total}</span>
            <span><b>Vencidos:</b> {stats.expired}</span>
            <span><b>Vence em 3 dias:</b> {stats.exp3}</span>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
            onClick={() => {
              // toggle rápido: se já tem filtro, limpa
              setStatusFilter((p) => (p === 'Todos' ? 'Ativo' : 'Todos'));
            }}
            title="Filtro rápido"
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Lista de Clientes</h2>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome/email/login..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="Todos">Status: Todos</option>
              <option value="Ativo">Status: Ativo</option>
              <option value="Vencendo">Status: Vencendo</option>
              <option value="Inativo">Status: Inativo</option>
            </select>

            <select
              className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm"
              value={expiringFilter}
              onChange={(e) => setExpiringFilter(e.target.value as any)}
            >
              <option value="Todos">Vencimento: Todos</option>
              <option value="Vencidos">Vencimento: Vencidos</option>
              <option value="VenceEm3">Vencimento: em 3 dias</option>
              <option value="VenceEm7">Vencimento: em 7 dias</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Acesso (Servidor/Login)</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((customer) => {
                const du = daysUntil(customer.expiry);
                const isExpiringSoon = du !== null && du >= 0 && du <= 3;
                const isExpired = du !== null && du < 0;

                return (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                          <Image src={customer.image} alt={customer.name} fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</div>
                          <div className="text-slate-500 text-xs flex flex-col">
                            <span>{customer.email}</span>
                            {customer.phone && <span className="text-primary font-medium">{customer.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {customer.server_accesses && customer.server_accesses.length > 0 ? (
                          customer.server_accesses.map((access, idx) => (
                            <div key={idx} className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                              <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                                <Server className="w-2 h-2" /> {getServerName(access.server_id)}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-mono text-primary">
                                <Shield className="w-2 h-2" /> {access.login || 'N/A'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                              <Server className="w-3 h-3" /> {getServerName(customer.server_id)}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-mono text-primary">
                              <Shield className="w-3 h-3" /> {customer.login || 'N/A'}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex flex-col">
                        <span>{customer.plan}</span>
                        {typeof customer.plan_value === 'number' && (
                          <span className="text-[11px] text-slate-500">R$ {Number(customer.plan_value).toFixed(2)}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={customer.status} />
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex flex-col">
                        <span className={`${isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-amber-500 font-bold' : ''}`}>{formatDateBR(customer.expiry)}</span>
                        {isExpiringSoon && du !== null && <span className="text-[10px] text-amber-500 font-bold uppercase">Vence em {du}d</span>}
                        {isExpired && <span className="text-[10px] text-red-500 font-bold uppercase">Vencido</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRenewClient(customer)}
                          className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                          title="Renovar (+meses do plano)"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(customer.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal
        key={editingClient?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
        servers={servers}
        allClients={customers}
      />
    </div>
  );
}
