require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { startCrawling } = require("./services/crawler.service");

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await startCrawling();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
