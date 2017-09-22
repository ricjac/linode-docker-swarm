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
    private _initStackScriptId?: number;

    constructor(config: SwarmManagerConfig) {
        this._config = config;
        this._nodes = new Set<LinodeModels.Linode>();
    }

    async AddNodes(numOfNodes: number) {
        if (!this._initStackScriptId) {
            let result = await this._config.linodeClient.UpsertStackScript('init', this._config.initScript.Value, [this._config.defaultDistroId])
            this._initStackScriptId = Number(result.id);
        }

        for (let value of Range(0, numOfNodes)) {
            await this.AddNode();
        }
    }

    private async AddNode(): Promise<LinodeModels.Linode> {
        let linode: LinodeModels.ICreateLinodeRequest = {
            region: this._config.defaultRegion,
            type: this._config.defaultType,
            label: '',
            group: 'Stack1',
            distribution: this._config.defaultDistroId,
            root_pass: '3456 rocky ue hash chaste grad',
            root_ssh_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDFMAlNRWAVUMIls3Damv6/uMPfdmRyDJaWh0X/C+jh+mGbRHk5W6S4Fr3z+hiZ4F4PQCSQ0+YZ5pK0UfwU8H21MTcvmggiiR4knvuxS1fvgWe08aiXhPxuySGwTsS8Bq8e8z6HBCmTQjg7SWyThWz3ZqLrfImt9EoeC7lKTugE2Q9Y+w7InXVwkyxPUOinP065Gdr23IcrDXDm2mA2X2h2Hzoqvfk2mOya6wcbTZVCXiM/CznXFh12BMaH/yYaErgQ2Nw27RF1UEidA0cU8VVaSR6O+39AjIZDzZZYlPpfRK29t+IH2CGkPOYFsoyCQtsZXCpxKvGlJ5f9Y7BmyLLufYK3JeQP4UV4VEmybx2RUp3NN59slMuhrZh2qkbY0oLciQeqXYa12QA6wLrKxBkseAeWhj1PV6qZ37hdXpPTB9qsQ9dGKSzuShfmobBzo5+GcOGopkRq/ZWElX5t1nluZMH5PdzsGDpV9lRg/EAqwIgCkSUUfp8T2n98pvgDXXRSl/O5SBnp5qM928R6KnChGJaUu6w6Oq/rcwvmvHpqjfv3efpLXr2rALa2CknZQsrHz0ddw78S5Nplba5vsCUHnsUD13BCIlZDS1wnHr+8HRahX1wTwqa4aLA9RLVmqDmFkLQ8JvOZuip4LY0NFSRvrHlOn0B5UbgT4ryrW/jU7w== rjacquier@console.com.au',
            stackscript_id: <number>this._initStackScriptId,
        };

        if (!this._master) {
            // Create Master Linode
            linode.label = 'Master';
            let master = await this._config.linodeClient.Create(linode);
            this._master = master;
            //await this.InitSwarm(master);

            return this._master;
        } else {
            linode.label = 'Node';
            let node = await this._config.linodeClient.Create(linode);
            // await this.JoinSwarm(node);

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
            throw new Error(`Error retrieving Swarm health: '${stdout}'`);
        }

        return nodeHealth;
    }
}
