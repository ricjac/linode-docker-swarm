import * as ssh from 'node-ssh';

export class SSHClient {
    private _sshClient;

    constructor(hostName: string, userName: string, privateKey: string) {
        this._sshClient = new ssh();

        // TODO: Lazy connect
        this._sshClient.connect({
            host: hostName,
            username: userName,
            privateKey: privateKey
        });
    }

    async Exec(command: string): Promise<string> {
        let result = await this._sshClient.execCommand(command);
        return "";
    }
}
