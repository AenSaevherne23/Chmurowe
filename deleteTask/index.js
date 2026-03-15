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

        id = String(id); // wymuszenie stringa dla Cosmos DB

        const container = client.database(databaseId).container(containerId);

        // Usuwamy dokument po id i partition key
        await container.item(id, id).delete();

        context.res = {
            status: 200,
            body: { message: "Usunięto" }
        };

    } catch (err) {
        context.log(err);
        context.res = {
            status: 500,
            body: { message: "Błąd usuwania" }
        };
    }
};