document.getElementById("googleLogin").addEventListener("click", () => {
  window.location.href = "http://localhost:3000/auth/google";
});

document.getElementById("githubLogin").addEventListener("click", () => {
  window.location.href = "http://localhost:3000/auth/github";
});
