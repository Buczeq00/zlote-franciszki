// public/js/auth.js

// Inicjalizacja klienta Supabase z globalnych zmiennych okna
const supabaseUrl = window.SUPABASE_URL;
const supabaseKey = window.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!supabase) {
    console.error("Błąd konfiguracji Supabase w auth.js. Sprawdź klucze API.");
    return;
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});

// Funkcja obsługująca logowanie Autora
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;
  const errorMessage = document.getElementById("error-message");

  // Reset komunikatu o błędzie
  if (errorMessage) errorMessage.innerText = "";

  try {
    // Wywołanie wbudowanej metody logowania Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    // Po udanym zalogowaniu Supabase automatycznie zapisuje sesję w LocalStorage.
    // Przekierowujemy autora do panelu zarządzania.
    window.location.href = "admin.html";

  } catch (error) {
    console.error("Błąd logowania:", error.message);
    if (errorMessage) {
      errorMessage.innerText = "Niepoprawny e-mail lub hasło. Dostęp tylko dla Autora.";
    } else {
      alert("Błąd logowania: Niepoprawne dane dostępu.");
    }
  }
}