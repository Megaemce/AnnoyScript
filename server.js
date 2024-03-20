const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

let buttonCounts = {}; // Object to store counts for each button

// Middleware to parse JSON bodies
app.use(express.json());

// Serve 11ty-generated files
app.use(express.static(path.join(__dirname, "_site")));

// Route to handle click for a specific button
app.post("/click/:buttonId", async (req, res) => {
  try {
    const { buttonId } = req.params;
    buttonCounts[buttonId] = (buttonCounts[buttonId] || 0) + 1;
    await fs.writeFile(
      path.join(__dirname, "bolts.json"),
      JSON.stringify(buttonCounts)
    );
    res.json({ totalClicks: buttonCounts[buttonId] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating click count");
  }
});

// Route to get click count for a specific button
app.get("/click/:buttonId", async (req, res) => {
  try {
    const { buttonId } = req.params;
    const data = await fs.readFile(path.join(__dirname, "bolts.json"));
    const counts = JSON.parse(data);
    const count = counts[buttonId] || 0;
    res.json({ totalClicks: count });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting click count");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
