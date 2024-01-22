/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import Config, { ConfigProvider } from '@kapeta/sdk-config';
import { BaseRestClient } from '@kapeta/sdk-rest';

const SERVICE_TYPE = 'rest';

export class RestClient extends BaseRestClient {

    private readonly resourceName: string;
    private ready: boolean = false;

    /**
     * Initialise rest client for service.
     *
     * @param resourceName Name of the service to connect to.
     * @param autoInit If true, the client will automatically initialise itself when the config provider is ready.
     */

    public constructor(resourceName: string, autoInit:boolean = true) {
        super(fetch, `http://${resourceName.toLowerCase()}`);
        this.resourceName = resourceName;

        if (autoInit) {
            Config.onReady(async (provider) => {
                await this.$init(provider);
            });
        }
    }

    public async $withConfigProvider(config: ConfigProvider) {
        await this.$init(config);
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
        this.$baseUrl = service;
        this.ready = true;

        if (!this.$baseUrl.endsWith('/')) {
            this.$baseUrl += '/';
        }

        console.log('REST client ready for %s --> %s', this.resourceName, this.$baseUrl);
    }

}
