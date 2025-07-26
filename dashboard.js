const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "User";
const email = params.get("email");
const avatarFromURL = params.get("avatar") || "";

// DOM references
const avatarImg = document.querySelector("#avatar");
const avatarInput = document.querySelector("#avatarInput");

// Fallback avatar
let avatar = avatarFromURL?.trim() || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(name)}`;
const savedAvatar = localStorage.getItem("customAvatar");
if (savedAvatar) avatar = savedAvatar;
if (avatarImg) avatarImg.src = avatar;

// Handle avatar upload
if (avatarInput) {
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        avatarImg.src = e.target.result;
        localStorage.setItem("customAvatar", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Show toast helper
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return alert(message);
  toast.textContent = message;
  toast.className = `fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg shadow-md transition duration-300 ease-in-out ${
    type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
  }`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// Redirect if email missing
if (!email || email === "Unknown") {
  fetch("https://codexa-backend.onrender.com/logout", {
    method: "POST",
    credentials: "include",
  }).finally(() => {
    // Only redirect if we're NOT on login/signup page
if (
  !document.cookie.includes("user_session") &&
  !window.location.pathname.includes("login.html") &&
  !window.location.pathname.includes("signup.html")
) {
  showToast("Session expired, redirecting to login...");
  window.location.href = "/login.html";
}

  });
}
// frontend/dashboard.js
fetch('https://codexa-backend.onrender.com/routes/session', {
  credentials: 'include',
})
  .then((res) => res.json())
  .then((data) => {
    if (data && data.name) {
      // ✅ Show dashboard
      document.getElementById('username').textContent = data.name;
      // etc...
    } else {
      window.location.href = '/login.html';
    }
  })
  .catch(() => {
    window.location.href = '/login.html';
  });


// UI updates
document.getElementById("username").textContent = name;
document.getElementById("greeting").textContent = `Welcome, ${name}!`;
document.getElementById("email").textContent = `Email: ${email}`;

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  fetch("https://codexa-backend.onrender.com/logout", {
    method: "POST",
    credentials: "include",
  })
    .then(() => (window.location.href = "login.html"))
    .catch(() => showToast("❌ Logout failed", "error"));
});

let currentQuote = {};

async function saveQuote() {
  const quoteText = document.getElementById("quoteText")?.textContent?.trim();
  const mood = document.getElementById("mood")?.value || "Neutral";
  if (!quoteText || !mood) return showToast("Missing quote or mood", "error");

  try {
    const res = await fetch("https://codexa-backend.onrender.com/save-quote", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: quoteText, mood }),
    });
    const data = await res.json();
    if (data.message === "Quote saved") {
      showToast("✅ Quote saved successfully!");
      loadSavedQuotes();
    } else {
      showToast("❌ Failed to save quote", "error");
    }
  } catch {
    showToast("❌ Network error", "error");
  }
}

async function loadSavedQuotes() {
  try {
    const res = await fetch("https://codexa-backend.onrender.com/saved-quotes", {
      credentials: "include",
    });
    const quotes = await res.json();

    const list = document.getElementById("saved-quotes-list");
    list.innerHTML = "";

    if (!Array.isArray(quotes)) return;

    quotes.reverse().forEach((q) => {
      const card = document.createElement("li");
      card.className = "bg-white/10 text-white p-4 rounded-lg border border-white/20 shadow-sm";

      const quoteText = document.createElement("p");
      quoteText.className = "italic";
      quoteText.textContent = q.quote;

      const mood = document.createElement("p");
      mood.className = "text-xs text-white/60 mt-1";
      mood.textContent = `Mood: ${q.mood || "Unknown"}`;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️ Delete";
      deleteBtn.className = "mt-2 text-sm text-red-400 hover:text-red-600";
      deleteBtn.onclick = () => deleteQuote(q._id);

      card.append(quoteText, mood, deleteBtn);
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load saved quotes:", err);
  }
}

function deleteQuote(id) {
  fetch(`https://codexa-backend.onrender.com/delete-quote/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showToast("🗑️ Quote deleted");
        loadSavedQuotes();
      } else {
        showToast("❌ Failed to delete", "error");
      }
    })
    .catch(() => showToast("❌ Network error", "error"));
}

function fetchWeather(lat, lon) {
  const weatherKey = "5b4993afdaa0b2960c7515fd820325d1";
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherKey}&units=metric`)
    .then((res) => res.json())
    .then((data) => {
      const temp = data.main.temp;
      const condition = data.weather[0].description;
      const city = data.name;
      const emoji = temp > 30 ? "🔥" : temp < 20 ? "❄️" : "🌤️";
      document.getElementById("weatherInfo").innerHTML = `${emoji} ${city}: ${temp}°C — ${condition}`;
      fetchQuote(condition);
    })
    .catch(() => {
      document.getElementById("weatherInfo").textContent = "⚠️ Could not fetch weather.";
    });
}

function fetchQuote(mood) {
  fetch("https://api.quotable.io/random")
    .then((res) => res.json())
    .then((data) => {
      currentQuote = data;
      document.getElementById("quoteText").textContent = `"${data.content}" — ${data.author}`;
    })
    .catch(() => {
      document.getElementById("quoteText").textContent = "⚠️ Could not fetch quote.";
    });
}

// Init
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
    () => {
      document.getElementById("weatherInfo").textContent = "⚠️ Location blocked.";
      fetchQuote();
    }
  );
} else {
  document.getElementById("weatherInfo").textContent = "⚠️ Geolocation not supported.";
  fetchQuote();
}

loadSavedQuotes();
