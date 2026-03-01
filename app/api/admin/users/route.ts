import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin endpoint.
// Requer:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY (somente no server / Vercel)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getBearer(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

async function requireAdmin(req: Request) {
  const token = getBearer(req);
  if (!token) {
    return { ok: false as const, error: 'Sem token. Faça login novamente.' };
  }

  // client com anon só para validar token
  const sb = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData.user) {
    return { ok: false as const, error: 'Token inválido. Faça login novamente.' };
  }

  const user = userData.user;

  const { data: prof, error: profErr } = await sb
    .from('profiles')
    .select('id, role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr) {
    return { ok: false as const, error: profErr.message };
  }

  const isAdmin = !!(prof?.is_admin || prof?.role === 'admin');
  if (!isAdmin) {
    return { ok: false as const, error: 'Acesso negado. Apenas admin.' };
  }

  return { ok: true as const, user };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  // Lista usuários via profiles (mais simples)
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, role, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim();
  const password = String(body.password || '').trim();
  const role = String(body.role || 'operator').trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message || 'Falha ao criar usuário.' }, { status: 400 });
  }

  // garante profile
  const { error: upErr } = await admin
    .from('profiles')
    .upsert({
      id: created.user.id,
      email,
      role: role === 'admin' ? 'admin' : 'operator',
      is_admin: role === 'admin',
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  const role = String(body.role || '').trim();

  if (!id || !role) {
    return NextResponse.json({ error: 'id e role são obrigatórios.' }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  const { error } = await admin
    .from('profiles')
    .update({ role: role === 'admin' ? 'admin' : 'operator', is_admin: role === 'admin' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  // remove usuário do auth
  const { error: delErr } = await admin.auth.admin.deleteUser(id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

  // profiles geralmente será removido por trigger/cascade, mas tenta garantir
  await admin.from('profiles').delete().eq('id', id);

  return NextResponse.json({ ok: true });
}
