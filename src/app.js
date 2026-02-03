const express = require("express");
const pageRoutes = require("./routes/page.routes");

const app = express();
app.use(express.json());

app.use("/api/pages", pageRoutes);

module.exports = app;
