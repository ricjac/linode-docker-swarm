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

    public async All() {
        let result = await this.CallLinodeApi<Models.InstancesResponse>({ resource: 'linode/instances', method: RestMethod.GET });
        return result.data;
    }

    public async Create(linode: Models.ICreateLinodeRequest) {
        let result = await this.CallLinodeApi<Models.Linode>({ resource: 'linode/instances', method: RestMethod.POST, body: linode });
        return result;
    }

    public async Delete(linode: Models.Linode) {
        await this.CallLinodeApi<null>({ resource: `linode/instances/${linode.id}`, method: RestMethod.DELETE });
    }

    public async GetStackScripts() {
        let response = await this.CallLinodeApi<Models.StackScriptsResponse>({ resource: 'linode/stackscripts', method: RestMethod.GET, filter: { mine: true } });
        return response;
    }

    public async PostStackScript(stackScript: Models.StackScript): Promise<Models.StackScript> {
        let response = await this.CallLinodeApi<Models.StackScript>({ resource: 'linode/stackscripts', method: RestMethod.POST, body: stackScript });
        return response;
    }

    public async PutStackScript(stackScript: Models.StackScript): Promise<Models.StackScript> {
        let response = await this.CallLinodeApi<Models.StackScript>({
            resource: `linode/stackscripts/${stackScript.id}`, method: RestMethod.PUT, body: {
                label: stackScript.label,
                script: stackScript.script,
            }
        });

        return response;
    }

    public async UpsertStackScript(label: string, scriptContent: string, distributionIds: string[]): Promise<Models.StackScript> {
        let scripts = await this.GetStackScripts();
        let scriptExists = scripts.results > 0 && scripts.data && scripts.data.filter(s => s.label == label).length > 0;

        console.log(`The init script exists: ${scriptExists}`)

        let result: Models.StackScript;
        if (scriptExists) {
            let script = scripts.data.filter(s => s.label == label)[0];
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
        let result = await this.CallLinodeApi<Models.RegionsResponse>({ resource: 'regions', method: RestMethod.GET });
        return result.data;
    }

    private _distros: Models.Distribution[];
    public async Distributions() {
        let result = await this.CallLinodeApi<Models.DistributionsResponse>({ resource: 'linode/distributions', method: RestMethod.GET });
        if (!this._distros) {
            this._distros = result.data.filter(x => x.deprecated == false && x.x64 == true);
        }

        return this._distros;
    }

    public async Types() {
        let result = await this.CallLinodeApi<Models.TypesResponse>({ resource: 'linode/types', method: RestMethod.GET });
        return result.data.filter(x => x.class == 'standard');
    }

    private async CallLinodeApi<T>(
        options: {
            resource?: string,
            method: RestMethod,
            body?: any,
            filter?: any,
        }
    ): Promise<T> {
        let requestOptions: (request.UriOptions & rpn.RequestPromiseOptions) | (request.UrlOptions & rpn.RequestPromiseOptions) = {
            method: RestMethod[options.method],
            uri: 'https://api.linode.com/v4/' + options.resource,
            qs: {},
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this._token.Value
            },
            json: true,
            //resolveWithFullResponse: true,
        };

        if (options.filter && requestOptions.headers) {
            requestOptions.headers['X-Filter'] = JSON.stringify(options.filter);
        }

        if (options.body) {
            requestOptions.body = options.body
        }

        //console.log(`requestOptions: ${JSON.stringify(requestOptions)}`)

        let result: T = await rpn(requestOptions);
        //console.log(`Response: ${JSON.stringify(result)}`)
        return result;
    }
}

enum RestMethod {
    GET,
    POST,
    DELETE,
    PUT
}
