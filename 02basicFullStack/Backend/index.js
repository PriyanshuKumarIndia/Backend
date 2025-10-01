import express from "express";

const app = express();
const port = 3000;

const data = [
  {
    id: 1,
    title: "First Post",
    content: "This is the content of the first post.",
  },
  {
    id: 2,
    title: "Second Post",
    content: "This is the content of the second post.",
  },
  {
    id: 3,
    title: "Third Post",
    content: "This is the content of the third post.",
  },
  {
    id: 4,
    title: "Fourth Post",
    content: "This is the content of the fourth post.",
  },
  {
    id: 5,
    title: "Fifth Post",
    content: "This is the content of the fifth post.",
  },
];

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/posts", (req, res) => {
  res.json(data);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
