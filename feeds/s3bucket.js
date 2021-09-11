module.exports = class {

    constructor(s3, bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    async get(after) {
        return (await this.s3.listObjects(this.bucket, after)).Contents.map(entry => ({
            type: "image",
            url: `https://${this.bucket}.${this.s3.config.endpoint}/${entry.Key}`,
            id: entry.Key
        }));
    }

};