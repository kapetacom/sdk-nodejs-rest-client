const Config = require('@kapeta/sdk-config');
const Request = require('request');

const SERVICE_TYPE = "rest";

class RestClient {

    /**
     * Initialise rest client for service.
     *
     * @param {string} resourceName
     */
    constructor(resourceName) {
        this._resourceName = resourceName;
        this._ready = false;
        this._baseUrl = "http://" + resourceName.toLowerCase();

        Config.onReady(async (provider) => {
            await this.init(provider);
        });
    }

    /**
     * Called automatically during startup sequence.
     *
     * @param {ConfigProvider} provider
     * @return {Promise<void>}
     */
    async init(provider) {
        this._baseUrl = await provider.getServiceAddress(this._resourceName, SERVICE_TYPE);
        this._ready = true;

        if (!this._baseUrl.endsWith('/')) {
            this._baseUrl += '/';
        }

        console.log('REST client ready for %s --> %s', this._resourceName, this._baseUrl);
    }

    /**
     *
     * @param {string} method
     * @param {string} path
     * @param {RequestArgument[]} requestArguments
     * @return {Promise<Object>}
     */
    execute(method, path, requestArguments) {
        if (!this._ready) {
            throw new Error('Client not ready yet');
        }

        while (path.startsWith('/')) {
            path = path.substr(1)
        }

        let url = this._baseUrl + path;

        const query = [];
        const opts = {
            method,
            url,
            headers: {}
        };

        requestArguments.forEach(requestArgument => {
            switch (requestArgument.transport) {
                case 'path':
                    opts.url = opts.url.replace('{' + requestArgument.name + '}', requestArgument.value);
                    break;
                case 'header':
                    opts.headers[requestArgument.name] = requestArgument.value;
                    break;
                case 'body':
                    opts.body = requestArgument.value;
                    break;
                case 'query':
                    query.push(encodeURIComponent(requestArgument.name) + '=' + encodeURIComponent(requestArgument.value));
                    break;
            }
        });

        if (query.length > 0) {
            opts.url += '?' + query.join('&');
        }

        return new Promise((resolve, reject) => {
            Request(opts, function(err, response, body) {
                if (err) {
                    reject(err);
                    return;
                }

                if (response.statusCode > 399 &&
                    response.statusCode !== 404) {
                    reject({
                        response,
                        body
                    });
                    return;
                }

                resolve({
                    response,
                    body
                });
            });
        });
    }
}


module.exports = RestClient;