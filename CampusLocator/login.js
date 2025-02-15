document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.querySelector(".login-button");
    const loginError = document.getElementById("loginError");

    loginButton.addEventListener("click", handleLogin);

    function handleLogin() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // Mock login validation - replace with real authentication if needed
        if (username === "testuser" && password === "password123") {
            alert("Login successful!");
            window.location.href = "index.html"; // Redirect to main page after successful login
        } else {
            loginError.style.display = "block"; // Show error message
            loginError.textContent = "Invalid credentials, try again.";
        }
    }
});
