// parse options
const readOption = (name, defaultValue) => {
    const value = localStorage.getItem(name);
    if(value) return value;
    localStorage.setItem(name, defaultValue);
    return defaultValue;
};

const LOAD_RANGE = readOption("loadRange", 8);
const FANCY_BACKGROUND = readOption("fancyBackground", "false") === "true";
const THEME = readOption("theme", "default");
const AUTOPLAY_RATE = readOption("autoplayRate", 3);