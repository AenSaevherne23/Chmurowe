const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcryptjs");

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

module.exports = async function (context, req) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            context.res = { status: 400, body: { message: "Brak danych" } };
            return;
        }

        const container = client.database(databaseId).container(containerId);

        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'user' AND c.email = @email",
            parameters: [{ name: "@email", value: email }]
        }).fetchAll();

        if (resources.length > 0) {
            context.res = { status: 409, body: { message: "Email już zajęty" } };
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            id: "user_" + Date.now().toString(),
            type: "user",
            name,
            email,
            password: hashedPassword
        };

        const { resource } = await container.items.create(user);
        context.res = { status: 201, body: { id: resource.id, name: resource.name, email: resource.email } };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd rejestracji" } };
    }
};