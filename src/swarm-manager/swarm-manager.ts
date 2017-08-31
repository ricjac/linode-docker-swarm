import { ISwarmHealth } from './models'
import * as Models from '../linode/models'
import { LinodeClient } from '../linode/linode-client';

function Range(start: number, count: number): number[] {
    return [...Array(count).keys()].map(i => i + start);
}

export class SwarmManager {
    private _linodeClient: LinodeClient;
    private _master: Models.Linode;
    private _nodes: Set<Models.Linode>;
    private _swarmToken: string;

    constructor(linodeClient: LinodeClient) {
        this._linodeClient = linodeClient;
        this._nodes = new Set<Models.Linode>();
    }

    async AddNodes(numOfNodes: number) {
        for (let value of Range(0, numOfNodes)) {
            await this.AddNode();
        }
    }

    async AddNode(): Promise<Models.Linode> {
        if (!this._master) {
            // Create Master Linode
            let master = await this._linodeClient.Create();
            await this.InitSwarm(master);
            this._master = master;
            return master;
        } else {
            // Create Node
            var node = await this._linodeClient.Create();
            await this.JoinSwarm(node);
            this._nodes.add(node);
            return node;
        }
    }

    private async InitSwarm(node: Models.Linode) {
        let ssh = this._linodeClient.GetSSHClient(node);
        let stdout = await ssh.Exec('docker swarm init');
        if (stdout.includes('Swarm initialized')) {
            let tokenRegex = /(?<=--token\s)(\w.+\w)/;
            let tokenMatch = tokenRegex.exec(stdout);
            if (tokenMatch) {
                this._swarmToken = tokenMatch[0]
                return;
            }

            throw new Error(`Could not get Swarm Token from '${stdout}'`);
        }

        throw new Error(`Swarm initialise failed: '${stdout}'`);
    }

    private async JoinSwarm(node: Models.Linode) {
        let ssh = this._linodeClient.GetSSHClient(node);
        let cmd = `docker swarm join --token ${this._swarmToken} ${this._master.ipv4[0]}:2377`;
        let stdout = await ssh.Exec(cmd);
        if (stdout.includes('This node joined a swarm as a worker')) {
            return;
        }

        throw new Error(`Swarm join failed: '${stdout}'`);
    }

    async Health(): Promise<ISwarmHealth> {
        if (!this._master) {
            throw new Error('A Swarm does not exist');
        }

        let ssh = this._linodeClient.GetSSHClient(this._master);
        let stdout = await ssh.Exec('docker node ls --format "{ Id:{{.ID}}, HostName: {{.Hostname}}, Status: {{.Status}} . Availability: {{.Availability}} },"');
        let nodeHealth: ISwarmHealth = JSON.parse(`{ Nodes: [${stdout}] }`);
        if (!nodeHealth || !nodeHealth.Nodes || (nodeHealth.Nodes.length == 0 && this._master)) {
            throw new Error(`Error retreiving Swarm health: '${stdout}'`);
        }

        return nodeHealth;
    }
}
