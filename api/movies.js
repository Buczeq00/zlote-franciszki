// api/movies.js
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from './auth.js';

// Inicjalizacja klienta Supabase z uprawnieniami dopasowanymi do operacji admina
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Ustawienie nagłówków CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Weryfikacja, czy żądanie pochodzi od zalogowanego autora
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Brak uprawnień. Tylko Autor może zarządzać filmami.' });
  }

  // --- OBSŁUGA DODAWANIA FILMU ---
  if (req.method === 'POST') {
    const { title, youtube_url, category_id } = req.body;

    if (!title || !category_id) {
      return res.status(400).json({ error: 'Tytuł oraz ID kategorii są wymagane.' });
    }

    try {
      const { data, error } = await supabase
        .from('movies')
        .insert([{ title, youtube_url, category_id }])
        .select();

      if (error) throw error;

      return res.status(201).json({ message: 'Film dodany pomyślnie!', movie: data[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Błąd bazy danych przy dodawaniu filmu.', details: err.message });
    }
  }

  // --- OBSŁUGA USUWANIA FILMU ---
  if (req.method === 'DELETE') {
    const { id } = req.query; // Pobieranie ID z adresu url, np. /api/movies?id=5

    if (!id) {
      return res.status(400).json({ error: 'Brak podanego ID filmu do usunięcia.' });
    }

    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ message: 'Film (oraz wszystkie powiązane z nim głosy) został usunięty.' });
    } catch (err) {
      return res.status(500).json({ error: 'Błąd bazy danych przy usuwaniu filmu.', details: err.message });
    }
  }

  // Jeśli metoda żądania jest inna niż POST lub DELETE
  return res.status(405).json({ error: `Metoda ${req.method} nie jest obsługiwana.` });
}