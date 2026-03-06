
export enum Role {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

export interface User {
  username: string; 
  password: string;
  role: Role;
  name?: string;
  email?: string;
}

export interface EmployeeSalaryData {
  id: string;
  name: string;
  esiNo: string;
  uanNo: string;
  totalDays: number;
  workedDays: number;
  otHours: number;
  fixedGross: number;
  basicDA: number;
  bonus: number;
  otAmount: number;
  arrears: number;
  attendanceBonus: number;
  esiDeduction: number;
  pfDeduction: number;
  ptDeduction: number;
  lwfDeduction: number;
  otherDeduction: number;
  canteenDeduction: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  month: string;
  year: number;
  displayDate: string;
  principalEmployer: string; // New field for multi-client support
}

export enum TabType {
  HOME = 'home',
  PAYSLIPS = 'payslips',
  INSIGHTS = 'insights',
  USERS = 'users'
}

export type ColumnMapping = Record<keyof Omit<EmployeeSalaryData, 'grossEarnings' | 'totalDeductions' | 'netSalary' | 'month' | 'year' | 'displayDate' | 'principalEmployer'>, string>;

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface SyncStatus {
  lastSynced: Date | null;
  isSyncing: boolean;
  status: 'online' | 'offline' | 'error';
}
