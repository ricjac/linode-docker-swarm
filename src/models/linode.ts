export class Linode {
  id: string;
  label: string;
  region: Region;
  ipv4: string[];
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

export interface LinodeResponse {
  page: number;
  total_results: number;
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
