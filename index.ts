import Config, { ConfigProvider } from '@kapeta/sdk-config';
import Request, {Response} from 'request';

const SERVICE_TYPE = 'rest';

export interface RequestArgument {
    name: string;
    value: any;
    transport: string;
}

export interface RequestOptions {
    headers: { [key: string]: string };
    body?: any;
    method: string;
    url: string;
}

export interface Result {
    response: Request.Response;
    body: any;
}


export class RestError extends Error {
    public readonly response: Response;
    public readonly statusCode: number;

    constructor(error:string, response: Response) {
        super(error);
        this.response = response;
        this.statusCode = response.statusCode;

    }

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
     * Send request to service.
     */
    execute(method: string, path: string, requestArguments: RequestArgument[]):Promise<any> {
        if (!this._ready) {
            throw new Error('Client not ready yet');
        }

        while (path.startsWith('/')) {
            path = path.substring(1);
        }

        const url = this._baseUrl + path;

        const query: string[] = [];
        const opts: RequestOptions = {
            method,
            url,
            headers: {},
        };

        requestArguments.forEach((requestArgument) => {
            switch (requestArgument.transport?.toLowerCase()) {
                case 'path':
                    opts.url = opts.url.replace('{' + requestArgument.name + '}', requestArgument.value);
                    break;
                case 'header':
                    opts.headers[requestArgument.name] = requestArgument.value;
                    break;
                case 'body':
                    if (!opts.headers['content-type']) {
                        opts.headers['content-type'] = 'application/json';
                    }
                    opts.body = JSON.stringify(requestArgument.value);
                    break;
                case 'query':
                    query.push(
                        encodeURIComponent(requestArgument.name) + '=' + encodeURIComponent(requestArgument.value)
                    );
                    break;
                default:
                    throw new Error('Unknown argument transport: ' + requestArgument.transport);
            }
        });

        if (query.length > 0) {
            opts.url += '?' + query.join('&');
        }

        return new Promise<any>((resolve, reject) => {
            Request(opts, function (err:Error, response:Response, body:any) {
                if (err) {
                    reject(err);
                    return;
                }

                if (typeof body === 'string' &&
                    response.headers['content-type'] &&
                    response.headers['content-type']?.startsWith('application/json')) {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        // Ignore
                    }
                }

                if (response.statusCode > 399 && response.statusCode !== 404) {
                    reject(new RestError(body.error || 'Unknown error', response));
                    return;
                }

                if (response.statusCode === 404) {
                    resolve(null);
                    return;
                }

                resolve(body);
            });
        });
    }
}
