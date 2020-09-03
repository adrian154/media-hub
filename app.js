const express = require("express");
const reddit = require("./reddit.js");
const credentials = require("./credentials.json");

// reddit API accessing rearend
let accessToken;

const refreshToken = async function() {
    reddit.requestToken(credentials.username, credentials.password, credentials.clientID, credentials.clientSecret)
        .then((token) => {
            accessToken = token;
            setTimeout(refreshToken, token.expires_in * 1000);
        })
        .catch((error) => {
            console.error(error);
        });
};

refreshToken();

// user facing frontend
const app = express();

app.use("/", express.static("./public"));
app.get("/saved", async (req, res) => {
    let saved = await reddit.getSaved(tokenOptions[0], accessToken, req.query.after);
    res.send(JSON.stringify(saved));
});

// listen on localhost
app.listen(80);