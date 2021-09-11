module.exports = class {

    constructor(s3, bucket) {
        this.bucket = bucket;
    }

    async get(after) {
        return this.s3.listObjects(this.bucket, after).Contents.map(entry => ({
            type: "image",
            url: `https://${this.bucket}.${this.s3.config.endpoint}/${entry.key}`
        }));
    }

};