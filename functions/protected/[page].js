const SUPABASE_URL = 'https://bxbefvelonocuheavsri.supabase.co';
const BUCKET = 'protected-pages';
const ALLOWED = ['europa','romania','vecini','exercitii-harta','subiecte','subiecte-ani-precedenti'];

export async function onRequest(context) {
 const { request, params, env } = context;
 const ANON_KEY = env.SUPABASE_ANON_KEY;
 const SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

 const page = (params.page || '').replace(/\.html$/i, '').toLowerCase();
 if (!ALLOWED.includes(page)) {
   return new Response('Pagina nu există.', { status: 404 });
 }

 const cookie = request.headers.get('Cookie') || '';
 const token = extractToken(cookie);

 if (!token) {
   return Response.redirect('https://geo-bac.com/login.html?return=' + page, 302);
 }

 const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
   headers: {
     'Authorization': `Bearer ${token}`,
     'apikey': ANON_KEY,
   },
 });

 if (!userRes.ok) {
   return Response.redirect('https://geo-bac.com/login.html?return=' + page, 302);
 }

 const user = await userRes.json();
 if (!user?.id) {
   return Response.redirect('https://geo-bac.com/login.html?return=' + page, 302);
 }

 const profileRes = await fetch(
   `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_premium&limit=1`,
   {
     headers: {
       'Authorization': `Bearer ${token}`,
       'apikey': ANON_KEY,
       'Accept': 'application/json',
     },
   }
 );

 const profiles = await profileRes.json();
 const isPremium = Array.isArray(profiles) && profiles[0]?.is_premium === true;

 if (!isPremium) {
   return Response.redirect('https://geo-bac.com/index.html?motiv=neplata', 302);
 }

 const signedRes = await fetch(
   `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${page}.html`,
   {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${SERVICE_KEY}`,
       'apikey': SERVICE_KEY,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ expiresIn: 60 }),
   }
 );

 if (!signedRes.ok) {
    return new Response('Eroare la generarea accesului.', { status: 503 });
 }

  const signedData = await signedRes.json();
  const signedURL = signedData.signedURL || signedData.signedUrl || signedData.url || '';
  
  const fullURL = signedURL.startsWith('/storage') 
  ? `${SUPABASE_URL}${signedURL}`
  : `${SUPABASE_URL}/storage/v1${signedURL}`;
const fileRes = await fetch(fullURL);


  if (!fileRes.ok) {
   return new Response('Eroare la încărcarea conținutului.', { status: 503 });
  }

 const html = (await fileRes.text())
   .replace('<head>', '<head><base href="/">');

 return new Response(html, {
   status: 200,
   headers: {
     'Content-Type': 'text/html; charset=utf-8',
     'Cache-Control': 'no-store, no-cache',
     'X-Robots-Tag': 'noindex',
   },
 });
}

function extractToken(cookieHeader) {
 const match = cookieHeader.match(/sb-access-token=([^;]+)/);
 if (!match) return null;
 try {
   return decodeURIComponent(match[1]);
 } catch {
   return null;
 }
}
