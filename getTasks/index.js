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
        const container = client.database(databaseId).container(containerId);
        const querySpec = { query: "SELECT * FROM c" };
        const { resources } = await container.items.query(querySpec).fetchAll();

        context.res = {
            status: 200,
            body: resources
        };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd pobierania" } };
    }
};