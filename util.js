const https = require("https");

// Promisified HTTPS requester
const makeRequest = async function(options) {

    return new Promise((resolve, reject) => {
        
        const request = https.request(options, (res) => {
            let body = "";
            res.on("data", (data) => body = body + data);
            res.on("end", () => resolve(body));
            res.on("error", (error) => reject(error));
        });
        
        request.end();

    });

};

module.exports = {
    makeRequest: makeRequest
};