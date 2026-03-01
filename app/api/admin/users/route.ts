import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

// client normal (para verificar quem está chamando via cookie/session)
function supabaseServerFromRequest(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: {
      headers: {
        // passa o bearer se existir (caso você use Authorization)
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });
}

async function assertAdmin(req: Request) {
  const supabase = supabaseServerFromRequest(req);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    throw new Error("Não autenticado.");
  }

  // verifica role no profiles usando Service Role (sem RLS)
  const { data: prof, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profErr) throw new Error("Falha ao ler perfil admin.");
  if (prof?.role !== "admin") throw new Error("Acesso negado. Somente admin.");

  return user;
}

// GET: lista usuários + profiles
export async function GET(req: Request) {
  try {
    await assertAdmin(req);

    // lista usuários (Auth)
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) throw error;

    const users = data.users ?? [];

    // pega profiles
    const ids = users.map((u) => u.id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, role, name, created_at")
      .in("id", ids);

    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        profile: profMap.get(u.id) ?? null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erro" },
      { status: 401 }
    );
  }
}

// POST: cria usuário operador/admin
export async function POST(req: Request) {
  try {
    await assertAdmin(req);

    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "").trim();
    const name = String(body.name ?? "").trim();
    const role = body.role === "admin" ? "admin" : "operator";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) throw error;

    const userId = data.user?.id;
    if (userId) {
      // cria/atualiza profile
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        role,
        name: name || email,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erro ao criar usuário" },
      { status: 400 }
    );
  }
}

// PATCH: alterar role / resetar senha
export async function PATCH(req: Request) {
  try {
    await assertAdmin(req);

    const body = await req.json();
    const userId = String(body.userId ?? "");
    const action = String(body.action ?? "");

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    if (action === "setRole") {
      const role = body.role === "admin" ? "admin" : "operator";

      const { error } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, role });

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    if (action === "resetPassword") {
      const password = String(body.password ?? "").trim();
      if (!password) {
        return NextResponse.json(
          { error: "Senha obrigatória" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erro" },
      { status: 400 }
    );
  }
}

// DELETE: remove usuário
export async function DELETE(req: Request) {
  try {
    await assertAdmin(req);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    // profile será removido pelo cascade, mas garante:
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erro" },
      { status: 400 }
    );
  }
}