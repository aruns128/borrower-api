const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();
require("./database/connection");

const userRouter = require("./routes/user.route");
const loanRouter = require("./routes/loan.route");

const app = express();

//Middleware
app.use(cookieParser());
app.use(cors());

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

//Routes
app.use("/auth", userRouter);
app.use("/borrower", loanRouter);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
