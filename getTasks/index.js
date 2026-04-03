const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

module.exports = async function (context, req) {
    try {
        const userId = req.query.userId;

        if (!userId) {
            context.res = { status: 400, body: { message: "Brak userId" } };
            return;
        }

        const container = client.database(databaseId).container(containerId);

        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'todo' AND c.userId = @userId",
            parameters: [{ name: "@userId", value: userId }]
        }).fetchAll();

        context.res = { status: 200, body: resources };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd pobierania" } };
    }
};