import { ISwarmHealth } from './models'
import { StackScriptInit } from './stack-script-init'
import * as LinodeModels from '../linode/models'
import { LinodeClient } from '../linode/linode-client';
import { SSHClient } from '../ssh/ssh-client';

function Range(start: number, count: number): number[] {
    return [...Array(count).keys()].map(i => i + start);
}

export interface SwarmManagerConfig {
    linodeClient: LinodeClient,
    initScript: StackScriptInit,
    defaultDistroId: string,
    defaultType: string,
    defaultRegion: string
}

export class SwarmManager {
    private _config: SwarmManagerConfig;

    private _master: LinodeModels.Linode;
    private _nodes: Set<LinodeModels.Linode>;
    private _swarmToken: string;
    private _initStackScriptUpdated: boolean = false;

    constructor(config: SwarmManagerConfig
    ) {
        this._config = config;
        this._nodes = new Set<LinodeModels.Linode>();
    }

    async AddNodes(numOfNodes: number) {
        if (!this._initStackScriptUpdated) {
            let result = await this._config.linodeClient.UpsertStackScript('init', this._config.initScript.Value, [this._config.defaultDistroId])
            this._initStackScriptUpdated = true;
        }

        for (let value of Range(0, numOfNodes)) {
            await this.AddNode();
        }
    }

    private async AddNode(): Promise<LinodeModels.Linode> {
        if (!this._master) {
            // Create Master Linode
            let linode = new LinodeModels.Linode();
            linode.region = '';
            linode.type = '';
            linode.distribution = this._config.defaultDistroId;


            let master = await this._config.linodeClient.Create();
            await this.InitSwarm(master);
            this._master = master;
            return master;
        } else {
            // Create Node
            var node = await this._config.linodeClient.Create();
            await this.JoinSwarm(node);
            this._nodes.add(node);
            return node;
        }
    }

    private async InitSwarm(node: LinodeModels.Linode) {
        let ssh = new SSHClient(node.ipv4[0]);
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

    private async JoinSwarm(node: LinodeModels.Linode) {
        let ssh = new SSHClient(node.ipv4[0]);
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

        let ssh = new SSHClient(this._master.ipv4[0]);
        let stdout = await ssh.Exec('docker node ls --format "{ Id:{{.ID}}, HostName: {{.Hostname}}, Status: {{.Status}} . Availability: {{.Availability}} },"');
        let nodeHealth: ISwarmHealth = JSON.parse(`{ Nodes: [${stdout}] }`);
        if (!nodeHealth || !nodeHealth.Nodes || (nodeHealth.Nodes.length == 0 && this._master)) {
            throw new Error(`Error retreiving Swarm health: '${stdout}'`);
        }

        return nodeHealth;
    }
}
