export type UserRole = 'Admin' | 'Technician' | 'Doctor';
export type Department = 'Haematology' | 'Biochemistry' | 'Immunology' | 'Cytogenetics' | 'Molecular' | 'Microbiology' | 'Anatomical Pathology';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department?: Department;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  address: string;
  createdAt: string;
}

export interface Test {
  id: string;
  name: string;
  category: string;
  department: Department;
  normalRange: string;
  unit: string;
  price: number;
  loinc?: string;
  snomed?: string;
}

export type OrderStatus = 'Pending' | 'Collected' | 'In-Progress' | 'Completed' | 'Cancelled';

export interface Specimen {
  id: string;
  type: string;
  status: 'Expected' | 'Received' | 'Not Received';
  receivedAt?: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName?: string;
  status: OrderStatus;
  orderedBy: string;
  testIds: string[];
  department?: Department;
  createdAt: string;
  priority?: 'Routine' | 'STAT' | 'Urgent';
  lastInterfaceSync?: string;
  
  // New Delphic-spec fields
  requestNumber?: string;
  practitioner?: string;
  location?: string;
  fasting: 'No' | 'Yes' | 'Unknown';
  fastingTime?: string;
  pregnant?: boolean;
  collectionTime?: string;
  arrivalTime?: string;
  lastDoseTime?: string;
  clinicalDetails?: string;
  hospitalNumber?: string;
  referringDoc?: string;
  specimens: Specimen[];
}

export interface Result {
  id: string;
  orderId: string;
  testId: string;
  testName?: string;
  value: string;
  flag: 'Normal' | 'High' | 'Low';
  deltaFlag?: string;
  technicianId: string;
  updatedAt: string;
  loinc?: string;
}
