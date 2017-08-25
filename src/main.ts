import * as Models from './models/linode'

class LinodeApi {
    constructor() {
    }

    async All(): Promise<Models.Linode[]> {
        return [];
    }

    async Create(): Promise<Models.Linode> {
        return new Models.Linode();
    }

    async Delete(linode: Models.Linode): Promise<boolean> {
        return true;
    }
}

class SwarmManager {
    private _linodeApi: LinodeApi;
    private _master: Models.Linode;

    constructor(linodeApi: LinodeApi) {
        this._linodeApi = linodeApi;
    }

    async AddNode(): Promise<boolean> {
        if (!this._master) {
            // Create Master Linode
            this._master = await linodeApi.Create();
            this._master.ipv4[0]
        } else {
            // Create Node
        }

        return true;
    }
}

let linodeApi = new LinodeApi();

SetupLinodeSwarm(linodeApi).then(() => {
    console.log("Done!");
}).catch(err => {
    console.error(err);
});

async function SetupLinodeSwarm(linodeApi: LinodeApi) {
    let existingLinodes = await linodeApi.All();

    // Delete existing Linodes
    existingLinodes.forEach(async linode => {
        await linodeApi.Delete(linode);
    });

    let swarmManager = new SwarmManager(linodeApi)

    await swarmManager.AddNode();
}
