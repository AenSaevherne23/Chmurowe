const os = require("os");

const VERSION = "v1";
const PODATNY = true;

module.exports = async function (context, req) {
    context.res = {
        status: 200,
        body: { version: VERSION, podatny: PODATNY, instance: os.hostname() }
    };
};