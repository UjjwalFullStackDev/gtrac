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
  alertId: number; // The actual alert ID from your alert table
  ambulanceId: number; // This will be alert.id from your response
  sysServiceId: string | number; // sys_service_id from alert
  ambulanceNumber: string; // vehicleno from alert
}

export interface AlertResponse {
  id: number;
  user_id: number;
  group_id: number;
  Username: string;
  alert_type: string;
  vehicleno: string;
  sys_service_id: string;
  speed: string;
  gps_latitude: string;
  gps_longitude: string;
  aws_msg_id: string | null;
  number: string | null;
  email: string | null;
  msg: string;
  remark: string | null;
  issue: string | null;
  created_at: string;
  sent_at: string;
  status: number;
  popup_status: number;
  email_status: number;
  sms_status: number;
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