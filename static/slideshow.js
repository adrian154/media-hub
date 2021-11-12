// elements
const slideshow = document.getElementById("slideshow");
const postPosition = document.getElementById("post-position");
const postLink = document.getElementById("post-link");
const debug = document.getElementById("debug");

// url parsing
const url = new URL(window.location);
const feedURL = `/feeds/${encodeURIComponent(url.searchParams.get("feed"))}`;
const shuffle = Boolean(url.searchParams.get("shuffle"));
const filter = url.searchParams.get("filter")?.split(" ");

// do we need to load all the posts first to process them?
const loadAll = shuffle || filter;

// slideshow state
const posts = []; // the list of posts as received from the server
const displayedPosts = new Map();

let index = 0, // position in slideshow
    loading = false, // are more posts being fetched?
    zoomed = false; // is the user zoomed in?

// update the post info section
const updatePostInfo = () => {
    const post = posts[index];
    if(post) {
        postPosition.textContent = `${index + 1} / ${posts.length}`;
        postLink.href = post.permalink || post.url;
        postLink.textContent = post.title || "untitled";
    }
};

const setStatusText = (text, error) => {
    debug.textContent = text || "";
    debug.style.color = error ? "#ff5959" : "";
};

// turn a post into HTML elements
const createPost = (post) => {

    // slideshow element
    const div = document.createElement("div");
    div.classList.add("slide");

    if(post.type === "image") {

        const img = document.createElement("img");
        
        img.referrerPolicy = "no-referrer"; // necessary to avoid ratelimiting sometimes
        img.src = post.url;
        
        img.addEventListener("load", (event) => {

            // if the image is too small mark it as zoomable
            div.appendChild(img);
            const box = img.getBoundingClientRect();
            if(img.naturalWidth > box.width || img.naturalHeight > box.height) {
                img.classList.add("zoomable");
            }

        });

        // zoom handler
        img.addEventListener("click", (event) => {
            if(img.classList.contains("zoomable")) {
                zoomed = div.classList.toggle("zoomed-in");
            }
        });

        if(FANCY_BACKGROUND) {
            const bg = document.createElement("img");
            bg.classList.add("background");
            bg.src = post.url;
            div.appendChild(bg);
        }

    } else if(post.type === "embed") {

        const embed = post.embed;

        // create element
        const element = document.createElement("div");
        element.classList.add("embed");
        element.insertAdjacentHTML("afterbegin", embed.content);

        // let twitter handle sizing on its own
        if(!element.firstChild?.classList.contains("twitter-video")) {
            element.style.width = embed.width + "px";
            element.style.height = embed.height + "px";
        }

        div.appendChild(element);
        twttr.widgets.load(element);

    }

    return div;

};

// load more posts
const fetchMorePosts = async () => {

    if(loading || loadAll) return;

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
    let shuffledPosts = [];
    
    // start loading
    loading = true;
    setStatusText("Collecting posts...");

    while(true) {

        const resp = await fetch(`${feedURL}${after ? `?after=${after}` : ""}`);  
        const newPosts = await resp.json();
        
        if(newPosts.length > 0) {
            shuffledPosts.push(...newPosts);
            after = shuffledPosts[shuffledPosts.length - 1].id;
            setStatusText(`Collected ${shuffledPosts.length} posts...`);
        } else {
            break;
        }

    }

    // filters also include the post type as a tag
    if(filter) {
        shuffledPosts = shuffledPosts.filter(post => post.tags?.reduce((a, tag) => a || filter.includes(tag), false) || filter.includes(post.type));
    }

    if(shuffle) {
        for(let i = 0; i < shuffledPosts.length - 2; i++) {
            const j = Math.floor(Math.random() * (shuffledPosts.length - i)) + i;
            const temp = shuffledPosts[j];
            shuffledPosts[j] = shuffledPosts[i];
            shuffledPosts[i] = temp;
        }
    }

    // append shuffled posts
    posts.push(...shuffledPosts);

    loading = false;
    setStatusText();

};

const moveTo = (destPos) => {

    if(destPos < 0 || destPos >= posts.length) return;

    // remove posts that are too far from the current one
    for(const [position, post] of displayedPosts.entries()) {
        if(Math.abs(position - destPos) > LOAD_RANGE) {
            post.element?.remove();
            displayedPosts.delete(position);
        }
    }

    // load new posts if necessary
    for(let offset = -LOAD_RANGE; offset <= LOAD_RANGE; offset++) {

        const pos = destPos + offset;
        if(displayedPosts.has(pos)) {
            continue;
        }

        const post = posts[pos];
        if(post) {
            const data = {post};
            data.slide = createPost(post);
            slideshow.append(data.slide);
            displayedPosts.set(pos, data);
        }

    }

    // clean up previous slide and hide it
    const old = displayedPosts.get(index);
    if(old.slide && destPos !== index) {
        old.slide.classList.remove("shown");
        old.slide.classList.remove("zoomed-in");
    }

    // re-enable scroll nav
    zoomed = false;

    // update index
    index = destPos;

    // show new post
    const current = displayedPosts.get(index);
    current.slide.classList.add("shown");

    // if we've gotten close to the end, start fetching more posts
    if(posts.length - index < LOAD_RANGE) fetchMorePosts(); 

    // update post links
    updatePostInfo();

};

(loadAll ? loadAllPosts() : fetchMorePosts()).then(() => moveTo(0));