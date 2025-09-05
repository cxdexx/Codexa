// session.js (updated)

// Wrap everything so `await` is only used inside async functions
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    let name = params.get("name");
    let email = params.get("email");
    let avatarFromURL = params.get("avatar");

    // DOM references (grab now but check existence before using)
    const avatarImg = document.querySelector("#avatar");
    const avatarInput = document.querySelector("#avatarInput");
    const usernameEl = document.getElementById("username");
    const greetingEl = document.getElementById("greeting");
    const emailEl = document.getElementById("email");
    const toastEl = document.getElementById("toast");

    // Helper: show toasts
    function showToast(message, type = "success") {
      const toast = toastEl || document.getElementById("toast");
      if (!toast) return alert(message);
      toast.textContent = message;
      toast.className = `fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg shadow-md transition duration-300 ease-in-out ${
        type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
      }`;
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 3000);
    }

    // fallbackSession: ask backend for session info and update URL (no reload)
    async function fallbackSession() {
      try {
        const res = await fetch("https://codexa-backend.onrender.com/session", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Invalid session");

        const data = await res.json();
        name = data.name || "User";
        email = data.email || "Unknown";
        avatarFromURL = data.avatar || "";

        // Put session info into URL without reloading
        const newParams = new URLSearchParams({ name, email, avatar: avatarFromURL });
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.history.replaceState({}, "", newUrl);
      } catch (err) {
        // session invalid -> call logout endpoint (GET) then redirect to login
        try {
          await fetch("https://codexa-backend.onrender.com/logout", {
            method: "GET",
            credentials: "include",
          });
        } catch (e) {
          // ignore network logout errors
        }
        showToast("⚠️ Session expired. Redirecting to login...", "error");
        setTimeout(() => (window.location.href = "login.html"), 2000);
        // stop further execution
        throw err;
      }
    }

    // Only call fallbackSession if URL params are missing or incomplete
    const needSessionFetch =
      !name || !email || name.trim() === "" || email.trim() === "" || email === "Unknown";

    if (needSessionFetch) {
      try {
        await fallbackSession();
      } catch {
        // fallbackSession already redirected — stop script execution
        return;
      }
    }

    // --- Avatar handling (kept original behavior) ---
    // Fallback avatar
    let avatar = avatarFromURL?.trim() || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(name || "User")}`;
    const savedAvatar = localStorage.getItem("customAvatar");
    if (savedAvatar) avatar = savedAvatar;
    if (avatarImg) avatarImg.src = avatar;

    // Handle upload
    if (avatarInput) {
      avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (ev) {
            if (avatarImg) avatarImg.src = ev.target.result;
            localStorage.setItem("customAvatar", ev.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Redirect if email missing (double-check)
    if (!email || email.trim() === "" || email === "Unknown") {
      try {
        await fetch("https://codexa-backend.onrender.com/logout", {
          method: "GET",
          credentials: "include",
        });
      } finally {
        showToast("⚠️ Session expired. Redirecting to login...", "error");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
        return;
      }
    }

    // UI injection (safe)
    if (usernameEl) usernameEl.textContent = name || "User";
    if (greetingEl) greetingEl.textContent = `Welcome, ${name || "User"}!`;
    if (emailEl) emailEl.textContent = `Email: ${email || "Unknown"}`;

    // Logout button (safe attach)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        fetch("https://codexa-backend.onrender.com/logout", {
          method: "GET",
          credentials: "include",
        })
          .then(() => (window.location.href = "login.html"))
          .catch(() => showToast("❌ Logout failed", "error"));
      });
    }

    // --- Quotes code (kept intact) ---
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
        if (!list) return;

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

    // Weather + Quote fetching (kept)
    function fetchWeather(lat, lon) {
      const weatherKey = "5b4993afdaa0b2960c7515fd820325d1";
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherKey}&units=metric`)
        .then((res) => res.json())
        .then((data) => {
          const temp = data.main.temp;
          const condition = data.weather[0].description;
          const city = data.name;
          const emoji = temp > 30 ? "🔥" : temp < 20 ? "❄️" : "🌤️";
          const weatherInfo = document.getElementById("weatherInfo");
          if (weatherInfo) weatherInfo.innerHTML = `${emoji} ${city}: ${temp}°C — ${condition}`;
          fetchQuote(condition);
        })
        .catch(() => {
          const weatherInfo = document.getElementById("weatherInfo");
          if (weatherInfo) weatherInfo.textContent = "⚠️ Could not fetch weather.";
        });
    }

    function fetchQuote(mood) {
      fetch("https://api.quotable.io/random")
        .then((res) => res.json())
        .then((data) => {
          currentQuote = data;
          const quoteTextEl = document.getElementById("quoteText");
          if (quoteTextEl) quoteTextEl.textContent = `"${data.content}" — ${data.author}`;
        })
        .catch(() => {
          const quoteTextEl = document.getElementById("quoteText");
          if (quoteTextEl) quoteTextEl.textContent = "⚠️ Could not fetch quote.";
        });
    }

    // Init weather + quote
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          const weatherInfo = document.getElementById("weatherInfo");
          if (weatherInfo) weatherInfo.textContent = "⚠️ Location blocked.";
          fetchQuote();
        }
      );
    } else {
      const weatherInfo = document.getElementById("weatherInfo");
      if (weatherInfo) weatherInfo.textContent = "⚠️ Geolocation not supported.";
      fetchQuote();
    }

    // Hook up save button if present
    const saveQuoteBtn = document.getElementById("saveQuoteBtn");
    if (saveQuoteBtn) saveQuoteBtn.addEventListener("click", saveQuote);

    // Load saved quotes
    loadSavedQuotes();
  });
})();
