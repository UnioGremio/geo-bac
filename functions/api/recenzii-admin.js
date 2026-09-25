// functions/api/recenzii-admin.js
//
// Endpoint protejat printr-un token secret (ADMIN_TOKEN) — o parolă pe care
// o alegi tu. Folosește SUPABASE_SERVICE_ROLE_KEY (cheia secretă, NU cheia
// anon publică) ca să poată citi/scrie recenzii fără restricțiile RLS.
//
// ÎNAINTE DE A PUBLICA, ADAUGĂ ÎN Cloudflare Pages → Settings →
// Environment variables (production ȚI preview) următoarele 3 variabile,
// toate marcate "Encrypt":
//   ADMIN_TOKEN               = o parolă lungă, aleasă de tine (nu o pune în cod!)
//   SUPABASE_URL              = url-ul proiectului tău Supabase (ex: https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY = cheia "service_role" din Supabase → Settings → API
//                               (NU cheia "anon public" — aceea e deja folosită de site)

export async function onRequest(context) {
  const { request, env } = context;

  const token = request.headers.get('x-admin-token');
  if (!token || token !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Neautorizat' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  // --- Listează recenziile în așteptare ---
  if (request.method === 'GET') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/recenzii?status=eq.in_asteptare&order=creat_la.asc`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) {
      return new Response(JSON.stringify({ error: await res.text() }), { status: 500 });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
    });
  }

  // --- Aprobă sau respinge o recenzie ---
  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Corp cerere invalid' }), { status: 400 });
    }

    const { id, actiune } = body;
    if (!id || !['aprobata', 'respinsa'].includes(actiune)) {
      return new Response(JSON.stringify({ error: 'Cerere invalidă' }), { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/recenzii?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: actiune }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: await res.text() }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
