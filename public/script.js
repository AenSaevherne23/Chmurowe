// script.js
import { BASE_URL, API_KEY } from './config.js';

async function loadTasks() {
    const res = await fetch(`${BASE_URL}/tasks?code=${API_KEY}`);
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
                headers: { "Content-Type": "application/json" },
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
            await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, { method: "DELETE" });
            loadTasks();
        };
        tdActions.appendChild(del);

        const edit = document.createElement("button");
        edit.textContent = "Edytuj";
        edit.onclick = async () => {
            const newTitle = prompt("Podaj nową nazwę zadania:", task.title);
            if (newTitle && newTitle.trim() !== task.title) {
                await fetch(`${BASE_URL}/tasks/${task.id}?code=${API_KEY}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newTitle.trim() })
                });
                loadTasks();
            }
        };
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
    });

    document.getElementById("title").value = "";
    loadTasks();
});

loadTasks();