import Config, { ConfigProvider } from '@kapeta/sdk-config';
import Request from 'request';

const SERVICE_TYPE = 'rest';

export interface RequestArgument {
    name: string;
    value: string;
    transport: string;
}

interface RequestOptions {
    headers: { [key: string]: string };
    body?: any;
    method: string;
    url: string;
}

export class RestClient {
    private readonly _resourceName: string;
    private _ready: boolean = false;
    private _baseUrl: string;

    /**
     * Initialise rest client for service.
     *
     * @param {string} resourceName
     */
    constructor(resourceName: string) {
        this._resourceName = resourceName;
        this._baseUrl = `http://${resourceName.toLowerCase()}`;

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
    async init(provider: ConfigProvider) {
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
    execute(method: string, path: string, requestArguments: RequestArgument[]) {
        if (!this._ready) {
            throw new Error('Client not ready yet');
        }

        while (path.startsWith('/')) {
            path = path.substr(1);
        }

        const url = this._baseUrl + path;

        const query: string[] = [];
        const opts: RequestOptions = {
            method,
            url,
            headers: {},
        };

        requestArguments.forEach((requestArgument) => {
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
                    query.push(
                        encodeURIComponent(requestArgument.name) + '=' + encodeURIComponent(requestArgument.value)
                    );
                    break;
            }
        });

        if (query.length > 0) {
            opts.url += '?' + query.join('&');
        }

        return new Promise((resolve, reject) => {
            Request(opts, function (err, response, body) {
                if (err) {
                    reject(err);
                    return;
                }

                if (response.statusCode > 399 && response.statusCode !== 404) {
                    reject({
                        response,
                        body,
                    });
                    return;
                }

                resolve({
                    response,
                    body,
                });
            });
        });
    }
}
