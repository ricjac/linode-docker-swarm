import * as rpn from 'request-promise-native';
import * as request from 'request';

import * as Models from './models'
import { LinodeTokenSetting } from './linode-token-setting';
import { SSHClient } from '../ssh/ssh-client';

export class LinodeClient {
    private _token: LinodeTokenSetting;

    constructor(token: LinodeTokenSetting) {
        this._token = token;
    }

    async All() {
        let result = await this.CallLinodeApi<Models.InstancesResponse>('linode/instances');
        return result.linodes;
    }

    async Create() {
        return new Models.Linode();
    }

    async Delete(linode: Models.Linode) {
        return true;
    }

    GetSSHClient(linode: Models.Linode): SSHClient {
        return new SSHClient();
    }

    private async Regions() {
        let result = await this.CallLinodeApi<Models.RegionsResponse>('regions');
        return result.regions;
    }

    private async Distributions() {
        let result = await this.CallLinodeApi<Models.DistributionsResponse>('linode/distributions');
        return result.distributions.filter(x => x.deprecated == false && x.x64 == true).map(x => x.id);
    }

    private async Types() {
        let result = await this.CallLinodeApi<Models.TypesResponse>('linode/types');
        return result.types.filter(x => x.class == 'standard');
    }

    private async CallLinodeApi<T extends Models.LinodeResponse>(resource: string): Promise<T> {
        let options: (request.UriOptions & rpn.RequestPromiseOptions) | (request.UrlOptions & rpn.RequestPromiseOptions) = {
            uri: 'https://api.linode.com/v4/' + resource,
            qs: {},
            headers: {
                'Authorization': 'Bearer ' + this._token.Value
            },
            //resolveWithFullResponse: true,
            json: true,
        };

        let result: T = await rpn(options);
        return result;
    }
}