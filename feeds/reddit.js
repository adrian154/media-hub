const util = require("../util.js");

const tokenToAuthHeader = function(token) {
    return `${token.token_type} ${token.access_token}`;
};

module.exports = class {

    constructor(redditAuther, feed) {
        this.auth = redditAuther;
        this.feed = feed;
    }

    async get(after) {

        let response = JSON.parse(await util.makeRequest({
            hostname: "oauth.reddit.com",
            port: 443,
            path: `${this.feed}?limit=50&raw_json=1${after !== undefined ? `&after=${after}` : ""}`,
            method: "GET",
            headers: {
                "User-Agent": "reddit-media-slideshow", // necessary to avoid ratelimiting
                "Authorization": tokenToAuthHeader(this.auth.getActiveToken())
            }
        })).data.children.map(entry => {

            let redditPost = entry.data;
            let post = {
                permalink: redditPost.permalink,
                title: redditPost.title,
                id: redditPost.name,
                scoreStr: `${redditPost.score} upvotes (${redditPost.upvote_ratio * 100}%)`
            };

            if(redditPost.post_hint === "image") {
                post.type = "image";
                post.url = redditPost.url;
            } else if(redditPost.media_embed && Object.keys(redditPost.media_embed).length > 0) {
                post.type = "embed";
                post.width = redditPost.media_embed.width,
                post.height = redditPost.media_embed.height,
                post.content = redditPost.media_embed.content
            }

            return post;

        });

        return response;

    }

};