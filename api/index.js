"use strict";

const serverless = require("serverless-http");
const createApiApp = require("../server/api-app");

const app = createApiApp();

module.exports = serverless(app);
