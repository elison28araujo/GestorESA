"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  profile?: { role?: string; name?: string } | null;
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [meRole, setMeRole] = useState<string>("operator");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator",
  });

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter((r) => {
      const email = (r.email ?? "").toLowerCase();
      const name = (r.profile?.name ?? "").toLowerCase();
      return email.includes(t) || name.includes(t);
    });
  }, [rows, q]);

  async function loadMeRole() {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .single();

    setMeRole(prof?.role ?? "operator");
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");

      setRows(json.users ?? []);
    } catch (e: any) {
      alert(e?.message ?? "Erro ao listar usuários");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeRole().then(fetchUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createUser() {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newUser),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar");

      setNewUser({ name: "", email: "", password: "", role: "operator" });
      await fetchUsers();
      alert("Usuário criado!");
    } catch (e: any) {
      alert(e?.message ?? "Erro");
    }
  }

  async function setRole(userId: string, role: "admin" | "operator") {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "setRole", userId, role }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");

      await fetchUsers();
    } catch (e: any) {
      alert(e?.message ?? "Erro");
    }
  }

  async function resetPassword(userId: string) {
    const password = prompt("Nova senha do usuário:");
    if (!password) return;

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "resetPassword", userId, password }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");

      alert("Senha alterada!");
    } catch (e: any) {
      alert(e?.message ?? "Erro");
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Excluir usuário?")) return;

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");

      await fetchUsers();
      alert("Usuário excluído!");
    } catch (e: any) {
      alert(e?.message ?? "Erro");
    }
  }

  if (meRole !== "admin") {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          <h1 className="text-lg font-bold">Usuários</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acesso negado. Apenas admin pode gerenciar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-xl font-bold">Gerenciar Usuários</h1>
        <p className="text-sm text-gray-600">
          Crie operadores, defina admin, resete senha e remova usuários.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="font-bold">Criar usuário</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="rounded-lg border p-2"
            placeholder="Nome"
            value={newUser.name}
            onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="rounded-lg border p-2"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) =>
              setNewUser((p) => ({ ...p, email: e.target.value }))
            }
          />
          <input
            className="rounded-lg border p-2"
            placeholder="Senha"
            value={newUser.password}
            onChange={(e) =>
              setNewUser((p) => ({ ...p, password: e.target.value }))
            }
          />
          <select
            className="rounded-lg border p-2"
            value={newUser.role}
            onChange={(e) =>
              setNewUser((p) => ({ ...p, role: e.target.value }))
            }
          >
            <option value="operator">Operador</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          onClick={createUser}
          className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
        >
          Criar
        </button>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">Lista de usuários</h2>
          <div className="flex gap-2">
            <input
              className="rounded-lg border p-2"
              placeholder="Buscar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={fetchUsers}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="py-2">Nome</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3">{u.profile?.name ?? "-"}</td>
                    <td>{u.email ?? "-"}</td>
                    <td className="font-semibold">
                      {u.profile?.role ?? "operator"}
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() =>
                          setRole(
                            u.id,
                            u.profile?.role === "admin" ? "operator" : "admin"
                          )
                        }
                        className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                      >
                        {u.profile?.role === "admin" ? "Tirar admin" : "Tornar admin"}
                      </button>

                      <button
                        onClick={() => resetPassword(u.id)}
                        className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                      >
                        Reset senha
                      </button>

                      <button
                        onClick={() => deleteUser(u.id)}
                        className="rounded-lg border px-3 py-1 hover:bg-red-50 text-red-600"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}