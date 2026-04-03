const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

module.exports = async function (context, req) {
    try {
        let id = context.bindingData.id;
        if (!id) {
            context.res = { status: 400, body: { message: "Brak ID zadania" } };
            return;
        }
        id = String(id);

        const { title, completed } = req.body;
        const container = client.database(databaseId).container(containerId);

        const { resource: task } = await container.item(id, id).read();
        if (!task) {
            context.res = { status: 404, body: { message: "Nie znaleziono zadania" } };
            return;
        }

        if (title !== undefined) task.title = title;
        if (completed !== undefined) task.completed = completed;

        const { resource: updatedTask } = await container.item(id, id).replace(task);
        const { id: taskId, title: taskTitle, completed: taskCompleted } = updatedTask;
        context.res = { status: 200, body: { id: taskId, title: taskTitle, completed: taskCompleted } };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd aktualizacji" } };
    }
};