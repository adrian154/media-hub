const util = require("./util.js");

module.exports = class {

    constructor(user) {
        this.refreshToken(user);
    }

    async refreshToken(user) {
        this.token = await this.getToken(user);
        setTimeout(this.refreshToken, (this.token.expires_in - 1) * 1000);
    }

    async getToken(user) {
        return JSON.parse(await util.makeRequest({
            hostname: "www.reddit.com",
            port: 443,
            path: `/api/v1/access_token?grant_type=password&username=${user.username}&password=${user.password}`,
            method: "POST",
            headers: {
                "User-Agent": "reddit-media-slideshow", // necessary to avoid ratelimiting
                "Authorization": `Basic ${Buffer.from(user.clientID + ":" + user.clientSecret).toString("base64")}`
            }
        }));
    }

    getActiveToken() {
        return this.token;
    }

}