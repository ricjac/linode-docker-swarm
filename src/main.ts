import { LinodeClient } from './linode/linode-client';
import { LinodeTokenSetting } from './linode/linode-token-setting';
import { SwarmManager, SwarmManagerConfig } from './swarm-manager/swarm-manager';
import { StackScriptInit } from './swarm-manager/stack-script-init'

let defaultDistroId = 'linode/ubuntu16.04lts';
let defaultRegion = 'us-south-1a'; // Dallas, Texas
let defaultType = 'g5-standard-1'; // $10 USD @ Month

let token = new LinodeTokenSetting("./linode-token.txt")
let initScript = new StackScriptInit('./linode-stack-script.sh')

let linodeClient = new LinodeClient(token);

SetupLinodeSwarm().then(() => {
    console.log("Done!");
}).catch(err => {
    console.error(err);
});

async function SetupLinodeSwarm() {
    await DeleteAllLinodes(linodeClient);

    let swarmManagerConfig: SwarmManagerConfig = {
        linodeClient: linodeClient,
        initScript: initScript,
        defaultDistroId: defaultDistroId,
        defaultType: defaultType,
        defaultRegion: defaultRegion
    }
    let swarmManager = new SwarmManager(swarmManagerConfig)
    await swarmManager.AddNodes(2);

    var health = await swarmManager.Health();
    console.log(health);
}

async function DeleteAllLinodes(linodeClient: LinodeClient) {
    let existingLinodes = await linodeClient.All();

    console.log(`Found ${existingLinodes.length} existing Linodes`);
    // Delete existing Linodes
    for (var linode of existingLinodes) {
        await linodeClient.Delete(linode);
        console.log(`Deleted Linode ${linode.id}`);
    }
}