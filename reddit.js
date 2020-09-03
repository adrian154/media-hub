const https = require("https");

// Promisified HTTPS requester
const makeRequest = async function(options) {

    return new Promise((resolve, reject) => {
        
        const request = https.request(options, (res) => {
            let body = "";
            res.on("data", (data) => body = body + data);
            res.on("end", () => resolve(body));
            res.on("error", (error) => reject(error));
        });
        
        request.end();

    });

};

// Request access token
const requestToken = async function(username, password, clientID, clientSecret) {

    let response = await makeRequest({
        hostname: "www.reddit.com",
        port: 443,
        path: `/api/v1/access_token?grant_type=password&username=${username}&password=${password}`,
        method: "POST",
        headers: {
            "User-Agent": "joey-the-bot", // necessary to avoid ratelimiting
            "Authorization": `Basic ${new Buffer(clientID + ":" + clientSecret).toString("base64")}`
        }
    });

    return JSON.parse(response);

};

// Convert access token to auth header
const tokenToAuthHeader = function(token) {
    return `${token.token_type} ${token.access_token}`;
};

// Get saved posts
const getSaved = async function(username, token, after_id) {

    let response = await makeRequest({
        hostname: "oauth.reddit.com",
        port: 443,
        path: `/user/${username}/saved?raw_json=1${after_id !== undefined ? `&after=${after_id}` : ""}`,
        method: "GET",
        headers: {
            "User-Agent": "joey-the-bot", // again, ratelimiting
            "Authorization": tokenToAuthHeader(token)
        }
    });

    return JSON.parse(response);

};

module.exports = {
    requestToken: requestToken,
    getSaved: getSaved
};