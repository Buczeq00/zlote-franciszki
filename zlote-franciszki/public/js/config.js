// public/js/config.js

const CATEGORIES = [
  { id: 1, name: "🎬 Film Roku (Główna Nagroda)" },
  { id: 2, name: "🎭 Najlepszy Aktor Pierwszoplanowy" },
  { id: 3, name: "👑 Najlepsza Aktorka Pierwszoplanowa" },
  { id: 4, name: "🔊 Najlepszy Reżyser / Montażysta" },
  { id: 5, name: "📝 Najlepszy Scenariusz (Lub Największy Plot Twist)" },
  { id: 6, name: "😂 Najlepsza Scena Komediowa" },
  { id: 7, name: "😢 Najlepszy Wyciskacz Łez / Drama" },
  { id: 8, name: "💥 Najlepsze Efekty Specjalne (Lub Ich Brak)" },
  { id: 9, name: "🎶 Najlepsza Ścieżka Dźwiękowa / Audio" },
  { id: 10, name: "👗 Najlepsze Kostiumy i Charakteryzacja" },
  { id: 11, name: "🤫 Najlepsza Rola Drugoplanowa / Cichy Bohater" },
  { id: 12, name: "🫣 Największy Cringe / Złoty Paździerz" },
  { id: 13, name: "🫠 Najlepszy Tekst / Cytat Roku" },
  { id: 14, name: "🪄 Najlepsza Scena Akcji" },
  { id: 15, name: "🌟 Odkrycie Roku / Największy Progres" }
];

// Udostępniamy obiekt globalnie, aby inne skrypty (app.js, admin.js) miały do niego dostęp
window.APP_CONFIG = {
  categories: CATEGORIES
};