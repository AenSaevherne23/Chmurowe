import { BASE_URL, API_KEY } from './config.js';

// --- PRZEŁĄCZANIE TABÓW ---
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
});

tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
});

// --- LOGIKA API ---

async function handleAuth(endpoint, body, resultId) {
    const resultElement = document.getElementById(resultId);
    try {
        const res = await fetch(`${BASE_URL}/auth/${endpoint}?code=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", data.name);
            window.location.href = "index.html";
        } else {
            resultElement.textContent = data.message || "Wystąpił błąd";
        }
    } catch (err) {
        resultElement.textContent = "Błąd połączenia z serwerem";
    }
}

document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    await handleAuth("register", { name, email, password }, "registerResult");
});

document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    await handleAuth("login", { email, password }, "loginResult");
});