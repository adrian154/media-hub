const config = require("../config.json").s3;
const AWS = require("aws-sdk");

const s3 =  new AWS.S3({
    endpoint: new AWS.Endpoint(config.endpoint),
    accessKeyId: config.key,
    secretAccessKey: config.secret   
});

const listObjects = (bucket, after) => {
    return new Promise((resolve, reject) => {
        s3.listObjectsV2({
            Bucket: bucket,
            StartAfter: after,
            /*MaxKeys: 50*/
        }, (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
};

module.exports = class {

    constructor(bucket) {
        this.bucket = bucket;
    }

    async get(after) {
        return (await listObjects(this.bucket, after)).Contents.map(entry => ({
            type: "image",
            url: `https://${this.bucket}.${config.endpoint}/${entry.Key}`,
            id: entry.Key
        }));
    }

};