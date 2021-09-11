const fetch = require("node-fetch");

module.exports = class {

    constructor(user) {
        this.user = user;
        this.refreshToken(user);
    }

    async refreshToken(user) {
        this.token = await this.getNewToken(user);
        console.log("got token");
        setTimeout(this.refreshToken, (this.token.expires_in - 10) * 1000);
    }

    async getNewToken(user) {
        return (await fetch(`https://www.reddit.com/api/v1/access_token?grant_type=password&username=${user.username}&password=${user.password}`, {
            method: "POST",
            headers: {
                "User-Agent": "mediahub",
                "Authorization": `Basic ${Buffer.from(user.clientID + ":" + user.clientSecret).toString("base64")}`
            }
        })).json();
    }

    header() {
        return this.token.token_type + " " + this.token.access_token;
    }

}