// constants
const LOAD_RANGE = 8; // how far away a post can be before it gets unloaded

// elements
const slideshow = document.getElementById("slideshow");
const status = document.getElementById("top-status");
const debug = document.getElementById("debug");

// parse url
const url = new URL(window.location);
const feedURL = `/feeds/${encodeURIComponent(url.searchParams.get("feed"))}`;

// slideshow state
const posts = [];
const slides = new Map();
let index = 0,
    loading = false,
    error = false,
    zoomed = false,
    shuffle = url.searchParams.get("shuffle");

// set up list of feeds at the top
const setupFeedsMenu = async () => {

    const resp = await fetch("/feeds");
    const feeds = await resp.json();

    const feedsList = document.getElementById("feeds");
    for(const feed of feeds) {
        const elem = document.createElement("span");
        const link = document.createElement("a");
        link.href = `/?feed=${encodeURIComponent(feed)}`;
        link.textContent = feed;
        elem.append(link);
        feedsList.append(elem);
    }

};

// update the status indicator
const updateStatus = () => {

    if(posts.length > 0) {
        const post = posts[index];
        status.innerHTML = `(${index + 1} / ${posts.length}) <a href="${post.permalink}">${post.title || "untitled"}</a>`;
    }

    if(loading) {
        debug.textContent = "Fetching posts...";
    } else if(error) {
        debug.textContent = "Failed to load more posts!";
        debug.style.color = "#ff5959";
    } else {
        debug.textContent = "";
    }

};

// helper method (used with embeds)
const htmlToDOM = (text) => {
    const template = document.createElement("template");
    template.innerHTML = text;
    return template.content.firstChild;
};

// create a slide element for a post
const createSlide = (post) => {

    const div = document.createElement("div");
    div.classList.add("slide");

    if(post.type === "image") {

        const img = document.createElement("img");
        
        img.referrerPolicy = "no-referrer"; // hide our nefarious intentions :)
        img.src = post.url;
        
        img.addEventListener("load", (event) => {
            if(img.naturalWidth > img.width || img.naturalHeight > img.height) {
                img.classList.add("zoomable");
            }
        });

        img.addEventListener("click", (event) => {
            if(img.classList.contains("zoomable")) {
                zoomed = div.classList.toggle("zoomed-in");
            }
        });

        // add the image
        div.appendChild(img);

    } else if(post.type === "embed") {

        const embed = post.embed;
        const element = htmlToDOM(post.embed.content);
        element.style.width = embed.width + "px";
        element.style.height = embed.height + "px";
        div.appendChild(element);

    }

    return div;

};

// load more posts
const loadMorePosts = async () => {

    if(loading || shuffle) return;

    loading = true;
    updateStatus();

    const after = posts[posts.length - 1]?.id;
    const resp = await fetch(`${feedURL}${after ? `?after=${after}` : ""}`);
    if(resp.ok) {
        const newPosts = await resp.json();
        posts.push(...newPosts);
    } else {
        error = true;
    }

    loading = false;
    updateStatus();

};

// used with shuffle
const loadAllPosts = async () => {

    let after;

    while(true) {
        const resp = await fetch(`${feedURL}${after ? `?after=${after}` : ""}`);  
        const newPosts = await resp.json();
        if(newPosts.length > 0) {
            posts.push(...newPosts);
            after = newPosts[newPosts.length - 1].id;
        } else {
            break;
        }
    }

    // shuffle
    for(let i = 0; i < posts.length - 2; i++) {
        const j = Math.floor(Math.random() * (posts.length - i)) + i;
        const temp = posts[j];
        posts[j] = posts[i];
        posts[i] = temp;
    }

};

const shuffleRedirect = () => {
    url.searchParams.set("shuffle", 1);
    window.location.href = url.href;
};

const moveTo = (pos) => {

    if(pos < 0 || pos >= posts.length) return;

    // this loop is a big stinking turd
    // remove old posts
    for(let i = 0; i < posts.length; i++) {
        
        const post = posts[i];
        let slide = slides.get(post);

        if(Math.abs(i - pos) > LOAD_RANGE) {
            if(slide) {
                slide.remove();
                slides.delete(post);
                slide = null;
            }
        } else if(!slides.get(post)) {
            slide = createSlide(post);
            slides.set(post, slide);
            slideshow.appendChild(slide);
        }

    }

    // show the current slide
    const current = slides.get(posts[index]);

    // unzoom and hide
    current.classList.remove("shown");
    current.classList.remove("zoomed-in");
    zoomed = false;

    // move
    index = pos;
    slides.get(posts[index])?.classList.add("shown");

    // if we've gotten close to the end, start fetching more posts
    if(posts.length - index < LOAD_RANGE) loadMorePosts(); 
    updateStatus();

};

let ctrlHeld = false;

window.addEventListener("keydown", (event) => {
    switch(event.key) {
        case "ArrowLeft": moveTo(index - 1); break;
        case "ArrowRight": moveTo(index + 1); break;
        case "Control": ctrlHeld = true; break;
        case "l": if(ctrlHeld) loadMorePosts(); event.preventDefault(); break;
        case "g": if(ctrlHeld) moveTo(Number(prompt("Where to?"))); event.preventDefault(); break;
    }
});

window.addEventListener("keyup", (event) => {
    switch(event.key) {
        case "Control": ctrlHeld = false; break;
    }
});

window.addEventListener("wheel", (event) => {

    // disable scroll navigation during zoom 
    if(!zoomed) moveTo(index + Math.sign(event.deltaY));
    
});

// initialize everything
setupFeedsMenu();
(shuffle ? loadAllPosts() : loadMorePosts()).then(() => moveTo(0));