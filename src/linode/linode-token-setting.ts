import * as fs from 'fs';

export class LinodeTokenSetting {
    private _tokenFileName: string;

    constructor(tokenFileName: string) {
        this._tokenFileName = tokenFileName;
    }

    private _value: string;
    get Value(): string {
        if (!this._value) {
            this._value = this.GetToken()
        }

        return this._value;
    }

    private GetToken(): string {
        let fileExists = fs.existsSync(this._tokenFileName);

        if (!fileExists) {
            throw `Token file '${this._tokenFileName}' does not exist`
        }

        let token = fs.readFileSync(this._tokenFileName);
        return token.toString()
    }
}
