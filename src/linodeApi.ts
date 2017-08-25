import * as rpn from 'request-promise-native';
import * as Linode from './models/linode'
import * as fs from "fs";

interface RequestError { message: string; error: any; options: any; }

let TOKEN = GetToken('linode-token.txt');
Do()
    .then(() => console.log('Done!'))
    .catch(err => {
        let error: RequestError = err;
        console.log(error.message)
    });

async function Do() {
    let types = await Types();
    let distros = await Distributions();
    let regions = await Regions();
}

function GetToken(tokenFileName: string): string {
    let fileExists = fs.existsSync(tokenFileName);

    if (!fileExists) {
        throw `Token file '${tokenFileName}' does not exist`
    }

    let token = fs.readFileSync(tokenFileName);
    return token.toString()
}

async function Regions() {
    let result = await CallLinodeApi<Linode.RegionsResponse>('regions');
    return result.regions;
}

async function Distributions() {
    let result = await CallLinodeApi<Linode.DistributionsResponse>('linode/distributions');
    return result.distributions.filter(x => x.deprecated == false && x.x64 == true).map(x => x.id);
}

async function Types() {
    let result = await CallLinodeApi<Linode.TypesResponse>('linode/types');
    return result.types.filter(x => x.class == 'standard');
}

async function CallLinodeApi<T extends Linode.LinodeResponse>(resource: string): Promise<T> {
    let options = {
        uri: 'https://api.linode.com/v4/' + resource,
        qs: {},
        headers: {
            'Authorization': TOKEN
        },
        //resolveWithFullResponse: true,
        json: true,
    };

    let result: T = await rpn(options);
    return result;
}
