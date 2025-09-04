export interface FuelLog {
  id: number;
  ambulanceId: number;
  invoiceFileUrl: string;
  fuelType: string;
  softwareReadingLitres: string;
  softwareReadingTotalAmount?: string;
  manualReadingLitres?: string;
  fuelDateTime: string;
  location: string;
  ambulance: {
    id: number;
    sysServiceId: string;
    ambulanceNumber: string;
  };
}

export interface GpsFuel {
  id: number;
  sys_service_id: number;
  gps_time: string;
  rec_time: string;
  rv: number;
  av: number;
  timeinepoc: number;
  gps_latitude: string;
  gps_longitude: string;
  filling: number;
  fillingtheftaddress: string;
  fueltype: string;
}

export interface AlertContext {
  ambulanceId: number;
  sysServiceId: string | number;
  ambulanceNumber: string;
}

export interface MergedFuelData extends AlertContext {
  location: string;
  softwareReading: number;
  gpsFilling: number;
  difference: string;
  amount: string;
  invoiceUrl: string;
  status: 'OK' | 'Audit';
}

export interface SubmitFormData {
  otp: string;
  payment: string;
  amount: string | number;
}