const slideshow = document.getElementById("slideshow");
const status = document.getElementById("status");
const bottomStatus = document.getElementById("bottom-status");
const debug = document.getElementById("debug");

let cur = 0; // current image index
let feed = new URL(window.location).searchParams.get("feed");

let posts = [];
let postSlides = new Map();
let loading = false;

const updateStatus = function() {

    if(posts.length > 0) {
        let post = posts[cur];
        let text =
            `(${cur + 1} / ${posts.length}) <a href="https://reddit.com${post.permalink}">${post.title}</a><br>` +
            post.scoreStr;
        status.innerHTML = text;
    }

    let bottomText = `Left/Right arrow to navigate.<br>Ctrl+L to load more, Ctrl+G to jump`;
    bottomStatus.innerHTML = bottomText;

};

// get more saved posts
const getPosts = async function(after) {
    let response = await fetch(`/feeds/${feed}${after !== undefined ? `?after=${after}` : ""}`);
    return response.json();
};

const show = function(DOMElement) { 
    updateStatus();
    DOMElement.style.zIndex = "1";
    DOMElement.style.opacity = "1";
};

const hide = function(DOMElement) {
    DOMElement.style.zIndex = "0";
    DOMElement.style.opacity = "0";
};

const postToSlide = function(post) {

    let div = document.createElement("div");
    div.style.opacity = "0";
    div.classList.add("slide");

    if(post.type === "image") {

        let img = document.createElement("img");
        img.src = post.url;
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

    } else if(post.type === "embed") {

        let elem = new DOMParser().parseFromString(post.content, "text/html").body.childNodes[0];
        elem.style.width = post.width + "px";
        elem.style.height = post.height + "px";
        elem.classList.add("embed");
        div.appendChild(elem);        

    }

    return div;

};

const loadMorePosts = async function(after) {

    console.log("Loading after " + after);

    if(loading) return;
    loading = true;

    posts = posts.concat(await getPosts(after));

    loading = false;
    updateStatus();

    console.log("Done");

};

const goto = function(pos) {

    cur = pos;

    // destroy existing
    postSlides.forEach((value, key) => {
        value.remove();
        postSlides.delete(key);
    });

    // preload
    for(let i = -3; i <= 3; i++) {
        if(pos + i >= 0 && pos + i < posts.length && !postSlides.get(posts[pos + i])) {
            let elem = postToSlide(posts[pos + i]);
            postSlides.set(posts[pos + i], elem);
            slideshow.appendChild(elem);
        }
    }

    show(postSlides.get(posts[cur]));

};

const move = function(dir) {

    // don't move if nothing is loaded
    if(posts.length == 0) return;

    // move post index
    if(dir < 0 ? cur > 0 : cur < posts.length - 1) {
        cur += dir;
    }

    if(!postSlides.get(posts[cur])) {
        let elem = postToSlide(posts[cur]);
        postSlides.set(posts[cur], elem);
        slideshow.appendChild(elem);
    }

    show(postSlides.get(posts[cur]));
    hide(postSlides.get(posts[cur - dir]));

    // preload
    let prev = cur - dir * 5;
    let next = cur + dir * 5;

    if(prev >= 0 && prev < posts.length) {
        if(postSlides.get(posts[prev])) {
            postSlides.get(posts[prev]).remove();
            postSlides.delete(posts[prev]);
        }
    }

    if(next >= 0 && next < posts.length) {
        if(!postSlides.get(posts[next])) {
            let elem = postToSlide(posts[next]);
            postSlides.set(posts[next], elem);
            slideshow.appendChild(elem);
        }
    }

    // if necessary, load more
    if(posts.length - cur < 10) {
        loadMorePosts(posts[posts.length - 1].id);
    }

};

let ctrlHeld = false;

window.addEventListener("keydown", (event) => {
    switch(event.key) {
        case "ArrowLeft": move(-1); break;
        case "ArrowRight": move(1); break;
        case "Control": ctrlHeld = true; break;
        case "l": if(ctrlHeld) loadMorePosts(posts[posts.length - 1].id); event.preventDefault(); break;
        case "g": if(ctrlHeld) goto(Number(prompt("Where to?"))); event.preventDefault(); break;
    }
});

window.addEventListener("keyup", (event) => {
    switch(event.key) {
        case "Control": ctrlHeld = false; break;
    }
});

window.addEventListener("wheel", (event) => {
    move(Math.sign(event.deltaY));
});

updateStatus();
loadMorePosts().then(() => goto(0));