const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// serve static files (html, css, js, json)
app.use(express.static("public"));

// API: list all templates
app.get("/api/templates", (req, res) => {
  const templateDir = path.join(__dirname, "public", "templates");

  fs.readdir(templateDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read template folder" });

    const templates = files.filter(f => f.endsWith(".json"));
    res.json(templates);
  });
});

// API: read template by filename
app.get("/api/templates/:file", (req, res) => {
  const filePath = path.join(__dirname, "public", "templates", req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Template not found" });
  }

  const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  res.json(json);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
