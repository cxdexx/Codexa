document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");

  // Disable button temporarily to prevent multiple submissions
  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing you up...";

  try {
    const res = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.user) {
      toastMsg.textContent = "✅ Signup successful! Redirecting...";
      toast.classList.remove("hidden");

      // Optional: store user in localStorage/cookies later
      setTimeout(() => {
        window.location.href = `dashboard.html?email=${encodeURIComponent(data.user.email)}`;
      }, 1500);
    } else {
      toastMsg.textContent = data.error || "❌ Signup failed.";
      toast.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
    }
  } catch (error) {
    console.error("Signup Error:", error);
    toastMsg.textContent = "⚠️ Server error. Try again.";
    toast.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign Up";
  }
});
