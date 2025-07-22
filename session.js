// session.js

window.addEventListener("DOMContentLoaded", () => {
  fetch("https://codexa-backend.onrender.com/session", {
    credentials: "include"
  })
    .then((res) => res.json())
    .then((user) => {
      if (!user || !user.email) {
        window.location.href = "login.html";
      } else {
        console.log("✅ Logged in as:", user.name || user.email);
        // Optional: document.getElementById("welcome").innerText = `Hi, ${user.name}`;
      }
    })
    .catch((err) => {
      console.error("⚠️ Session check failed:", err);
      window.location.href = "login.html";
    });
});
