const fetch = require("node-fetch");

module.exports = class {

    constructor(user) {
        this.user = user;
        this.refreshToken();
    }

    async refreshToken() {
        
        if(!this.token || this.token.acquiredAt + this.token.expires_in * 1000 < Date.now()) {
            return (this.token = await this.getNewToken());
        }

        return this.token;

    }

    async getNewToken() {

        const resp = await fetch(`https://www.reddit.com/api/v1/access_token?grant_type=password&username=${this.user.username}&password=${this.user.password}`, {
            method: "POST",
            headers: {
                "User-Agent": "mediahub",
                "Authorization": `Basic ${Buffer.from(this.user.clientID + ":" + this.user.clientSecret).toString("base64")}`
            }
        });

        const token = await resp.json();
        token.acquiredAt = Date.now();
        return token;

    }

    async header() {
        await this.refreshToken();
        return this.token.token_type + " " + this.token.access_token;
    }

}