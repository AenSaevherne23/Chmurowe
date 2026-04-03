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
        const { title } = req.body;

        if (!title || title.trim() === "") {
            context.res = { status: 400, body: { message: "Brak tytułu" } };
            return;
        }

        const container = client.database(databaseId).container(containerId);

        const task = {
            id: Date.now().toString(),
            type: "todo",
            title: title.trim(),
            completed: false,
            userId: user.userId,
            createdAt: new Date().toISOString()
        };

        const { resource } = await container.items.create(task);
        const { id, title: taskTitle, completed } = resource;
        context.res = { status: 201, body: { id, title: taskTitle, completed } };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd zapisu" } };
    }
};