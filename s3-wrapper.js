// amazon's node SDK sucks an immense amount
// encapsulation sweeps all the tears under the rug

const AWS = require("aws-sdk");

module.exports = class {

    constructor(config) {
        this.config = config;
        this.s3 = new AWS.S3({
            endpoint: new AWS.Endpoint(config.endpoint),
            accessKeyId: config.key,
            secretAccessKey: config.secret   
        });
    }

    async listObjects(bucket, after) {
        return new Promise((resolve, reject) => {
            this.s3.listObjectsV2({
                Bucket: "bithole-images",
                StartAfter: after,
                MaxKeys: 50
            }, (err, data) => {
                if(err) reject(err);
                resolve(data);
            });
        });
    }

};