"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Server,
  Shield,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import ClientModal from "@/components/ClientModal";
import { supabase } from "@/lib/supabase";

interface Client {
  id: any;
  name: string;
  email: string;
  phone?: string;

  // compat antigo
  plan: string;

  // novo (recomendado)
  plan_id?: string | null;
  plan_name?: string | null;
  plan_months?: number | null;
  plan_price?: number | null;

  status: string;
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

/** Helpers */
function parseDateBR(s: string) {
  const [dd, mm, yyyy] = (s || "").split("/");
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}
function formatDateBR(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function addMonthsSafe(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

export default function ClientsSection({
  customers,
  setCustomers,
  servers,
  StatusBadge,
}: ClientsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // filtros rápidos
  const [onlyExpiringSoon, setOnlyExpiringSoon] = useState(false);
  const [onlyExpired, setOnlyExpired] = useState(false);

  const baseFiltered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.login || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.server_accesses?.some((a) =>
        (a.login || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredCustomers = baseFiltered.filter((c) => {
    const d = parseDateBR(c.expiry);
    if (!d) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (onlyExpired) return d < today;
    if (onlyExpiringSoon) return diffDays > 0 && diffDays <= 3;
    return true;
  });

  const handleSaveClient = async (clientData: any) => {
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userErr || !user) {
        alert("Você precisa estar logado para salvar um cliente.");
        return;
      }

      const planName = clientData.plan_name ?? clientData.plan ?? "";

      if (clientData.id) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,

            plan: planName,
            plan_id: clientData.plan_id ?? null,
            plan_name: clientData.plan_name ?? planName,
            plan_months: clientData.plan_months ?? null,
            plan_price: clientData.plan_price ?? null,

            status: clientData.status,
            expiry: clientData.expiry,
            server_id: clientData.server_id ?? null,
            login: clientData.login,
            password: clientData.password,
            server_accesses: clientData.server_accesses,
          })
          .eq("id", clientData.id);

        if (error) throw error;

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === clientData.id ? { ...c, ...clientData, plan: planName } : c
          )
        );
      } else {
        const newClientData = {
          owner_id: user.id, // multioperador / RLS
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,

          plan: planName,
          plan_id: clientData.plan_id ?? null,
          plan_name: clientData.plan_name ?? planName,
          plan_months: clientData.plan_months ?? null,
          plan_price: clientData.plan_price ?? null,

          status: clientData.status,
          expiry: clientData.expiry,
          image: `https://picsum.photos/seed/${clientData.name}/40/40`,
          server_id: clientData.server_id ?? null,
          login: clientData.login,
          password: clientData.password,
          server_accesses: clientData.server_accesses,
        };

        const { data, error } = await supabase
          .from("customers")
          .insert([newClientData])
          .select();

        if (error) throw error;
        if (data) setCustomers((prev) => [data[0], ...prev]);
      }

      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error: any) {
      console.error("Error saving client to Supabase:", error);
      alert(error?.message ?? "Erro ao salvar cliente.");
    }
  };

  const handleDeleteClient = async (id: any) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      console.error("Error deleting client:", error);
      alert(error?.message ?? "Erro ao excluir. Verifique permissões (RLS).");
    }
  };

  /** ✅ WhatsApp automático */
  const openWhatsapp = (customer: any) => {
    const phone = (customer.phone ?? "").replace(/\D/g, "");
    if (!phone) {
      alert("Cliente sem telefone.");
      return;
    }

    const plan = customer.plan_name ?? customer.plan ?? "";
    const price =
      typeof customer.plan_price === "number"
        ? Number(customer.plan_price).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "";

    const msg =
      `Olá ${customer.name}! ✅\n` +
      `Seu plano: ${plan}${price ? ` (${price})` : ""}\n` +
      `Vencimento: ${customer.expiry}\n\n` +
      `Para renovar, me confirme por aqui 😉`;

    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  /** ✅ Renovação automática + cria transação */
  const renewClient = async (customer: any, monthsToAdd: number) => {
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) {
        alert("Você precisa estar logado.");
        return;
      }

      const baseDate = parseDateBR(customer.expiry) ?? new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // se já venceu: conta a partir de hoje. se ainda válido: soma a partir do vencimento atual
      const start = baseDate < today ? today : baseDate;
      const newExpiry = formatDateBR(addMonthsSafe(start, monthsToAdd));

      const unit = Number(customer.plan_price ?? 0);
      const amount = unit * monthsToAdd;

      // 1) atualiza cliente
      const { error: upErr } = await supabase
        .from("customers")
        .update({ expiry: newExpiry, status: "Ativo" })
        .eq("id", customer.id);
      if (upErr) throw upErr;

      // 2) salva transação no financeiro (se existir tabela transactions)
      await supabase.from("transactions").insert([
        {
          owner_id: user.id,
          customer_id: customer.id,
          type: "income",
          amount: amount,
          description: `Renovação ${monthsToAdd} mês(es) - ${customer.name} (${customer.plan_name ?? customer.plan})`,
        },
      ]);

      // 3) atualiza UI
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id ? { ...c, expiry: newExpiry, status: "Ativo" } : c
        )
      );

      alert(`Renovado! Novo vencimento: ${newExpiry}`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erro ao renovar.");
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
    return server ? server.name : "Nenhum";
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Gerencie sua base de assinantes e acessos.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" /> Filtros
          </button>

          <button
            onClick={() => {
              setOnlyExpired(false);
              setOnlyExpiringSoon((v) => !v);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold border transition-all ${
              onlyExpiringSoon
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            Vence em 3 dias
          </button>

          <button
            onClick={() => {
              setOnlyExpiringSoon(false);
              setOnlyExpired((v) => !v);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold border transition-all ${
              onlyExpired
                ? "bg-red-500 text-white border-red-500"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            Vencidos
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
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            Lista de Clientes
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
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
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Acesso (Servidor/Login)</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                        <Image
                          src={customer.image}
                          alt={customer.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {customer.name}
                        </div>
                        <div className="text-slate-500 text-xs flex flex-col">
                          <span>{customer.email}</span>
                          {customer.phone && (
                            <span className="text-primary font-medium">
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {customer.server_accesses &&
                      customer.server_accesses.length > 0 ? (
                        customer.server_accesses.map((access, idx) => (
                          <div
                            key={idx}
                            className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                              <Server className="w-2 h-2" />{" "}
                              {getServerName(access.server_id)}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-primary">
                              <Shield className="w-2 h-2" />{" "}
                              {access.login || "N/A"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Server className="w-3 h-3" />{" "}
                            {getServerName(customer.server_id)}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-mono text-primary">
                            <Shield className="w-3 h-3" />{" "}
                            {customer.login || "N/A"}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {customer.plan_name ?? customer.plan}
                    {typeof customer.plan_price === "number" && (
                      <div className="text-[11px] text-slate-500">
                        {Number(customer.plan_price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        {customer.plan_months
                          ? ` / ${customer.plan_months} mês(es)`
                          : ""}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status} />
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {(() => {
                      const expiryDate = parseDateBR(customer.expiry);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      let diffDays = 9999;
                      let isExpired = false;
                      let isExpiringSoon = false;

                      if (expiryDate) {
                        diffDays = Math.ceil(
                          (expiryDate.getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        isExpired = expiryDate < today;
                        isExpiringSoon = diffDays > 0 && diffDays <= 3;
                      }

                      return (
                        <div className="flex flex-col">
                          <span
                            className={`${
                              isExpired
                                ? "text-red-500 font-bold"
                                : isExpiringSoon
                                ? "text-amber-500 font-bold"
                                : ""
                            }`}
                          >
                            {customer.expiry}
                          </span>
                          {isExpiringSoon && (
                            <span className="text-[10px] text-amber-500 font-bold uppercase">
                              Vence em {diffDays}d
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[10px] text-red-500 font-bold uppercase">
                              Vencido
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* WhatsApp */}
                      <button
                        onClick={() => openWhatsapp(customer)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* Renovar */}
                      <button
                        onClick={() => renewClient(customer, 1)}
                        className="px-2 py-1 text-xs rounded-md border border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        title="Renovar +1 mês"
                      >
                        +1M
                      </button>
                      <button
                        onClick={() => renewClient(customer, 3)}
                        className="px-2 py-1 text-xs rounded-md border border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        title="Renovar +3 meses"
                      >
                        +3M
                      </button>
                      <button
                        onClick={() => renewClient(customer, 6)}
                        className="px-2 py-1 text-xs rounded-md border border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        title="Renovar +6 meses"
                      >
                        +6M
                      </button>

                      {/* Editar/Excluir */}
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
              ))}

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
        key={editingClient?.id || "new"}
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