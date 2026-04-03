const { CosmosClient } = require("@azure/cosmos");
const { verifyToken } = require("../shared/auth");

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

module.exports = async function (context, req) {
    const user = verifyToken(req);
    if (!user) {
        context.res = { status: 401, body: { message: "Brak autoryzacji" } };
        return;
    }

    try {
        const container = client.database(databaseId).container(containerId);

        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'todo' AND c.userId = @userId",
            parameters: [{ name: "@userId", value: user.userId }]
        }).fetchAll();

        context.res = { status: 200, body: resources };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd pobierania" } };
    }
};