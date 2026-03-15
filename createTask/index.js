const { CosmosClient } = require("@azure/cosmos");

// Tworzymy klienta Cosmos DB używając zmiennych środowiskowych w Azure
const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});

const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

module.exports = async function (context, req) {
    try {
        const { title } = req.body;

        if (!title || title.trim() === "") {
            context.res = {
                status: 400,
                body: { message: "Brak tytułu" }
            };
            return;
        }

        const container = client.database(databaseId).container(containerId);

        // Tworzymy zadanie z unikalnym id
        const task = {
            id: Date.now().toString(),
            title: title.trim(),
            completed: false
        };

        const { resource } = await container.items.create(task);

        // Zwracamy tylko potrzebne pola
        const { id, title: taskTitle, completed } = resource;

        context.res = {
            status: 201,
            body: { id, title: taskTitle, completed }
        };

    } catch (err) {
        context.log(err);
        context.res = {
            status: 500,
            body: { message: "Błąd zapisu" }
        };
    }
};