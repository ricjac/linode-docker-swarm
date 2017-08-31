export interface ISwarmNodeHealth {
    Id: string;
    HostName: string;
    Status: string;
    Availability: string;
}

export interface ISwarmHealth {
    Nodes: ISwarmNodeHealth[];
}
