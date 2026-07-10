// api/auth.js
import { createClient } from '@supabase/supabase-js';

// Inicjalizacja klienta Supabase po stronie serwera przy użyciu bezpiecznych zmiennych środowiskowych Vercel
const supabaseUrl = process.env.SUPABASE_URL;
// Używamy klucza SERVICE_ROLE, ponieważ serwer ma pełne uprawnienia do zarządzania, 
// a bezpieczeństwa pilnuje ten skrypt
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Główna funkcja middleware do weryfikacji, czy żądanie pochodzi od zalogowanego Autora
export default async function handler(req, res) {
  // Włączenie CORS, aby frontend mógł bez przeszkód komunikować się z API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Obsługa żądań typu OPTIONS (Preflight) przez Vercel
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Wyciągnięcie tokenu z nagłówka Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Brak autoryzacji. Dostęp zabroniony.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Bezpieczna weryfikacja tokenu bezpośrednio w Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Sesja wygasła lub token jest niepoprawny.' });
    }

    // 3. Jeśli token jest poprawny, zwracamy sukces i dane użytkownika
    // Ta funkcja będzie również importowana przez pozostałe pliki API (movies.js, votes.js)
    return res.status(200).json({ authenticated: true, user: user });

  } catch (err) {
    return res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera.', details: err.message });
  }
}

// Eksportujemy funkcję pomocniczą, którą wykorzystamy w api/movies.js oraz api/votes.js
export async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  return user;
}