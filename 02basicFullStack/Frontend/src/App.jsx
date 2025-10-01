import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [posts, setposts] = useState([]);

  useEffect(() => {
    axios
      .get("/api/posts")
      .then((response) => {
        setposts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
      });
  });

  return (
    <>
      <h1>Hello I am Priyanshu Kumar</h1>
      <h2>Here are {posts.length} posts for you:</h2>

      {posts.map((post) => {
        return (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        );
      })}
    </>
  );
}

export default App;
