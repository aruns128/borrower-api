const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const clientUrl = process.env.DEV_REACT_URL;
const app = express();

//Middleware
app.use(cookieParser());
app.use(cors());

app.use(express.json());

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
