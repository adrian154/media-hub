module.exports = class {

    constructor(list) {
        this.list = list;
    }

    async get(after) {

        // this lesson was learned the hard way
        // thanks CoffeeHax17
        after = Number(after);

        let urls;
        if(after) {
            let remaining = this.list.length - (after + 1);
            console.log(after, remaining);
            if(remaining <= 0)
                urls = [];
            else
                urls = this.list.slice(after + 1, after + 1 + Math.min(remaining, 10));
        } else {
            urls = this.list.slice(0, 10);
        }

        return urls.map((url, index) => ({
            type: "image",
            url: url,
            id: after ? (after + index + 1) : index
        }));

    }

};