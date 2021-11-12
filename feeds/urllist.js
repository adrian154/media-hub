const RawFeed = require("./raw-feed.js");

module.exports = class extends RawFeed {

    constructor(list) {
        super(list.map((url, index) => ({
            type: "image",
            url: url
        })));
    }

};