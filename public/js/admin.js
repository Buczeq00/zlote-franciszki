// public/js/admin.js

// Sprawdzamy, czy konfiguracja kategorii jest dostępna
const categories = window.APP_CONFIG ? window.APP_CONFIG.categories : [];

// Inicjalizacja klienta Supabase (zmienne pobierane z globalnego okna lub konfiguracji)
// Te wartości podstawią się po połączeniu z Supabase w pliku HTML
const supabaseUrl = window.SUPABASE_URL;
const supabaseKey = window.SUPABASE_ANON_KEY; 
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
}

// Sprawdzenie na starcie, czy jesteś zalogowany
document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase) {
    alert("Błąd konfiguracji Supabase. Sprawdź klucze API.");
    return;
  }

  // Pobierz aktualną sesję
  const { data: { session } } = await supabase.auth.getSession();
  
  // Jeśli brak sesji, wyrzuć do ekranu logowania
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Jeśli zalogowany, zainicjalizuj panel
  initAdminPanel();
});

// Główna funkcja ładująca dane do panelu
async function initAdminPanel() {
  populateCategorySelects();
  await loadDashboardData();
  setupEventListeners();
}

// Wypełnianie list rozwijanych (select) 15 kategoriami z config.js
function populateCategorySelects() {
  const movieCategorySelect = document.getElementById("movie-category");
  const filterCategorySelect = document.getElementById("filter-category");

  categories.forEach(cat => {
    // Opcja do formularza dodawania filmu
    const option1 = new Option(cat.name, cat.id);
    movieCategorySelect.add(option1);

    // Opcja do filtra statystyk
    if (filterCategorySelect) {
      const option2 = new Option(cat.name, cat.id);
      filterCategorySelect.add(option2);
    }
  });
}

// Pobieranie filmów i głosów, a następnie ich zliczanie
async function loadDashboardData() {
  try {
    // 1. Pobierz wszystkie filmy
    const { data: movies, error: errMovies } = await supabase
      .from('movies')
      .select('*');
    
    if (errMovies) throw errMovies;

    // 2. Pobierz wszystkie głosy
    const { data: votes, error: errVotes } = await supabase
      .from('votes')
      .select('*');

    if (errVotes) throw errVotes;

    renderMoviesList(movies);
    renderResults(movies, votes);
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error.message);
    alert("Nie udało się załadować danych z bazy.");
  }
}

// Wyświetlanie wyników głosowania na żywo
function renderResults(movies, votes) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = "";

  // Agregacja wyników dla każdej kategorii z config.js
  categories.forEach(cat => {
    const categoryVotes = votes.filter(v => v.category_id === cat.id);
    const categoryMovies = movies.filter(m => m.category_id === cat.id);

    let categoryHtml = `
      <div class="category-result-box">
        <h3>${cat.name} <span class="total-votes">(Suma głosów: ${categoryVotes.length})</span></h3>
        <ul class="votes-list">
    `;

    // Sortowanie filmów w tej kategorii po liczbie głosów (od największej)
    const sortedMovies = categoryMovies.map(movie => {
      const movieVotesCount = categoryVotes.filter(v => v.movie_id === movie.id).length;
      return { ...movie, votesCount: movieVotesCount };
    }).sort((a, b) => b.votesCount - a.votesCount);

    if (sortedMovies.length === 0) {
      categoryHtml += `<li class="no-data">Brak nominowanych filmów w tej kategorii</li>`;
    } else {
      sortedMovies.forEach((movie, index) => {
        const isWinner = index === 0 && movie.votesCount > 0 ? "👑 lider" : "";
        categoryHtml += `
          <li class="${isWinner}">
            <span class="movie-title">${movie.title}</span>
            <span class="badge-votes">${movie.votesCount} głosów</span>
          </li>
        `;
      });
    }

    categoryHtml += `</ul></div>`;
    resultsContainer.insertAdjacentHTML("beforeend", categoryHtml);
  });
}

// Wyświetlanie listy filmów w sekcji "Zarządzaj filmami" wraz z przyciskiem USUŃ
function renderMoviesList(movies) {
  const moviesTableBody = document.getElementById("movies-table-body");
  moviesTableBody.innerHTML = "";

  if (movies.length === 0) {
    moviesTableBody.innerHTML = `<tr><td colspan="4" class="text-center">Brak filmów w bazie danych.</td></tr>`;
    return;
  }

  movies.forEach(movie => {
    const catName = categories.find(c => c.id === movie.category_id)?.name || "Nieznana";
    const row = `
      <tr>
        <td><strong>${movie.title}</strong></td>
        <td>${catName}</td>
        <td><a href="${movie.youtube_url}" target="_blank">Link</a></td>
        <td>
          <button class="btn-delete" onclick="deleteMovie(${movie.id})">Usuń</button>
        </td>
      </tr>
    `;
    moviesTableBody.insertAdjacentHTML("beforeend", row);
  });
}

// Ustawienie nasłuchiwania na formularz dodawania filmu
function setupEventListeners() {
  const addMovieForm = document.getElementById("add-movie-form");
  
  addMovieForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("movie-title").value;
    const youtubeUrl = document.getElementById("movie-url").value;
    const categoryId = parseInt(document.getElementById("movie-category").value);

    try {
      const { data, error } = await supabase
        .from('movies')
        .insert([{ title, youtube_url: youtubeUrl, category_id: categoryId }]);

      if (error) throw error;

      alert("Film został pomyślnie dodany do nominacji!");
      addMovieForm.reset();
      await loadDashboardData(); // Odśwież widok
    } catch (error) {
      alert("Błąd dodawania filmu: " + error.message);
    }
  });

  // Przycisk wylogowania
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}

// Globalna funkcja usuwania filmu (wywoływana z poziomu atrybutu onclick w HTML)
window.deleteMovie = async function(movieId) {
  if (!confirm("Czy na pewno chcesz usunąć ten film? Spowoduje to również usunięcie wszystkich głosów na niego oddanych!")) return;

  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', movieId);

    if (error) throw error;

    alert("Film usunięty.");
    await loadDashboardData(); // Odśwież widok
  } catch (error) {
    alert("Błąd podczas usuwania: " + error.message);
  }
};