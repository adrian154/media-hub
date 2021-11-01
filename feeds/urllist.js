const CHUNK_SIZE = 5;

module.exports = class {

    constructor(list) {
        this.list = list;
    }

    get name() {
        return `URL x ${this.list.length}`;
    }

    async get(after) {

        after = Number(after);

        let urls;
        if(after) {

            if(this.list.length - after <= 1) {
                return [];
            }

            urls = this.list.slice(after + 1, Math.min(this.list.length, after + 1 + CHUNK_SIZE));
        } else {
            urls = this.list.slice(0, CHUNK_SIZE);
        }

        return urls.map((url, index) => ({
            type: "image",
            url: url,
            id: after ? (after + index + 1) : index
        }));

    }

};