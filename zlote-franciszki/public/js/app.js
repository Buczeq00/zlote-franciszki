// public/js/app.js

// Pobranie konfiguracji 15 kategorii
const categories = window.APP_CONFIG ? window.APP_CONFIG.categories : [];

// Inicjalizacja klienta Supabase
const supabaseUrl = window.SUPABASE_URL;
const supabaseKey = window.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabase) {
    console.error("Błąd konfiguracji Supabase. Brak kluczy API.");
    return;
  }

  await loadGalaData();
});

// Pobieranie filmów z bazy danych
async function loadGalaData() {
  try {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*');

    if (error) throw error;

    renderGalaInterface(movies);
  } catch (error) {
    console.error("Błąd ładowania filmów:", error.message);
    document.getElementById("gala-container").innerHTML = `
      <p class="error-msg">Nie udało się załadować nominacji. Spróbuj odświeżyć stronę.</p>
    `;
  }
}

// Renderowanie pełnego interfejsu (kategorie + karty filmów)
function renderGalaInterface(movies) {
  const container = document.getElementById("gala-container");
  container.innerHTML = "";

  if (categories.length === 0) {
    container.innerHTML = "<p class='error-msg'>Brak zdefiniowanych kategorii w config.js</p>";
    return;
  }

  // Przechodzimy po każdej z 15 kategorii
  categories.forEach(cat => {
    const categoryMovies = movies.filter(m => m.category_id === cat.id);
    
    // Sprawdzamy w localStorage, czy użytkownik już głosował w tej kategorii
    const hasVotedInThisCategory = localStorage.getItem(`voted_cat_${cat.id}`);

    let categorySection = `
      <section class="category-section" id="category-${cat.id}">
        <h2 class="category-title">${cat.name}</h2>
        <div class="movies-grid">
    `;

    if (categoryMovies.length === 0) {
      categorySection += `<p class="no-movies">Brak nominacji w tej kategorii. Szanowne jury jeszcze debatuje.</p>`;
    } else {
      categoryMovies.forEach(movie => {
        // Konwersja standardowego linku YT na bezpieczny embed do iframe, jeśli istnieje
        const embedUrl = getYoutubeEmbedUrl(movie.youtube_url);
        const disabledAttr = hasVotedInThisCategory ? "disabled" : "";
        const buttonText = hasVotedInThisCategory ? "Głos oddany" : "Oddaj głos";
        const votedClass = hasVotedInThisCategory === String(movie.id) ? "voted-card" : "";

        categorySection += `
          <div class="movie-card ${votedClass}" id="movie-card-${movie.id}">
            ${embedUrl ? `
              <div class="video-container">
                <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
              </div>
            ` : `<div class="video-placeholder">🎬 Brak wideo</div>`}
            
            <div class="movie-info">
              <h3 class="movie-title">${movie.title}</h3>
              <button 
                class="btn-vote" 
                ${disabledAttr} 
                onclick="castVote(${movie.id}, ${cat.id})"
                id="btn-vote-${movie.id}"
              >
                ${buttonText}
              </button>
            </div>
          </div>
        `;
      });
    }

    categorySection += `</div></section><hr class="gala-divider">`;
    container.insertAdjacentHTML("beforeend", categorySection);
  });
}

// Funkcja obsługująca oddawanie głosu
window.castVote = async function(movieId, categoryId) {
  // Dodatkowe zabezpieczenie w JS
  if (localStorage.getItem(`voted_cat_${categoryId}`)) {
    alert("W tej kategorii Twój głos został już zarejestrowany!");
    return;
  }

  try {
    // Wysłanie głosu anonimowo do tabeli 'votes'
    const { error } = await supabase
      .from('votes')
      .insert([{ movie_id: movieId, category_id: categoryId }]);

    if (error) throw error;

    // Zapisanie faktu głosowania w przeglądarce użytkownika
    localStorage.setItem(`voted_cat_${categoryId}`, movieId);

    // Wizualna aktualizacja kart w tej kategorii
    const categorySection = document.getElementById(`category-${categoryId}`);
    const cards = categorySection.querySelectorAll('.movie-card');
    
    cards.forEach(card => {
      const btn = card.querySelector('.btn-vote');
      if (btn) {
        btn.disabled = true;
        btn.innerText = "Głos oddany";
      }
    });

    // Wyróżnienie wybranej karty
    document.getElementById(`movie-card-${movieId}`).classList.add('voted-card');

    alert("Dziękujemy! Twój głos na Złotego Franciszka został zapisany ✨");
  } catch (error) {
    console.error("Błąd podczas głosowania:", error.message);
    alert("Coś poszło nie tak przy zapisywaniu głosu. Spróbuj ponownie.");
  }
};

// Pomocnicza funkcja parsująca linki z YouTube na wersję do osadzenia (embed)
function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  let match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}