// external deps
const express = require("express");

// local deps
const config = require("./config.json");
const feeds = require("./data/feeds.js");

// user facing frontend
const app = express();
if(config.proxy) app.enable("trust proxy");

// print out some debug info for sanity purposes
const version = require("child_process").execSync("git rev-parse --short HEAD").toString().trim();
console.log(`Running MediaHub version ${version}`);

// authentication middleware
app.use((req, res, next) => {

    const header = req.header("Authorization");

    if(header) {
  
        const parts = header.split(" ");
        if(parts[0] != "Basic") return res.sendStatus(401);

        const [username, password] = Buffer.from(parts[1], "base64").toString("utf-8").split(":");
        if(config.users[username] !== password) {
            console.log(`Failed auth (username "${username}" from ${req.ip})`);
            return res.sendStatus(401);
        }

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
        res.json(await feeds[req.params.feed].get(req.query.after, req.query));
    } else {
        res.sendStatus(404);
    }
});

// catch errant requests
app.use((req, res, next) => {
    res.status(404).redirect("/");
});

app.use((err, req, res, next) => {
    res.sendStatus(500);
    console.error(err);
});

// listen on localhost
app.listen(config.port, () => {
    console.log(`Now listening on port ${config.port}`);
});