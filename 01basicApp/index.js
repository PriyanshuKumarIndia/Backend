import "dotenv/config";
import express from "express";

const app = express();

const port = 3000;

app.get("/", (req, res) => {
  res.send("<h1>Hello INDIA!</h1>");
});

app.listen(port, () => {
  console.log(
    `Server is running on http://localhost:${port} ${process.env.PORT}`
  );
});
