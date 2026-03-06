import { createClient } from '@supabase/supabase-js';
import { EmployeeSalaryData, User, Role } from '../types';

const getEnvVar = (key: string): string => {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DB_NAME = 'MaruthiHR_LocalCache_V5';
const DB_VERSION = 1;
const STORES = {
  EMPLOYEES: 'employees',
  USERS: 'users',
  EMPLOYERS: 'employers'
};

const getIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach(store => {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const localOp = async <T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
  const db = await getIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const cloudApi = {
  isCloudActive(): boolean {
    return !!supabase;
  },

  async fetchLogo(): Promise<string | null> {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('payroll_records')
          .select('data')
          .eq('id', 'global_logo')
          .maybeSingle();
        
        if (data?.data) {
          localStorage.setItem('company_logo', data.data);
          return data.data;
        }
      } catch (e) {
        console.warn("Logo cloud fetch failed", e);
      }
    }
    return localStorage.getItem('company_logo');
  },

  async saveLogo(logoBase64: string): Promise<void> {
    localStorage.setItem('company_logo', logoBase64);
    if (supabase) {
      await supabase
        .from('payroll_records')
        .upsert({ id: 'global_logo', data: logoBase64, updated_at: new Date().toISOString() });
    }
  },

  async fetchEmployees(): Promise<EmployeeSalaryData[]> {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('payroll_records')
          .select('data')
          .eq('id', 'global_roster')
          .maybeSingle();
        
        if (data?.data) {
          await this.saveLocalEmployees(data.data);
          return data.data;
        }
      } catch (err) {
        console.warn("Cloud roster fetch failed, falling back to local", err);
      }
    }

    try {
      const data = await localOp<EmployeeSalaryData[]>(STORES.EMPLOYEES, 'readonly', (s) => s.get('all_records'));
      return data || [];
    } catch {
      return [];
    }
  },

  async saveLocalEmployees(employees: EmployeeSalaryData[]): Promise<void> {
    await localOp(STORES.EMPLOYEES, 'readwrite', (s) => s.put(employees, 'all_records'));
  },

  async saveEmployees(employees: EmployeeSalaryData[]): Promise<void> {
    await this.saveLocalEmployees(employees);

    if (supabase) {
      const { error } = await supabase
        .from('payroll_records')
        .upsert({ id: 'global_roster', data: employees, updated_at: new Date().toISOString() });
      
      if (error) throw new Error("Cloud sync failed: " + error.message);
    }
  },

  async fetchUsers(): Promise<User[]> {
    const defaultAdmin: User = {
      username: 'admin',
      password: 'admin123',
      role: Role.ADMIN,
      name: 'System Administrator',
      email: 'maruthihrsolution25@gmail.com'
    };

    if (supabase) {
      try {
        const { data } = await supabase
          .from('payroll_records')
          .select('data')
          .eq('id', 'global_users')
          .maybeSingle();
        if (data?.data) return data.data;
      } catch (e) {
        console.warn("Users cloud fetch failed", e);
      }
    }

    const localData = await localOp<User[]>(STORES.USERS, 'readonly', (s) => s.get('all_users'));
    if (!localData) {
      await this.saveUsers([defaultAdmin]);
      return [defaultAdmin];
    }
    return localData;
  },

  async saveUsers(users: User[]): Promise<void> {
    await localOp(STORES.USERS, 'readwrite', (s) => s.put(users, 'all_users'));
    if (supabase) {
      await supabase.from('payroll_records').upsert({ id: 'global_users', data: users, updated_at: new Date().toISOString() });
    }
  },

  async updateUserPassword(username: string, newPass: string): Promise<void> {
    const users = await this.fetchUsers();
    const updated = users.map(u => u.username === username ? { ...u, password: newPass } : u);
    await this.saveUsers(updated);
  },

  async fetchEmployers(): Promise<string[]> {
    const defaults = ['HEALTHY FOOD PRODUCTS'];
    
    if (supabase) {
      try {
        const { data } = await supabase
          .from('payroll_records')
          .select('data')
          .eq('id', 'global_employers')
          .maybeSingle();
        if (data?.data) return data.data;
      } catch (e) {
        console.warn("Employers cloud fetch failed", e);
      }
    }

    const localData = await localOp<string[]>(STORES.EMPLOYERS, 'readonly', (s) => s.get('all_employers'));
    if (!localData) {
      await this.saveEmployers(defaults);
      return defaults;
    }
    return localData;
  },

  async saveEmployers(employers: string[]): Promise<void> {
    await localOp(STORES.EMPLOYERS, 'readwrite', (s) => s.put(employers, 'all_employers'));
    if (supabase) {
      await supabase.from('payroll_records').upsert({ id: 'global_employers', data: employers, updated_at: new Date().toISOString() });
    }
  },

  async authenticate(username: string, password: string): Promise<User | null> {
    const users = await this.fetchUsers();
    return users.find(u => u.username === username && u.password === password) || null;
  },

  async exportFullDatabase(): Promise<string> {
    const data = {
      employees: await this.fetchEmployees(),
      users: await this.fetchUsers(),
      employers: await this.fetchEmployers(),
      timestamp: new Date().toISOString(),
      provider: supabase ? 'Supabase Cloud' : 'IndexedDB Local'
    };
    return JSON.stringify(data, null, 2);
  }
};