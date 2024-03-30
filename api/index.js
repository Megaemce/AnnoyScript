const express = require("express");
const { kv } = require("@vercel/kv");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (_, res) => res.send("Express on Vercel"));

// Update the likes count
app.get("/:postTitle/likes", async (req, res) => {
  try {
    const { postTitle } = req.params;
    const likes = await kv.HINCRBY(postTitle, "likes", 1);

    res.json({ likes: likes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating likes count!");
  }
});

// Get the post statistics
app.get("/:postTitle", async (req, res) => {
  try {
    const { postTitle } = req.params;
    const views = await kv.HINCRBY(postTitle, "views", 1);
    const likes =
      (await kv.HGET(postTitle, "likes")) ||
      (await kv.HSET(postTitle, "likes", 0));

    res.json({ likes: likes, views: views });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting post stats!");
  }
});

app.listen(PORT, () => console.log(`Server ready on port ${PORT}.`));

module.exports = app;
