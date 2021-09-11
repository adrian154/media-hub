module.exports = class {

    constructor(list, count) {
        this.list = list;
        this.count = count || 5;
    }

    async get(after) {

        after = Number(after);

        let urls;
        if(after) {

            if(this.list.length - after <= 1) {
                return [];
            }

            urls = this.list.slice(after + 1, Math.min(this.list.length, after + 1 + this.count));
        } else {
            urls = this.list.slice(0, this.count);
        }

        return urls.map((url, index) => ({
            type: "image",
            url: url,
            id: after ? (after + index + 1) : index
        }));

    }

};