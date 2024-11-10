const mongoose = require("mongoose");
const url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_MONGO_URL
    : process.env.DEV_MONGO_URL;

const db = mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to the mongodb database");
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = db;
