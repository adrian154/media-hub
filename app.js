// external deps
const express = require("express");

// local deps
const config = require("./config.json");
const feeds = require("./feeds.js");

// user facing frontend
const app = express();

// serve static files
app.use(express.static("./static"));

// serve feeds
app.get("/feeds/:feed", async (req, res) => {
    if(feeds[req.params.feed]) {
        res.json(await feeds[req.params.feed].get(req.query.after));
    } else {
        res.sendStatus(400);
    }
});

// listen on localhost
app.listen(config.app.port, () => {
    console.log(`Now listening on port ${config.app.port}`);
});