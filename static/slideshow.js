// elements
const slideshow = document.getElementById("slideshow");
const postPosition = document.getElementById("post-position");
const postLink = document.getElementById("post-link");
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

// update the post info section
const updatePostInfo = () => {
    const post = posts[index];
    if(post) {
        postPosition.textContent = `${index + 1} / ${posts.length}`;
        postLink.href = post.url;
        postLink.textContent = post.title || "untitled";
    }
};

const setStatusText = (text, error) => {
    debug.textContent = text || "";
    debug.style.color = error ? "#ff5959" : "";
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

        if(FANCY_BACKGROUND) {
            const bg = document.createElement("img");
            bg.classList.add("background");
            bg.src = post.url;
            div.appendChild(bg);
        }

    } else if(post.type === "embed") {

        const embed = post.embed;
        const element = htmlToDOM(post.embed.content);
        element.style.width = embed.width + "px";
        element.style.height = embed.height + "px";
        element.style.position = "relative"; // ignore absolute positioning
        div.appendChild(element);

    }

    return div;

};

// load more posts
const loadMorePosts = async () => {

    if(loading || shuffle) return;

    loading = true;
    setStatusText("Fetching more posts...");

    const after = posts[posts.length - 1]?.id;
    const resp = await fetch(`${feedURL}${after ? `?after=${after}` : ""}`);
    if(resp.ok) {
        const newPosts = await resp.json();
        posts.push(...newPosts);
    } else {
        error = true;
    }

    loading = false;
    setStatusText();

};

// used with shuffle
const loadAllPosts = async () => {

    let after = null;
    const shuffledPosts = [];
    
    // start loading
    loading = true;
    setStatusText("Collecting posts...");

    while(true) {

        const resp = await fetch(`${feedURL}${after ? `?after=${after}` : ""}`);  
        const newPosts = await resp.json();
        
        if(newPosts.length > 0) {
            shuffledPosts.push(...newPosts);
            after = shuffledPosts[shuffledPosts.length - 1].id;
            setStatusText(`Collecting posts... (${shuffledPosts.length})`);
        } else {
            break;
        }

    }

    // shuffle
    for(let i = 0; i < shuffledPosts.length - 2; i++) {
        const j = Math.floor(Math.random() * (shuffledPosts.length - i)) + i;
        const temp = shuffledPosts[j];
        shuffledPosts[j] = shuffledPosts[i];
        shuffledPosts[i] = temp;
    }

    // add the shuffled posts to the 
    posts.push(...shuffledPosts);

    loading = false;
    setStatusText();

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
    updatePostInfo();

};