import * as fs from 'fs';

export class StackScriptInit {
    private _initScriptFileName: string;

    constructor(initScriptFileName: string) {
        this._initScriptFileName = initScriptFileName;
    }

    private _value: string;
    get Value(): string {
        if (!this._value) {
            this._value = this.GetScriptContents()
        }

        return this._value;
    }

    private GetScriptContents(): string {
        let fileExists = fs.existsSync(this._initScriptFileName);

        if (!fileExists) {
            throw `Token file '${this._initScriptFileName}' does not exist`
        }

        let token = fs.readFileSync(this._initScriptFileName);
        return token.toString()
    }
}
