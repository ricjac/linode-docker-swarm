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

    async Create(linode: Models.Linode) {
        await this.CallLinodeApi<null>('linode/instances', RestMethod.POST, linode);
    }

    async Delete(linode: Models.Linode) {
        await this.CallLinodeApi<null>(`linode/instances/${linode.id}`, RestMethod.DELETE);
    }

    public async GetStackScripts() {
        let result = await this.CallLinodeApi<Models.StackScriptsResponse>('linode/stackscripts');
        return result;
    }

    public async PostStackScript(stackScript: Models.StackScript) {
        await this.CallLinodeApi<null>('linode/stackscripts', RestMethod.POST, stackScript);
    }

    public async PutStackScript(stackScript: Models.StackScript) {
        await this.CallLinodeApi<null>('linode/stackscripts', RestMethod.PUT, stackScript);
    }

    public async UpsertStackScript(label: string, scriptContent: string, distributionIds: string[]) {
        let scripts = await this.GetStackScripts();
        let scriptExists = scripts.stackscripts && scripts.stackscripts.filter(s => s.label == label).length > 0;

        let result: any;
        if (scriptExists) {
            let script = scripts.stackscripts.filter(s => s.label == label)[0];
            script.script = scriptContent;
            script.distributions = distributionIds;

            result = await this.PutStackScript(script);
        } else {
            let stackScript = new Models.StackScript();
            stackScript.label = label;
            stackScript.script = scriptContent;
            stackScript.distributions = distributionIds;

            result = await this.PostStackScript(stackScript);
        }

        return result;
    }

    public async Regions() {
        let result = await this.CallLinodeApi<Models.RegionsResponse>('regions');
        return result.regions;
    }

    private _distros: Models.Distribution[];
    public async Distributions() {
        let result = await this.CallLinodeApi<Models.DistributionsResponse>('linode/distributions');
        if (!this._distros) {
            this._distros = result.distributions.filter(x => x.deprecated == false && x.x64 == true);
        }

        return this._distros;
    }

    public async Types() {
        let result = await this.CallLinodeApi<Models.TypesResponse>('linode/types');
        return result.types.filter(x => x.class == 'standard');
    }

    private async CallLinodeApi<T extends Models.LinodeResponse | null>(resource: string, method: RestMethod = RestMethod.GET, body: any = null): Promise<T> {
        let options: (request.UriOptions & rpn.RequestPromiseOptions) | (request.UrlOptions & rpn.RequestPromiseOptions) = {
            method: RestMethod[method],
            uri: 'https://api.linode.com/v4/' + resource,
            qs: {},
            headers: {
                'Authorization': 'Bearer ' + this._token.Value
            },
            //resolveWithFullResponse: true,
            json: true,
            //body: JSON.stringify(body)
        };

        let result: T = await rpn(options);
        return result;
    }
}

enum RestMethod {
    GET,
    POST,
    DELETE,
    PUT
}
