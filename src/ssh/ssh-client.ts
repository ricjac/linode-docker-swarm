export class SSHClient {
    private _ipv4: string;

    constructor(ipv4: string) {
        this._ipv4 = ipv4;
    }

    async Exec(command: string): Promise<string> {
        return "";
    }
}
