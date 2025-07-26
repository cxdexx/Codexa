// signup.js

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  const submitBtn = e.target.querySelector("button[type='submit']");

  submitBtn.disabled = true;
  submitBtn.textContent = "Signing you up...";

  try {
    const res = await fetch("https://codexa-backend.onrender.com/signup", {
      method: "POST",
      credentials: "include", // required for session cookies
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.user) {
      toastMsg.textContent = "✅ Signup successful! Redirecting...";
      toast.classList.remove("hidden");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      toastMsg.textContent = data.error || "❌ Signup failed.";
      toast.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
    }
  } catch (error) {
    console.error("Signup error:", error);
    toastMsg.textContent = "⚠️ Server error. Try again.";
    toast.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign Up";
  }
});
