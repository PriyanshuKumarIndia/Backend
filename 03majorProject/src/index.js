import "dotenv/config";
import connectDB from "./db/index.js";

connectDB();

/*
import mongoose from "mongoose";
import "dotenv/config";
import { DB_NAME } from "./constants.js";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error(`Error starting the server: ${error.message}`);
      throw error;
    });

    app.get("/", (req, res) => {
      res.send("Hello, INDIA!");
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`Error connecting to the database: ${error.message}`);
    throw error;
  }
})();
*/
