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
        let id = context.bindingData.id; // pobieramy id z URL: /tasks/{id}

        if (!id) {
            context.res = {
                status: 400,
                body: { message: "Brak ID zadania" }
            };
            return;
        }

        // Wymuszamy string, bo Cosmos DB wymaga stringa jako id i partitionKey
        id = String(id);

        const container = client.database(databaseId).container(containerId);

        // Pobieramy pojedynczy dokument po id
        const { resource } = await container.item(id, id).read();

        if (!resource) {
            context.res = {
                status: 404,
                body: { message: "Nie znaleziono zadania" }
            };
            return;
        }

        // Zwracamy tylko potrzebne pola
        const { id: taskId, title, completed } = resource;

        context.res = {
            status: 200,
            body: { id: taskId, title, completed }
        };

    } catch (err) {
        context.log(err);
        context.res = {
            status: 500,
            body: { message: "Błąd pobierania" }
        };
    }
};