const CHUNK_SIZE = 100;

module.exports = class {

    constructor(list) {
        this.list = list.map((element, i) => {
            element.id = i;
            return element;
        });
    }

    async get(after) {

        after = Number(after);

        let elements;
        if(after) {
            elements = this.list.slice(after + 1, after + 1 + CHUNK_SIZE);
        } else {
            elements = this.list.slice(0, CHUNK_SIZE);
        }

        return elements;

    }

};