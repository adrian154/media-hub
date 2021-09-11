const fetch = require("node-fetch");

module.exports = class {

    constructor(redditAuth, feedPath) {
        this.auth = redditAuth;
        this.feedPath = feedPath;
    }

    async get(after) {

        const resp = await fetch(`https://oauth.reddit.com/${this.feedPath}?limit=50&raw_json=1${after ? `&after=${after}` : ""}`, {
            method: "GET",
            headers: {
                "User-Agent": "mediahub",
                "Authorization": this.auth.header()
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