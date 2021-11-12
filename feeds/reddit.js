const config = require("../config.json").reddit;
const RedditAuth = require("../reddit-auth.js");
const fetch = require("node-fetch");

const redditAuth = new RedditAuth(config);

module.exports = class {

    constructor(params) {

        this.feedPath = "https://oauth.reddit.com";

        if(params.subreddit) {
            this.feedPath += `/r/${params.subreddit}`;
        } else if(params.subreddits) {
            this.feedPath += `/r/${params.subreddits.map(encodeURIComponent).join("+")}`;
        } else if(params.feed) {
            this.feedPath += `/user/${redditAuth.user.username}/${params.feed}`;
        }

    }

    async get(after) {

        const resp = await fetch(`${this.feedPath}?limit=100&raw_json=1${after ? `&after=${after}` : ""}`, {
            method: "GET",
            headers: {
                "User-Agent": "mediahub",
                "Authorization": await redditAuth.header()
            }
        });

        if(!resp.ok) {
            throw new Error("Failed to fetch items from Reddit: received status code " + resp.status);
        }

        const items = await resp.json();
        return items.data.children.map(entry => {
            
            const redditPost = entry.data;
            const post = {
                permalink: new URL(redditPost.permalink, "https://reddit.com").href,
                title: redditPost.title,
                id: redditPost.name,
                score: redditPost.score
            };

            if(redditPost.post_hint === "image") {
                post.type = "image";
                post.url = redditPost.url;
                return post;
            }
            
            if(redditPost.secure_media_embed?.content) {
                post.type = "embed";
                post.embed = redditPost.secure_media_embed;
                return post;
            }

        }).filter(Boolean);

    }

};