// constants
const LOAD_RANGE = 3; // how far away a post can be before it gets unloaded

// elements
const slideshow = document.getElementById("slideshow");
const status = document.getElementById("top-status");
const debug = document.getElementById("debug");

let index = 0; // current image index
const feed = new URL(window.location).searchParams.get("feed");

const posts = [];
const slides = new Map();
let loading = false;

const updateStatus = () => {

    if(posts.length > 0) {
        const post = posts[index];
        const text = `(${index + 1} / ${posts.length}) <a href="${post.permalink}">${post.title || "(untitled)"}</a>`;
        status.innerHTML = text;
    }

    if(loading) {
        debug.textContent = "Loading more...";
    } else {
        debug.textContent = "Idle.";
    }

};

// get more saved posts
const fetchPosts = async (after) => (await fetch(`/feeds/${feed}${after ? `?after=${after}` : ""}`)).json();

const htmlToDOM = (text) => {
    const template = document.createElement("template");
    template.innerHTML = text;
    return template.content.firstChild;
};

const createSlide = (post) => {

    const div = document.createElement("div");
    div.classList.add("slide");

    if(post.type === "image") {

        let img = document.createElement("img");
        img.referrerPolicy = "no-referrer"; // TODO: does this fix loading issues?
        img.src = post.url;
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

    console.log("loading more...");
    posts.push(...await fetchPosts(posts[posts.length - 1]?.id));

    loading = false;
    updateStatus();

};

const moveTo = (pos) => {

    if(pos < 0 || pos >= posts.length) return;

    // this loop is a big stinking turd
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

    slides.get(posts[index])?.classList.remove("shown");
    index = pos;
    slides.get(posts[index])?.classList.add("shown");

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
    moveTo(index + Math.sign(event.deltaY));
});

updateStatus();
loadMorePosts().then(() => moveTo(0));