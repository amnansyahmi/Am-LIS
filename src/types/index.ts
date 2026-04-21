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
}

export type OrderStatus = 'Pending' | 'Collected' | 'In-Progress' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  patientId: string;
  patientName?: string;
  status: OrderStatus;
  orderedBy: string;
  testIds: string[];
  department?: Department;
  createdAt: string;
}

export interface Result {
  id: string;
  orderId: string;
  testId: string;
  testName?: string;
  value: string;
  flag: 'Normal' | 'High' | 'Low';
  technicianId: string;
  updatedAt: string;
}
