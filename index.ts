/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import Config, { ConfigProvider } from '@kapeta/sdk-config';
import Request, { Response } from 'request';

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
    response: Request.Response;
    body: any;
}

export class RestClientError extends Error {
    public readonly response: Response;
    public readonly statusCode: number;

    constructor(error: string, response: Response) {
        super(error);
        this.response = response;
        this.statusCode = response.statusCode;
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
        return this._headers[name] !== undefined;
    }

    public withHeader(name: string, value: string|undefined) {
        if (!value) {
            delete this._headers[name];
            return this;
        }
        this._headers[name] = value;
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

    public call():Promise<ReturnType|null> {
        const opts = this.createOptions();
        return new Promise<ReturnType | null>((resolve, reject) => {
            Request(opts, function (err: Error, response: Response, body: any) {
                if (err) {
                    reject(err);
                    return;
                }

                if (
                    typeof body === 'string' &&
                    response.headers['content-type'] &&
                    response.headers['content-type']?.startsWith('application/json')
                ) {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        // Ignore
                    }
                }

                if (response.statusCode > 399 && response.statusCode !== 404) {
                    reject(new RestClientError(body.error || 'Unknown error', response));
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

    protected createOptions() {
        const query: string[] = [];
        const opts: RequestOptions = {
            method: this.method,
            url: this.url,
            headers: {...this._headers},
        };

        this._requestArguments.forEach((requestArgument) => {
            const transport = requestArgument.transport?.toLowerCase() as Lowercase<RequestArgumentTransport>;
            switch (transport) {
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
                    opts.body = JSON.stringify(requestArgument.value, JSONStringifyReplacer);
                    break;
                case 'query':
                    query.push(
                        encodeURIComponent(requestArgument.name) + '=' + encodeURIComponent(requestArgument.value)
                    );
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
    private readonly _resourceName: string;
    private _ready: boolean = false;
    private _baseUrl: string;
    private _fixedHeaders: { [key: string]: string } = {};

    /**
     * Initialise rest client for service.
     */
    public constructor(resourceName: string) {
        this._resourceName = resourceName;
        this._baseUrl = `http://${resourceName.toLowerCase()}`;

        Config.onReady(async (provider) => {
            await this.init(provider);
        });
    }


    /**
     * Called automatically during startup sequence.
     */
    private async init(provider: ConfigProvider) {
        const service = await provider.getServiceAddress(this._resourceName, SERVICE_TYPE);
        if (!service) {
            throw new Error(`Service ${this._resourceName} not found`);
        }
        this._baseUrl = service;
        this._ready = true;

        if (!this._baseUrl.endsWith('/')) {
            this._baseUrl += '/';
        }

        console.log('REST client ready for %s --> %s', this._resourceName, this._baseUrl);
    }

    public get baseUrl() {
        return this._baseUrl;
    }

    public withHeader(name: string, value: string|undefined) {
        if (!value) {
            delete this._fixedHeaders[name];
            return this;
        }
        this._fixedHeaders[name] = value;
        return this;
    }

    public withContentType(contentType: string|undefined) {
        return this.withHeader('Content-Type', contentType);
    }

    public withAuthorization(auth: string|undefined) {
        return this.withHeader('Authorization', auth);
    }
    public withBearerToken(token: string|undefined) {
        return this.withAuthorization(`Bearer ${token}`);
    }

    public create<ReturnType = any>(method: RequestMethod, path: string, requestArguments: RequestArgument[]):RestClientRequest<ReturnType> {
        if (!this._ready) {
            throw new Error('Client not ready yet');
        }

        const request = new RestClientRequest<ReturnType>(this._baseUrl, method, path, requestArguments);

        Object.keys(this._fixedHeaders).forEach((key) => {
            request.withHeader(key, this._fixedHeaders[key]);
        });

        this.afterCreate(request);

        return request;
    }

    protected afterCreate(request: RestClientRequest):void {
        // Override this method to add additional headers or similar to all requests
    }

    /**
     * Executes a request to the specified path using the specified method.
     */
    public execute<ReturnType = any>(method: RequestMethod, path: string, requestArguments: RequestArgument[]) {
        const request = this.create<ReturnType>(method, path, requestArguments);

        return request.call()
    }
}
