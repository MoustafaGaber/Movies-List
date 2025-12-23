document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData(this);

  const userData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password") // demo only
  };

  // Save data
  localStorage.setItem("signupUser", JSON.stringify(userData));

  // 🔹 Redirect to home page
  window.location.href = "home.html"; // change if needed
});