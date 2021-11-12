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

const promptFilter = () => {
    url.searchParams.set("filter", prompt("Enter tags to filter by"));
    window.location.href = url.href;
};

const shuffleRedirect = () => {
    url.searchParams.set("shuffle", 1);
    window.location.href = url.href;
};


// keyboard navigation
let ctrlHeld = false;
window.addEventListener("keydown", (event) => {
    switch(event.key) {
        case "ArrowLeft": moveTo(index - 1); break;
        case "ArrowRight": moveTo(index + 1); break;
        case "Control": ctrlHeld = true; break;
        case "l": if(ctrlHeld) loadMorePosts(); event.preventDefault(); break;
        case "g": if(ctrlHeld) moveTo(Number(prompt("Which post?"))); event.preventDefault(); break;
    }
});

window.addEventListener("keyup", (event) => {
    switch(event.key) {
        case "Control": ctrlHeld = false; break;
    }
});

// scrollwheel navigation
window.addEventListener("wheel", (event) => {

    // disable scroll navigation during zoom 
    if(!zoomed) moveTo(index + Math.sign(event.deltaY));
    
});

// initialize everything
setupFeedsMenu();
(loadAll ? loadAllPosts() : loadMorePosts()).then(() => moveTo(0));