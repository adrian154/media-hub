const config = require("../config.json").reddit;
const RedditAuth = require("../reddit-auth.js");
const fetch = require("node-fetch");

const redditAuth = new RedditAuth(config);

module.exports = class {

    async convertImgurAlbum(post, url) {
        
        // fetch the images from the Imgur API
        const hash = url.pathname.split("/").filter(Boolean)[1];
        const resp = await fetch(`https://api.imgur.com/3/album/${hash}`, {headers: {Authorization: `Client-ID ${config.imgurClientID}`}});
        
        if(resp.ok) {
            
            // turn each image into a feed entry
            const {data} = await resp.json();
            return data.images.map(image => {

                // copy `post`
                const postCopy = Object.assign({}, post);
                postCopy.type = "image";
                postCopy.url = image.link;
                return postCopy;

            });

        } else {
            console.error(`Imgur request failed: ${url.href}`);
        }

    }

    convertGallery(post, redditPost) {
        return redditPost.gallery_data.items.map(item => {
            const copy = Object.assign({}, post);
            const extension = redditPost.media_metadata[item.media_id].m.split("/")[1];
            copy.type = "image";
            copy.url = `https://i.redd.it/${item.media_id}.${extension}`;
            return copy;
        });
    }

    async convertPost(entry) {

        const redditPost = entry.data;
        const post = {
            permalink: new URL(redditPost.permalink, "https://reddit.com").href, // probably unnecessary to use URL for this
            title: redditPost.title,
            id: redditPost.name,
            tags: [redditPost.subreddit, redditPost.author]
        };

        if(redditPost.post_hint === "image") {
            post.type = "image";
            post.url = redditPost.url;
            return post;
        }
        
        if(redditPost.secure_media_embed?.content) {

            // expand Imgur albums
            const url = new URL(redditPost.url);
            if(url.host === "imgur.com") {
                return this.convertImgurAlbum(post, url);
            } 

            post.type = "embed";
            post.embed = redditPost.secure_media_embed;
            return post;

        }

        if(redditPost.gallery_data) {
            return this.convertGallery(post, redditPost);
        }

    }

    async get(after, params) {

        let feedPath = "https://oauth.reddit.com";

        if(params.subreddit) {
            feedPath += `/r/${params.subreddit}`;
        } else if(params.subreddits) {
            feedPath += `/r/${params.subreddits.map(encodeURIComponent).join("+")}`;
        } else if(params.f) {
            feedPath += `/user/${params.user || redditAuth.user.username}/${params.f}`;
        }

        const u = new URL(feedPath);
        if(params.t) u.searchParams.set("t", params.t);
        if(params.s) u.searchParams.set("sort", params.s);
        u.searchParams.set("limit", 50);
        u.searchParams.set("raw_json", 1);
        u.searchParams.set("after", after);

        console.log(u);
        
        const resp = await fetch(u, {
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
        //console.log(items.data.children);
        return (await Promise.all(items.data.children.map(async entry => this.convertPost(entry)))).flat().filter(Boolean);

    }

};