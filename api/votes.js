// api/votes.js
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from './auth.js';

// Inicjalizacja klienta Supabase z pełnymi uprawnieniami serwera
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Ustawienie nagłówków CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Akceptujemy tylko metodę GET dla tego punktu końcowego
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Metoda ${req.method} nie jest obsługiwana.` });
  }

  // Weryfikacja, czy żądanie podglądu głosów pochodzi od zalogowanego Autora
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Brak uprawnień. Wyniki głosowania może podglądać tylko Autor.' });
  }

  try {
    // Pobranie wszystkich głosów z bazy danych
    const { data: votes, error } = await supabase
      .from('votes')
      .select('id, movie_id, category_id, created_at');

    if (error) throw error;

    // Zwrócenie surowej listy głosów, którą admin.js na frontendzie odpowiednio pogrupuje i zliczy
    return res.status(200).json(votes);

  } catch (err) {
    return res.status(500).json({ error: 'Błąd bazy danych podczas pobierania głosów.', details: err.message });
  }
}