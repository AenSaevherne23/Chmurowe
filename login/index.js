const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

module.exports = async function (context, req) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            context.res = { status: 400, body: { message: "Brak danych" } };
            return;
        }

        const container = client.database(databaseId).container(containerId);

        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type = 'user' AND c.email = @email",
            parameters: [{ name: "@email", value: email }]
        }).fetchAll();

        const user = resources[0];
        if (!user) {
            context.res = { status: 401, body: { message: "Nieprawidłowe dane" } };
            return;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            context.res = { status: 401, body: { message: "Nieprawidłowe dane" } };
            return;
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        context.res = { status: 200, body: { token, id: user.id, name: user.name, email: user.email } };
    } catch (err) {
        context.log(err);
        context.res = { status: 500, body: { message: "Błąd logowania" } };
    }
};