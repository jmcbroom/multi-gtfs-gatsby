export interface BikeshareStation {
  station_id: string;
  name: string;
  physical_configuration: string;
  lat: number;
  lon: number;
  altitude: number;
  address: string;
  post_code: string;
  capacity: number;
  is_charging_station: boolean;
  rental_methods: string[];
  is_virtual_station: boolean;
  groups: string[];
  obcn: string;
  nearby_distance: number;
  _bluetooth_id: string;
  _ride_code_support: boolean;
  rental_uris: Record<string, string>;
  status: BikeshareStationStatus;
}

export interface BikeshareStationStatus {
  station_id: string;
  num_bikes_available: number;
  num_bikes_disabled: number;
  num_docks_available: number;
  num_docks_disabled: number;
  last_reported: number;
  is_charging_station: boolean;
  status: string;
  is_installed: boolean;
  is_renting: boolean;
  is_returning: boolean;
  traffic: null;
  vehicle_docks_available: VehicleDockAvailable[];
  vehicle_types_available: VehicleTypeAvailable[];
}

export interface VehicleDockAvailable {
  vehicle_type_ids: string[];
  count: number;
}

export interface VehicleTypeAvailable {
  vehicle_type_id: string;
  count: number;
} 