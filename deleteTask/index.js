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
        let id = context.bindingData.id;
        if (!id) {
            context.res = { status: 400, body: { message: "Brak ID zadania" } };
            return;
        }
        id = String(id);

        const container = client.database(databaseId).container(containerId);

        const { resource: task } = await container.item(id, id).read();
        if (!task || task.userId !== user.userId) {
            context.res = { status: 404, body: { message: "Nie znaleziono zadania" } };
            return;
        }

        await container.item(id, id).delete();
        context.res = { status: 200, body: { message: "Usunięto" } };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd usuwania" } };
    }
};