"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Plan = {
  id: string;
  name: string;
  months: number;
  price: number;
};

type ServerItem = {
  id: string;
  name?: string;
  url?: string;
};

type ClientData = {
  id?: any;
  name: string;
  email: string;
  phone?: string;

  // compat antigo
  plan?: string;

  // novo (recomendado)
  plan_id?: string | null;
  plan_name?: string | null;
  plan_months?: number | null;
  plan_price?: number | null;

  status: string;
  expiry: string;

  server_id?: string | null;
  login?: string;
  password?: string;
  server_accesses?: any;
};

function formatDateBR(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function addMonthsSafe(date: Date, months: number) {
  // soma meses preservando o dia sempre que possível
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // se “estourou” para o mês seguinte (ex: 31/01 + 1 mês), ajusta para o último dia do mês correto
  if (d.getDate() !== day) {
    d.setDate(0);
  }

  return d;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  editingClient,
  servers,
  allClients,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClientData) => void;
  editingClient?: any;
  servers: ServerItem[];
  allClients: any[];
}) {
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [form, setForm] = useState<ClientData>(() => ({
    id: editingClient?.id,
    name: editingClient?.name ?? "",
    email: editingClient?.email ?? "",
    phone: editingClient?.phone ?? "",
    plan: editingClient?.plan ?? "",
    plan_id: editingClient?.plan_id ?? null,
    plan_name: editingClient?.plan_name ?? null,
    plan_months: editingClient?.plan_months ?? null,
    plan_price: editingClient?.plan_price ?? null,
    status: editingClient?.status ?? "Ativo",
    expiry: editingClient?.expiry ?? "",
    server_id: editingClient?.server_id ?? null,
    login: editingClient?.login ?? "",
    password: editingClient?.password ?? "",
    server_accesses: editingClient?.server_accesses ?? [],
  }));

  // quando abrir modal, atualiza form com cliente sendo editado
  useEffect(() => {
    if (!isOpen) return;

    setForm({
      id: editingClient?.id,
      name: editingClient?.name ?? "",
      email: editingClient?.email ?? "",
      phone: editingClient?.phone ?? "",
      plan: editingClient?.plan ?? "",
      plan_id: editingClient?.plan_id ?? null,
      plan_name: editingClient?.plan_name ?? null,
      plan_months: editingClient?.plan_months ?? null,
      plan_price: editingClient?.plan_price ?? null,
      status: editingClient?.status ?? "Ativo",
      expiry: editingClient?.expiry ?? "",
      server_id: editingClient?.server_id ?? null,
      login: editingClient?.login ?? "",
      password: editingClient?.password ?? "",
      server_accesses: editingClient?.server_accesses ?? [],
    });
  }, [isOpen, editingClient]);

  // buscar planos do Supabase
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      setLoadingPlans(true);

      const { data, error } = await supabase
        .from("plans")
        .select("id, name, months, price")
        .order("price", { ascending: true });

      if (error) {
        console.error("Erro ao buscar planos:", error);
        setPlans([]);
      } else {
        setPlans(
          ((data as any[]) ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            months: Number(p.months ?? 1),
            price: Number(p.price ?? 0),
          }))
        );
      }

      setLoadingPlans(false);
    };

    fetchPlans();
  }, [isOpen]);

  const selectedPlan = useMemo(() => {
    if (!form.plan_id) return null;
    return plans.find((p) => p.id === form.plan_id) ?? null;
  }, [plans, form.plan_id]);

  const money = (v: number) =>
    Number(v ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            {form.id ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Nome Completo</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Telefone</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.phone ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Plano</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={form.plan_id ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const p = plans.find((x) => x.id === id) ?? null;

                  // ✅ Vencimento automático baseado no plano (se estiver vazio OU se estiver criando novo cliente)
                  const shouldAutoFillExpiry =
                    !form.expiry || !form.id; // se estiver criando, auto sempre
                  const newExpiry = p && shouldAutoFillExpiry
                    ? formatDateBR(addMonthsSafe(new Date(), Number(p.months ?? 1)))
                    : form.expiry;

                  setForm((prev) => ({
                    ...prev,
                    plan_id: id,
                    plan_name: p?.name ?? null,
                    plan_months: p?.months ?? null,
                    plan_price: p?.price ?? null,

                    // compat antigo (se ainda usa "plan" string)
                    plan: p?.name ?? prev.plan ?? "",

                    expiry: newExpiry,
                  }));
                }}
              >
                <option value="">
                  {loadingPlans ? "Carregando planos..." : "Selecione um plano"}
                </option>

                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {money(p.price)} / {p.months} mês(es)
                  </option>
                ))}
              </select>

              {selectedPlan && (
                <div className="mt-2 text-sm text-gray-700">
                  <b>Valor:</b> {money(selectedPlan.price)} &nbsp;|&nbsp;
                  <b>Duração:</b> {selectedPlan.months} mês(es)
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Vencimento</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                placeholder="DD/MM/AAAA"
                value={form.expiry}
                onChange={(e) =>
                  setForm((p) => ({ ...p, expiry: e.target.value }))
                }
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Dica: ao selecionar o plano, o vencimento pode ser preenchido automaticamente.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Servidor</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={form.server_id ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, server_id: e.target.value || null }))
                }
              >
                <option value="">Selecione um servidor</option>
                {(servers ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.url ?? `Servidor ${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Login</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.login ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, login: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Senha</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.password ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Status</label>
              <select
                className="mt-1 w-full rounded-lg border p-2"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="Ativo">Ativo</option>
                <option value="Vencido">Vencido</option>
                <option value="Pausado">Pausado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            {form.id ? "Salvar Alterações" : "Cadastrar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}