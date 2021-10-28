// constants
const LOAD_RANGE = 8; // how far away a post can be before it gets unloaded

// elements
const slideshow = document.getElementById("slideshow");
const status = document.getElementById("top-status");
const debug = document.getElementById("debug");

let index = 0; // current image index
const feed = new URL(window.location).searchParams.get("feed");

const posts = [];
const slides = new Map();
let loading = false, error = false;

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

const htmlToDOM = (text) => {
    const template = document.createElement("template");
    template.innerHTML = text;
    return template.content.firstChild;
};

const createSlide = (post) => {

    const div = document.createElement("div");
    div.classList.add("slide");

    if(post.type === "image") {

        const img = document.createElement("img");
        
        img.referrerPolicy = "no-referrer"; // hide our nefarious intentions :)
        img.src = post.url;
        
        img.addEventListener("click", (event) => {
            img.classList.toggle("zoomed-in");
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

const loadMorePosts = async () => {

    if(loading) return;

    loading = true;
    updateStatus();

    const after = posts[posts.length - 1]?.id;
    const resp = await fetch(`/feeds/${feed}${after ? `?after=${after}` : ""}`);
    if(resp.ok) {
        const newPosts = await resp.json();
        posts.push(...newPosts);
    } else {
        error = true;
    }

    loading = false;
    updateStatus();

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
                console.log(`unloading post at ${i} (at ${pos}, d=${pos-i})`);
                slide.remove();
                slides.delete(post);
                slide = null;
            }
        } else if(!slides.get(post)) {
            console.log(`reloading post at ${i}`);
            slide = createSlide(post);
            slides.set(post, slide);
            slideshow.appendChild(slide);
        }

    }

    // show the current slide
    slides.get(posts[index])?.classList.remove("shown");
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
    //moveTo(index + Math.sign(event.deltaY));
});

updateStatus();
setupFeedsMenu();
loadMorePosts().then(() => moveTo(0));