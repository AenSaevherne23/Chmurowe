const os = require("os");

 const VERSION = "v1";

module.exports = async function (context, req) {
    context.res = {
        status: 200,
        body: { version: VERSION, instance: os.hostname() }
    };
};