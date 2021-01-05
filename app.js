const express = require("express");
const reddit = require("./reddit.js");
const config = require("./config.json");

// reddit API accessing rearend
let accessToken;

const refreshToken = async function() {
    let token = await reddit.requestToken(config.credentials);
    accessToken = token;
    setTimeout(refreshToken, token.expires_in * 1000);
};

refreshToken();

// user facing frontend
const app = express();

app.use("/", express.static("./static"));

app.use((req, res, next) => {
    console.log(req.path);
    next();
});

// saved, hidden, etc.
app.get("/:feed/feed", async (req, res) => {
    res.json(await reddit.getPosts(
        `/user/${config.credentials.username}/${req.params.feed}`,
        accessToken,
        req.query.after
    ));
});

app.get("/:subreddit/:sort/feed", async (req, res) => {
    res.json(await reddit.getPosts(
        `/r/${req.params.subreddit}/${req.params.sort}`,
        accessToken,
        req.query.after
    ));
});

app.get("/:feed/", (req, res) => {
    res.sendFile(__dirname + "/html/index.html");
});

app.get("/:subreddit/:sort/", (req, res) => {
    res.sendFile(__dirname + "/html/index.html");
});

// listen on localhost
app.listen(80);