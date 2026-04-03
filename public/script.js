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

// Inicjalizacja UI
document.getElementById("userName").textContent = localStorage.getItem("userName") || "Użytkownik";

// --- OBSŁUGA SESJI ---

// Wyloguj
document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
});

// Usuń konto
document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    if (confirm("UWAGA! Czy na pewno chcesz usunąć konto? Wszystkie zadania zostaną bezpowrotnie skasowane.")) {
        try {
            const res = await fetch(`${BASE_URL}/auth/user?code=${API_KEY}`, {
                method: "DELETE",
                headers: authHeaders()
            });

            if (res.ok) {
                alert("Konto zostało pomyślnie usunięte.");
                logout();
            } else {
                const text = await res.text();
                alert(`Błąd podczas usuwania konta: ${res.status}\n${text}`);
            }
        } catch (err) {
            alert("Błąd połączenia z serwerem.");
        }
    }
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "/public/rejestracja.html";
}

// --- OBSŁUGA ZADAŃ ---

async function loadTasks() {
    const token = getToken();
    if (!token) {
        window.location.href = "/public/rejestracja.html";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/tasks?code=${API_KEY}`, {
            headers: authHeaders()
        });

        if (res.status === 401) {
            logout();
            return;
        }

        const tasks = await res.json();

        // Sortowanie: nieukończone najpierw
        tasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

        // Licznik
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        document.getElementById("counter").textContent = `${completed}/${total} ukończonych`;

        renderTable(tasks);
    } catch (err) {
        // Pozostawiono error w catch dla celów diagnostycznych w razie awarii sieci
        console.error("Błąd pobierania zadań:", err);
    }
}

function renderTable(tasks) {
    const tbody = document.querySelector("#tasksTable tbody");
    tbody.innerHTML = "";

    tasks.forEach(task => {
        const tr = document.createElement("tr");

        // Checkbox statusu
        const tdCheckbox = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.onchange = async () => {
            await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ completed: checkbox.checked })
            });
            loadTasks();
        };
        tdCheckbox.appendChild(checkbox);

        // Tytuł
        const tdTitle = document.createElement("td");
        tdTitle.textContent = task.title;
        if (task.completed) tdTitle.style.textDecoration = "line-through";

        // Data
        const tdDate = document.createElement("td");
        tdDate.textContent = task.createdAt
            ? new Date(task.createdAt).toLocaleString("pl-PL")
            : "—";

        // Akcje
        const tdActions = document.createElement("td");
        
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edytuj";
        editBtn.onclick = async () => {
            const newTitle = prompt("Nowa nazwa zadania:", task.title);
            if (newTitle && newTitle.trim() !== task.title) {
                await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({ title: newTitle.trim() })
                });
                loadTasks();
            }
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "Usuń";
        delBtn.style.marginLeft = "5px";
        delBtn.onclick = async () => {
            if (confirm("Usunąć to zadanie?")) {
                await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                    method: "DELETE",
                    headers: authHeaders()
                });
                loadTasks();
            }
        };

        tdActions.append(editBtn, delBtn);
        tr.append(tdCheckbox, tdTitle, tdDate, tdActions);
        tbody.appendChild(tr);
    });
}

// Dodawanie zadania
document.getElementById("taskForm").addEventListener("submit", async e => {
    e.preventDefault();

    const titleInput = document.getElementById("title");
    const title = titleInput.value.trim();
    if (!title) return;

    await fetch(`${BASE_URL}/tasks?code=${API_KEY}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title })
    });
    
    titleInput.value = "";
    loadTasks();
});

// Start
loadTasks();