// external deps
const express = require("express");

// local deps
const config = require("./config.json");
const feeds = require("./feeds.js");

console.log(feeds);

// user facing frontend
const app = express();

app.use((req, res, next) => {
    console.log(req.path);
    next();
});

app.use("/", express.static("./static"));

// saved, hidden, etc.
app.get("/feeds/:feed", async (req, res) => {
    if(feeds[req.params.feed] != null)
        res.json(await feeds[req.params.feed].get(req.query.after));
    else
        res.json([]);
});

app.use((req, res, next) => {
    res.status(200).sendFile(__dirname + "/html/index.html");
});

// listen on localhost
app.listen(config.app.port, () => {
    console.log(`Now listening on port ${config.app.port}`);
});