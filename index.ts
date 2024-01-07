/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import Config, { ConfigProvider } from '@kapeta/sdk-config';

const SERVICE_TYPE = 'rest';

export type RequestArgumentTransport = 'path' | 'header' | 'body' | 'query' | 'PATH' | 'HEADER' | 'BODY' | 'QUERY';
export type RequestMethod =
    | 'GET'
    | 'POST'
    | 'DELETE'
    | 'PATCH'
    | 'PUT'
    | 'OPTIONS'
    | 'HEAD'
    | 'TRACE'
    | 'CONNECT'
    | 'LINK'
    | 'UNLINK'
    | 'COPY'
    | 'PURGE'
    | 'LOCK'
    | 'UNLOCK'
    | 'PROPFIND'
    | 'VIEW';

export interface RequestArgument {
    name: string;
    value: any;
    transport: RequestArgumentTransport;
}

export interface RequestOptions {
    headers: { [key: string]: string };
    body?: any;
    method: RequestMethod;
    url: string;
}

export interface Result {
    response: Response;
    body: any;
}

export class RestClientError extends Error {
    public readonly response: Response;
    public readonly statusCode: number;

    constructor(error: string, response: Response) {
        super(error);
        this.response = response;
        this.statusCode = response.status;
    }
}

const JSONStringifyReplacer = function(this:any, key:string, value:any) {
    if (this[key] instanceof Date) {
        return this[key].getTime();
    }
    return value;
}

export class RestClientRequest<ReturnType = any> {
    private readonly _baseUrl: string;
    private readonly _path: string;
    private readonly _method: RequestMethod;
    private readonly _requestArguments: RequestArgument[];
    private readonly _headers: { [key: string]: string } = {};
    private timeout: number = RestClient.getDefaultTimeout();

    constructor(baseUrl: string, method: RequestMethod, path: string, requestArguments: RequestArgument[]) {
        while (path.startsWith('/')) {
            path = path.substring(1);
        }

        this._baseUrl = baseUrl;
        this._path = path;
        this._method = method;
        this._requestArguments = requestArguments;
    }

    public get url() {
        return this._baseUrl + this._path;
    }

    public get method() {
        return this._method;
    }

    public get arguments() {
        return [...this._requestArguments];
    }

    public get headers() {
        return {
            ...this._headers,
        };
    }

    public hasHeader(name: string) {
        return this._headers[name.toLowerCase()] !== undefined;
    }

    public withHeader(name: string, value: string|undefined) {
        if (!value) {
            delete this._headers[name.toLowerCase()];
            return this;
        }
        this._headers[name.toLowerCase()] = value;
        return this;
    }

    public withAuthorization(auth: string|undefined) {
        return this.withHeader('Authorization', auth);
    }
    public withBearerToken(token: string|undefined) {
        return this.withAuthorization(`Bearer ${token}`);
    }

    public withContentType(contentType: string|undefined) {
        return this.withHeader('Content-Type', contentType);
    }

    public withTimeout(timeout: number) {
        this.timeout = timeout;
        return this;
    }

    public async call():Promise<ReturnType|null> {
        const opts = this.createOptions();
        const abortController = new AbortController();
        const response: Response = await fetch(opts.url, {
            method: opts.method,
            headers: opts.headers,
            body: opts.body,
            signal: abortController.signal,
        });

        let abortTimeout:NodeJS.Timeout|undefined = undefined;
        if (this.timeout > 0) {
            abortTimeout = setTimeout(() => {
                abortController.abort();
            }, this.timeout);
        }

        let body: any;
        try {
            body = await response.text();
        } finally {
            if (abortTimeout) {
                clearTimeout(abortTimeout);
            }
        }

        if (
            typeof body === 'string' &&
            response.headers.has('content-type') &&
            response.headers.get('content-type')?.startsWith('application/json')
        ) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                // Ignore
                console.warn('Failed to parse JSON response', e);
            }
        }

        if (response.status > 399 && response.status !== 404) {
            throw new RestClientError(body.error || 'Unknown error', response);
        }

        if (response.status === 404) {
            return null;
        }

        return body as ReturnType;
    }

    protected createOptions() {
        const query: string[] = [];
        const opts: RequestOptions = {
            method: this.method,
            url: this.url,
            headers: {...this._headers},
        };

        this._requestArguments.forEach((requestArgument) => {
            const transport = requestArgument.transport?.toLowerCase() as Lowercase<RequestArgumentTransport>;
            const valueIsEmpty = requestArgument.value === undefined || requestArgument.value === null;
            switch (transport) {
                case 'path':
                    if (valueIsEmpty) {
                        throw new Error(`Path argument ${requestArgument.name} must not be empty`);
                    }
                    opts.url = opts.url.replace('{' + requestArgument.name + '}', requestArgument.value);
                    break;
                case 'header':
                    if (!valueIsEmpty) {
                        opts.headers[requestArgument.name] = requestArgument.value;
                    }
                    break;
                case 'body':
                    if (!opts.headers['content-type']) {
                        opts.headers['content-type'] = 'application/json';
                    }
                    opts.body = JSON.stringify(requestArgument.value === undefined ? null : requestArgument.value, JSONStringifyReplacer);
                    break;
                case 'query':
                    if (!valueIsEmpty) {
                        query.push(
                            encodeURIComponent(requestArgument.name) + '=' + encodeURIComponent(requestArgument.value)
                        );
                    }
                    break;
                default:
                    transport satisfies never;
                    throw new Error('Unknown argument transport: ' + requestArgument.transport);
            }
        });

        if (query.length > 0) {
            opts.url += '?' + query.join('&');
        }
        return opts;
    }

}

export class RestClient {
    private static defaultTimeout: number = 30000;
    private static defaultHeaders: { [key: string]: string } = {};

    public static setDefaultTimeout(timeout: number) {
        this.defaultTimeout = timeout;
    }

    public static getDefaultTimeout() {
        return this.defaultTimeout;
    }

    public static setDefaultHeader(name: string, value: string|undefined) {
        if (!value) {
            delete this.defaultHeaders[name.toLowerCase()];
            return;
        }
        this.defaultHeaders[name.toLowerCase()] = value;
    }

    private readonly resourceName: string;
    private ready: boolean = false;
    private baseUrl: string;
    private fixedHeaders: { [key: string]: string } = {};
    private timeout: number = RestClient.defaultTimeout;

    /**
     * Initialise rest client for service.
     *
     * @param resourceName Name of the service to connect to.
     * @param autoInit If true, the client will automatically initialise itself when the config provider is ready.
     */
    public constructor(resourceName: string, autoInit:boolean = true) {
        this.resourceName = resourceName;
        this.baseUrl = `http://${resourceName.toLowerCase()}`;

        if (autoInit) {
            Config.onReady(async (provider) => {
                await this.$init(provider);
            });
        }
    }

    public async $withConfigProvider(config:ConfigProvider) {
        await this.$init(config);
        return this;
    }

    public $withTimeout(timeout: number) {
        this.timeout = timeout;
        return this;
    }

    /**
     * Called automatically during startup sequence.
     */
    private async $init(provider: ConfigProvider) {
        if (this.ready) {
            throw new Error('Client already initialised');
        }
        const service = await provider.getServiceAddress(this.resourceName, SERVICE_TYPE);
        if (!service) {
            throw new Error(`Service ${this.resourceName} not found`);
        }
        this.baseUrl = service;
        this.ready = true;

        if (!this.baseUrl.endsWith('/')) {
            this.baseUrl += '/';
        }

        console.log('REST client ready for %s --> %s', this.resourceName, this.baseUrl);
    }

    public get $baseUrl() {
        return this.baseUrl;
    }

    public $withHeader(name: string, value: string|undefined) {
        if (!value) {
            delete this.fixedHeaders[name.toLowerCase()];
            return this;
        }
        this.fixedHeaders[name.toLowerCase()] = value;
        return this;
    }

    public $withContentType(contentType: string|undefined) {
        return this.$withHeader('Content-Type', contentType);
    }

    public $withAuthorization(auth: string|undefined) {
        return this.$withHeader('Authorization', auth);
    }
    public $withBearerToken(token: string|undefined) {
        return this.$withAuthorization(`Bearer ${token}`);
    }

    public $create<ReturnType = any>(method: RequestMethod, path: string, requestArguments: RequestArgument[]):RestClientRequest<ReturnType> {
        if (!this.ready) {
            throw new Error('Client not ready yet');
        }

        const request = new RestClientRequest<ReturnType>(this.baseUrl, method, path, requestArguments);
        request.withTimeout(this.timeout);

        Object.entries(RestClient.defaultHeaders).forEach(([key, value]) => {
            request.withHeader(key, value);
        });

        Object.entries(this.fixedHeaders).forEach(([key, value]) => {
            request.withHeader(key, value);
        });

        this.$afterCreate(request);

        return request;
    }

    protected $afterCreate(request: RestClientRequest):void {
        // Override this method to add additional headers or similar to all requests
    }

    /**
     * Executes a request to the specified path using the specified method.
     */
    public $execute<ReturnType = any>(method: RequestMethod, path: string, requestArguments: RequestArgument[]) {
        const request = this.$create<ReturnType>(method, path, requestArguments);

        return request.call()
    }
}
