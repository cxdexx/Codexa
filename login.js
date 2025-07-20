document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  const submitBtn = e.target.querySelector("button[type='submit']");

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.user) {
      toastMsg.textContent = "✅ Login successful! Redirecting...";
      toast.classList.remove("hidden");

      // Optional: Save session/cookie
      setTimeout(() => {
        window.location.href = `dashboard.html?email=${encodeURIComponent(data.user.email)}`;
      }, 1500);
    } else {
      toastMsg.textContent = data.error || "❌ Login failed.";
      toast.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }
  } catch (error) {
    console.error("Login error:", error);
    toastMsg.textContent = "⚠️ Server error. Please try again.";
    toast.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = "Log In";
  }
});
