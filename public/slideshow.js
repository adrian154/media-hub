const slideshow = document.getElementById("slideshow");
const status = document.getElementById("status");
const bottomStatus = document.getElementById("bottom-status");
const debug = document.getElementById("debug");

let ready = false; // initial images loaded?
let working = false; // loading images?
let cur = 0; // current image index
let posts = [];

const updateStatus = function() {

    if(ready) {
        let post = posts[cur];
        let text =
            `Image ${cur + 1} / ${posts.length}<br>` +
            `<a href="https://reddit.com${post.data.permalink}">${post.data.title}</a><br>` +
            `Posted in <a href="https://reddit.com/r/${post.data.subreddit}">r/${post.data.subreddit}</a> by <a href="https://reddit.com/u/${post.data.author}">u/${post.data.author}</a><br>` +
            `${post.data.score} upvotes (${post.data.upvote_ratio * 100}%)<br>`;
        status.innerHTML = text;
    }

    let bottomText = `${working ? (ready ? "Loading additional images..." : "Loading initial images...") : "Idle."}<br>Left/Right arrow to navigate.`;
    bottomStatus.innerHTML = bottomText;

};

// get more saved posts
const getSaved = async function(after) {
    let response = await fetch(`/saved${after !== undefined ? `?after=${after}` : ""}`);
    return response.json();
};

const show = function(DOMElement) { 
    
    DOMElement.style.zIndex = "1";
    DOMElement.style.opacity = "1";

    // scale if necessary
    let box = DOMElement.getBoundingClientRect();
    if(box.width > window.innerWidth || box.height > window.innerHeight) {
        let xScaleFactor = box.width / window.innerWidth;
        let yScaleFactor = box.height / window.innerHeight;
        if(xScaleFactor < yScaleFactor) {
            DOMElement.style.height = "100%";
        } else {
            DOMElement.style.width = "100%";
        }
    }

};

const hide = function(DOMElement) {
    DOMElement.style.zIndex = "0";
    DOMElement.style.opacity = "0";
};

const loadMorePosts = function(after) {
    
    working = true;
    updateStatus();

    getSaved(after).then(obj => {

        // add the new posts
        posts = posts.concat(obj.data.children);

        // insert the DOM elements for each post
        obj.data.children.map(child => {

            // create the parent slide
            let div = document.createElement("div");
            div.style.opacity = "0";
            div.classList.add("slide");

            // post_hint has info about what the post is
            if(child.data.post_hint === "image") {

                let img = document.createElement("img");
                img.src = child.data.url;
                img.classList.add("embed");
                
                // scale if necessary once image is loaded
                img.onload = function() {
                    if(img.width > window.innerWidth || img.height > window.innerHeight) {
                        let xScaleFactor = img.width / window.innerWidth;
                        let yScaleFactor = img.height / window.innerHeight;
                        if(xScaleFactor < yScaleFactor) {
                            img.style.height = "100%";
                        } else {
                            img.style.width = "100%";
                        }
                    }
                };

                div.appendChild(img);

            } else if(typeof child.data.media_embed === "object" && Object.keys(child.data.media_embed).length > 0) {

                // otherwise, it's a media embed
                let elem = new DOMParser().parseFromString(child.data.media_embed.content, "text/html").body.childNodes[0];
                elem.style.width = child.data.media_embed.width + "px";
                elem.style.height = child.data.media_embed.height + "px";
                elem.classList.add("embed");
                div.appendChild(elem);
                
            } else {

                // not supported
                let elem = document.createElement("p");
                elem.appendChild(document.createTextNode("Oops! Viewing this type of content is currently not supported."));
                elem.classList.add("embed");
                div.appendChild(elem);

            }

            // add the slide
            slideshow.appendChild(div);

        });

        // if initial, move
        if(!ready) {
            ready = true;
            move(0);
        }

        working = false;
        updateStatus();

    });

};

const move = function(dir) {

    // don't move if no posts loaded yet
    if(!ready) return;

    let elems = slideshow.querySelectorAll(".slide");

    // move
    cur += dir;
    cur = (cur + elems.length) % elems.length;

    // update url
    window.location = "#" + cur;

    // do fades
    hide(elems[(cur - dir + elems.length) % elems.length]);
    show(elems[cur]);

    // if necessary, load more
    if(posts.length - cur < 5 && dir > 0 && !working) {
        loadMorePosts(posts[posts.length - 1].data.name);
    }

    updateStatus();

};

window.addEventListener("keydown", (event) => {
    switch(event.key) {
        case "ArrowLeft": move(-1); break;
        case "ArrowRight": move(1); break;
    }
});

updateStatus();
loadMorePosts();

//setInterval(() => move(1), 1000);