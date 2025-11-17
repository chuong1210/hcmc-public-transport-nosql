// Station Types
export interface Address {
  street: string;
  ward: string;
  //district: string;
  city: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Facilities {
  waiting_area: boolean;
  wifi: boolean;
  toilet: boolean;
  atm: boolean;
  wheelchair_accessible: boolean;
}

export interface Station {
  _key?: string;
  _id?: string;
  station_id: string;
  name: string;
  address: Address;
  location: Location;
  type: 'terminal' | 'intermediate' | 'stop';
  status: 'active' | 'maintenance' | 'inactive';
  facilities: Facilities;
  capacity: number;
  created_at?: string;
  updated_at?: string;
}

// Route Types
export interface OperatingHours {
  start: string;
  end: string;
}

export interface Fare {
  adult: number;
  student: number;
  senior: number;
  currency: string;
}

export interface BusRoute {
  _key?: string;
  _id?: string;
  route_id: string;
  route_name: string;
  route_code: string;
  type: 'normal' | 'express' | 'rapid';
  direction: 'one-way' | 'two-way';
  operating_hours: OperatingHours;
  frequency: number;
  fare: Fare;
  total_distance: number;
  estimated_duration: number;
  status: 'active' | 'inactive';
  operator: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// User Types
export interface User {
  _key?: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  phone?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  last_login?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// Journey Planner Types
export interface JourneyQuery {
  from: string;
  to: string;
  departure_time?: string;
}

export interface PathSegment {
  from: Station;
  to: Station;
  route: BusRoute;
  distance: number;
  duration: number;
}

export interface Journey {
  path: PathSegment[];
  total_distance: number;
  total_duration: number;
  total_cost: number;
  transfers: number;
}

// ... (giữ nguyên types cũ)

// Vehicle Types
export interface Features {
  air_conditioning: boolean;
  wifi: boolean;
  usb_charging: boolean;
  wheelchair_lift: boolean;
}

export interface Vehicle {
  _key?: string;
  _id?: string;
  vehicle_id: string;
  license_plate: string;
  type: 'bus_16' | 'bus_40' | 'bus_60';
  capacity: number;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: 'diesel' | 'cng' | 'electric';
  condition: 'good' | 'fair' | 'maintenance';
  features: Features;
  last_maintenance: string;
  next_maintenance: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
  updated_at?: string;
}

// Schedule Types
export interface Driver {
  name: string;
  license_number: string;
}

export interface Schedule {
  _key?: string;
  _id?: string;
  route_id: string;
  vehicle_id: string;
  departure_time: string;
  day_of_week: string[];
  shift: 'morning' | 'afternoon' | 'evening';
  driver?: Driver;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
}

// Enhanced Journey Types
export interface RouteSegment {
  route: BusRoute;
  from_station: Station;
  to_station: Station;
  from_stop_order: number;
  to_stop_order: number;
  stops: number;
}

export interface JourneyPath {
  vertices: Station[];
  edges: any[];
  total_distance: number;
  total_duration: number;
  stops: number;
  routes?: RouteSegment[];
}

// Analytics Types
export interface AnalyticsOverview {
  total_stations: number;
  total_routes: number;
  active_routes: number;
  total_vehicles: number;
  total_users: number;
}

export interface TypeCount {
  type: string;
  count: number;
}

export interface DistrictCount {
  district: string;
  count: number;
}

export interface BusiestStation {
  station: Station;
  route_count: number;
}

export interface VehicleUtilization {
  total: number;
  assigned: number;
  unassigned: number;
  utilization_rate: number;
  by_status: { status: string; count: number }[];
  by_type: { type: string; count: number }[];
}


export interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

export interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code: number; // Link trực tiếp đến province
}

export interface ProvinceDetail extends Province {
  wards: Ward[];
}