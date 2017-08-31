import { LinodeClient } from './linode/linode-client';
import { LinodeTokenSetting } from './linode/linode-token-setting';
import { SwarmManager } from './swarm-manager/swarm-manager';

let token = new LinodeTokenSetting("./linode-token.txt")
let linodeApi = new LinodeClient(token);

SetupLinodeSwarm(linodeApi).then(() => {
    console.log("Done!");
}).catch(err => {
    console.error(err);
});

async function SetupLinodeSwarm(linodeClient: LinodeClient) {
    let existingLinodes = await linodeClient.All();

    // Delete existing Linodes
    existingLinodes.forEach(async linode => {
        await linodeClient.Delete(linode);
    });

    let swarmManager = new SwarmManager(linodeClient)

    await swarmManager.AddNodes(2);

    var health = await swarmManager.Health();
    console.log(health);
}
