// external deps
const express = require("express");

// local deps
const config = require("./config.json");
const feeds = require("./feeds.js");

// user facing frontend
const app = express();

// authentication middleware
app.use((req, res, next) => {

    const header = req.header("Authorization");

    if(header) {
  
        const parts = header.split(" ");
        if(parts[0] != "Basic") return res.sendStatus(401);

        const [username, password] = Buffer.from(parts[1], "base64").toString("utf-8").split(":");
        if(config.users[username] !== password) return res.sendStatus(401);

        next();

    } else {
        res.status(401).header("WWW-Authenticate", 'Basic realm = "Access media file"').send();
    }

});

// serve static files
app.use(express.static("./static"));

// serve a couple routes
app.get("/feeds", async (req, res) => {
    res.json(Object.keys(feeds));
});

app.get("/feeds/:feed", async (req, res) => {
    if(feeds[req.params.feed]) {
        res.json(await feeds[req.params.feed].get(req.query.after));
    } else {
        res.sendStatus(404);
    }
});

// catch errant requests
app.use((req, res, next) => {
    res.status(404).redirect("/not-found.html");
});

// listen on localhost
app.listen(config.app.port, () => {
    console.log(`Now listening on port ${config.app.port}`);
});