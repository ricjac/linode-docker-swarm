export interface ICreateLinodeRequest {
  region: string,
  type: string,
  label: string,
  group: string,
  distribution: string,
  root_pass: string,
  root_ssh_key: string,
  stackscript_id: number
}

export class Linode {
  id: string;
  label: string;
  region: Region;
  ipv4: string[];
  distribution: Distribution;
  status: LinodeStatus;
  type: string;
}

export enum LinodeStatus {
  offline,
  booting,
  running,
  shutting_down,
  rebooting,
  provisioning,
  deleting,
  migrating,
}

export class Region {
  id: string;
  label: string;
  country: string;
}

export class Distribution {
  created: Date;
  deprecated: boolean;
  id: string;
  label: string;
  minimum_storage_size: number;
  vendor: string;
  x64: boolean;
}

export class Type {
  backups_price: number;
  id: string;
  label: string;
  transfer: number;
  storage: number;
  monthly_price: number;
  ram: number;
  mbits_out: number;
  hourly_price: number;
  vcpus: number;
  class: string;
}

export class StackScript {
  id: string;
  label: string;
  script: string;
  distributions: any[]
}

export interface LinodeResponse {
  page: number;
  total_results: number;
}

export interface InstancesResponse extends LinodeResponse {
  linodes: ReadonlyArray<Linode>
}

export interface RegionsResponse extends LinodeResponse {
  regions: ReadonlyArray<Region>
}

export interface DistributionsResponse extends LinodeResponse {
  distributions: ReadonlyArray<Distribution>
}

export interface TypesResponse extends LinodeResponse {
  types: ReadonlyArray<Type>
}

export interface StackScriptsResponse extends LinodeResponse {
  stackscripts: ReadonlyArray<StackScript>
}
