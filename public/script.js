import { BASE_URL, API_KEY } from './config.js';

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}

// Wyświetl nazwę użytkownika
document.getElementById("userName").textContent = localStorage.getItem("userName") || "";

// Wyloguj
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "/public/rejestracja.html";
});

async function loadTasks() {
    const token = getToken();
    if (!token) {
        alert("Nie jesteś zalogowany!");
        window.location.href = "/public/rejestracja.html";
        return;
    }

    const res = await fetch(`${BASE_URL}/tasks?code=${API_KEY}`, {
        headers: authHeaders()
    });

    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        window.location.href = "/public/rejestracja.html";
        return;
    }

    const tasks = await res.json();
    const tbody = document.querySelector("#tasksTable tbody");
    tbody.innerHTML = "";

    tasks.forEach(task => {
        const tr = document.createElement("tr");

        const tdCheckbox = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.onclick = async () => {
            await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ completed: checkbox.checked })
            });
            loadTasks();
        };
        tdCheckbox.appendChild(checkbox);

        const tdTitle = document.createElement("td");
        tdTitle.textContent = task.title;
        if (task.completed) tdTitle.style.textDecoration = "line-through";

        const tdActions = document.createElement("td");

        const del = document.createElement("button");
        del.textContent = "Usuń";
        del.onclick = async () => {
            await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                method: "DELETE",
                headers: authHeaders()
            });
            loadTasks();
        };

        const edit = document.createElement("button");
        edit.textContent = "Edytuj";
        edit.onclick = async () => {
            const newTitle = prompt("Podaj nową nazwę zadania:", task.title);
            if (newTitle && newTitle.trim() !== task.title) {
                await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({ title: newTitle.trim() })
                });
                loadTasks();
            }
        };

        tdActions.appendChild(del);
        tdActions.appendChild(edit);
        tr.appendChild(tdCheckbox);
        tr.appendChild(tdTitle);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

document.getElementById("taskForm").addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    if (!title) return;

    await fetch(`${BASE_URL}/tasks?code=${API_KEY}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title })
    });
    document.getElementById("title").value = "";
    loadTasks();
});

loadTasks();