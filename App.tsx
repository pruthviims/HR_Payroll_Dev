import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PieChart, 
  Users as UsersIcon,
  Upload, 
  AlertCircle,
  X,
  Image as ImageIcon,
  Cloud,
  CloudOff,
  RefreshCcw,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Camera,
  ShieldAlert,
  Lock,
  Plus,
  Briefcase,
  Database,
  Download,
  Info,
  Server,
  Key,
  ChevronRight,
  Settings2,
  RotateCcw,
  ShieldEllipsis,
  ArrowRight,
  Loader2,
  UserCheck,
  Monitor,
  Smartphone,
  Tablet as TabletIcon
} from 'lucide-react';
import Papa from 'papaparse';
import { EmployeeSalaryData, TabType, ColumnMapping, AuthState, SyncStatus, Role, User } from './types';
import { cloudApi } from './services/api';
import HomeTab from './components/HomeTab';
import PayslipsTab from './components/PayslipsTab';
import InsightsTab from './components/InsightsTab';
import UserManagementTab from './components/UserManagementTab';
import Login from './components/Login';

const DEFAULT_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAABX0lEQVR4nO3cwQmAMBQF0U9rSRuxtA9L00YsrSAtBA9ZIOSeeXAwS97MByFmZmbmP7MBvGf96/k67vIe8O26H7B9v2f7X6P7A+997/1Ahm7YgRTM0A07kIIZulmG3XCHbtiBFMzQDTuQghm6YQdSMEM3y7Ab7tANO5CCGbphB1IwQzfsQApm6GYZdsMduv86kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0A07kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0A07kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0A07kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0A07kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0A07kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0A07kIIZumEHUrD9N+yGO3TDDqRghm7YgRTM0M0y7IY7dMMOpGCGbv4zMzMzM98+ACx5pG67FzEAAAAAS2UVORK5CYII=";

const FIELD_DEFINITIONS: { key: keyof ColumnMapping; label: string; aliases: string[] }[] = [
  { key: 'id', label: 'Employee ID', aliases: ['id', 'emp id', 'employee id', 'code'] },
  { key: 'name', label: 'Employee Name', aliases: ['name', 'emp name', 'fullname'] },
  { key: 'esiNo', label: 'ESI Account', aliases: ['esi'] },
  { key: 'uanNo', label: 'UAN Number', aliases: ['uan'] },
  { key: 'totalDays', label: 'Total Period Days', aliases: ['total days', 'days in month'] },
  { key: 'workedDays', label: 'Worked Days', aliases: ['worked', 'worked days', 'present'] },
  { key: 'otHours', label: 'OT Hours', aliases: ['ot', 'ot hours'] },
  { key: 'fixedGross', label: 'Fixed Gross', aliases: ['fixed gross', 'gross salary'] },
  { key: 'basicDA', label: 'Basic + DA', aliases: ['basic', 'basic da'] },
  { key: 'bonus', label: 'Bonus', aliases: ['bonus'] },
  { key: 'otAmount', label: 'OT Amount', aliases: ['ot amount'] },
  { key: 'arrears', label: 'Arrears', aliases: ['arrears'] },
  { key: 'attendanceBonus', label: 'Attendance Bonus', aliases: ['attendance bonus'] },
  { key: 'esiDeduction', label: 'ESI Deduction', aliases: ['esi deduction'] },
  { key: 'pfDeduction', label: 'PF Deduction', aliases: ['pf deduction', 'epf'] },
  { key: 'ptDeduction', label: 'Prof. Tax', aliases: ['pt', 'prof tax'] },
  { key: 'lwfDeduction', label: 'LWF', aliases: ['lwf'] },
  { key: 'canteenDeduction', label: 'Canteen', aliases: ['canteen'] },
  { key: 'otherDeduction', label: 'Other Deduction', aliases: ['other deduction', 'others'] }
];

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes inactivity timeout
const IGNORE_VAL = "___IGNORE___";

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null, loading: true });
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.HOME);
  const [employees, setEmployees] = useState<EmployeeSalaryData[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>(DEFAULT_LOGO);
  const [sync, setSync] = useState<SyncStatus>({ lastSynced: null, isSyncing: false, status: 'offline' });
  
  const [employers, setEmployers] = useState<string[]>([]);
  const [selectedEmployer, setSelectedEmployer] = useState<string>('');
  const [isAddEmployerOpen, setIsAddEmployerOpen] = useState(false);
  const [newEmployerName, setNewEmployerName] = useState('');

  const [showMapping, setShowMapping] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [currentCsvData, setCurrentCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});

  // Security Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetOldPass, setResetOldPass] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback((reason?: string) => {
    localStorage.removeItem('payslip_session_v5');
    setAuth({ isAuthenticated: false, user: null, loading: false });
    if (reason === 'inactivity') setAuthError('Session expired due to inactivity.');
    setActiveTab(TabType.HOME);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (auth.isAuthenticated) {
      timeoutRef.current = setTimeout(() => handleLogout('inactivity'), INACTIVITY_TIMEOUT);
    }
  }, [auth.isAuthenticated, handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'visibilitychange'];
    if (auth.isAuthenticated) {
      resetInactivityTimer();
      events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    }
    return () => events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
  }, [auth.isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    const savedSession = localStorage.getItem('payslip_session_v5');
    if (savedSession) {
      setAuth({ isAuthenticated: true, user: JSON.parse(savedSession), loading: false });
    } else {
      setAuth(prev => ({ ...prev, loading: false }));
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const cloudLogo = await cloudApi.fetchLogo();
    if (cloudLogo) setCompanyLogo(cloudLogo);
    
    const employerList = await cloudApi.fetchEmployers();
    setEmployers(employerList);
    if (employerList.length > 0) setSelectedEmployer(employerList[0]);
  };

  const loadFromCloud = async () => {
    setSync(prev => ({ ...prev, isSyncing: true }));
    try {
      // Proactively refresh logo from cloud on every sync/login
      const cloudLogo = await cloudApi.fetchLogo();
      if (cloudLogo) setCompanyLogo(cloudLogo);

      const data = await cloudApi.fetchEmployees();
      setEmployees(data);
      setSync({ 
        lastSynced: new Date(), 
        isSyncing: false, 
        status: cloudApi.isCloudActive() ? 'online' : 'offline' 
      });
    } catch (err) {
      setSync(prev => ({ ...prev, isSyncing: false, status: 'error' }));
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => e.principalEmployer === selectedEmployer);
  }, [employees, selectedEmployer]);

  const pushToCloud = async (newEmployees: EmployeeSalaryData[]) => {
    setSync(prev => ({ ...prev, isSyncing: true }));
    try {
      await cloudApi.saveEmployees(newEmployees);
      setSync({ 
        lastSynced: new Date(), 
        isSyncing: false, 
        status: cloudApi.isCloudActive() ? 'online' : 'offline' 
      });
    } catch (err) {
      setSync(prev => ({ ...prev, isSyncing: false, status: 'error' }));
      setUploadError("Cloud Sync Failed. Data saved locally only.");
    }
  };

  const handleBackup = async () => {
    const backup = await cloudApi.exportFullDatabase();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Maruthi_Payroll_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogin = async (username: string, password: string) => {
    const user = await cloudApi.authenticate(username, password);
    if (user) {
      localStorage.setItem('payslip_session_v5', JSON.stringify(user));
      setAuth({ isAuthenticated: true, user, loading: false });
      setAuthError(null);
    } else {
      setAuthError('Invalid credentials. Access denied.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!auth.user) return;
    if (resetOldPass !== auth.user.password) return setResetError('Incorrect current password.');
    if (resetNewPass !== resetConfirmPass) return setResetError('Passwords mismatch.');
    if (resetNewPass.length < 6) return setResetError('Too short.');

    setIsResetting(true);
    try {
      await cloudApi.updateUserPassword(auth.user.username, resetNewPass);
      const updated = { ...auth.user, password: resetNewPass };
      localStorage.setItem('payslip_session_v5', JSON.stringify(updated));
      setAuth(prev => ({ ...prev, user: updated }));
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setResetOldPass(''); setResetNewPass(''); setResetConfirmPass('');
      }, 2000);
    } catch { setResetError('Update failed.'); } finally { setIsResetting(false); }
  };

  useEffect(() => {
    if (auth.isAuthenticated) loadFromCloud();
  }, [auth.isAuthenticated]);

  const handleAddEmployer = async () => {
    if (!newEmployerName.trim()) return;
    const updated = [...employers, newEmployerName.trim()];
    await cloudApi.saveEmployers(updated);
    setEmployers(updated);
    setSelectedEmployer(newEmployerName.trim());
    setNewEmployerName('');
    setIsAddEmployerOpen(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setCompanyLogo(base64);
        await cloudApi.saveLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    let str = String(val).trim().replace(/,/g, '').replace(/\s/g, '');
    if (str === '-' || str === '') return 0;
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCurrentCsvData(results.data);
          
          const newMapping: Partial<ColumnMapping> = {};
          const assignedHeaders = new Set<string>();
          
          FIELD_DEFINITIONS.forEach(fieldDef => {
            const match = headers.find(h => 
              !assignedHeaders.has(h) && 
              fieldDef.aliases.some(alias => h.toLowerCase().trim().includes(alias))
            );
            if (match) {
              newMapping[fieldDef.key] = match;
              assignedHeaders.add(match);
            }
          });
          
          setMapping(newMapping);
          setShowMapping(true);
        }
      }
    });
    if (event.target) event.target.value = '';
  };

  const processDataWithMapping = () => {
    try {
      const now = new Date();
      const prevDateObj = new Date(now.getFullYear(), now.getMonth(), 0);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const displayMonth = monthNames[prevDateObj.getMonth()];
      const displayYear = prevDateObj.getFullYear();
      const day = String(prevDateObj.getDate()).padStart(2, '0');
      const prevMonthEndStr = `${day}-${displayMonth}-${displayYear}`;

      const parsedData = currentCsvData.map((row: any) => {
        const getVal = (field: keyof ColumnMapping) => cleanNumber(row[mapping[field]!]);
        const earnings = getVal('basicDA') + getVal('bonus') + getVal('otAmount') + getVal('arrears') + getVal('attendanceBonus');
        const deductions = getVal('esiDeduction') + getVal('pfDeduction') + getVal('ptDeduction') + getVal('lwfDeduction') + getVal('otherDeduction') + getVal('canteenDeduction');
        return {
          id: row[mapping.id!] || 'N/A', name: (row[mapping.name!] || 'Unknown').toUpperCase(),
          esiNo: row[mapping.esiNo!] || 'N/A', uanNo: row[mapping.uanNo!] || 'N/A',
          totalDays: getVal('totalDays'), workedDays: getVal('workedDays'), otHours: getVal('otHours'),
          fixedGross: getVal('fixedGross'), basicDA: getVal('basicDA'), bonus: getVal('bonus'),
          otAmount: getVal('otAmount'), arrears: getVal('arrears'), attendanceBonus: getVal('attendanceBonus'),
          esiDeduction: getVal('esiDeduction'), pfDeduction: getVal('pfDeduction'), ptDeduction: getVal('ptDeduction'),
          lwfDeduction: getVal('lwfDeduction'), canteenDeduction: getVal('canteenDeduction'), otherDeduction: getVal('otherDeduction'),
          grossEarnings: earnings, totalDeductions: deductions, netSalary: earnings - deductions, 
          month: displayMonth, year: displayYear, displayDate: prevMonthEndStr,
          principalEmployer: selectedEmployer
        } as EmployeeSalaryData;
      });

      const updatedList = [...employees, ...parsedData];
      setEmployees(updatedList);
      pushToCloud(updatedList);
      setShowMapping(false);
    } catch (err) { setUploadError("Mapping failed."); }
  };

  const isAdmin = auth.user?.role === Role.ADMIN;

  const renderContent = () => (
    <div className="flex flex-col md:flex-row min-h-screen">
      <nav className="w-full md:w-80 bg-white border-r border-gray-100 p-8 flex flex-col gap-2 overflow-y-auto">
        <div className="flex flex-col gap-6 mb-10">
          <div className="relative group w-24 h-20 self-center">
            <div className="w-28 h-20 bg-white rounded-[20px] flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm transition-all group-hover:scale-[1.02] p-1">
              {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain object-center scale-110" />
              ) : (
                <Building2 size={24} className="text-gray-300" />
              )}
            </div>
            {isAdmin && (
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-700"
              >
                <Camera size={10} />
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black text-gray-900 tracking-tighter leading-none">Maruthi HR</h1>
            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
              Consultancy Portal
            </p>
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={12} className="text-indigo-400" /> Active Client
          </label>
          <div className="flex gap-2">
            <select 
              value={selectedEmployer} 
              onChange={(e) => setSelectedEmployer(e.target.value)}
              className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-3 text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-600 appearance-none"
            >
              {employers.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {isAdmin && (
              <button 
                onClick={() => setIsAddEmployerOpen(true)}
                className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        <button onClick={() => setActiveTab(TabType.HOME)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.HOME ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}>
          <LayoutDashboard size={20} /><span>Payroll Audit</span>
        </button>

        <button onClick={() => setActiveTab(TabType.PAYSLIPS)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.PAYSLIPS ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}>
          <FileText size={20} /><span>Payslip Search</span>
        </button>

        <button onClick={() => setActiveTab(TabType.INSIGHTS)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.INSIGHTS ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}>
          <PieChart size={20} /><span>Statutory Insights</span>
        </button>

        {isAdmin && (
          <button onClick={() => setActiveTab(TabType.USERS)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.USERS ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}>
            <UsersIcon size={20} /><span>User Accounts</span>
          </button>
        )}

        <div className="mt-auto pt-8 border-t border-gray-50 space-y-4">
          <div className="space-y-2">
            <button onClick={() => setIsResetModalOpen(true)} className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all uppercase tracking-widest shadow-sm"><ShieldEllipsis size={16} /> Security Settings</button>
            <button onClick={() => handleLogout()} className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-[10px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest"><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between text-red-700 animate-bounce">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-xs font-bold uppercase tracking-widest">{uploadError}</p>
            </div>
            <button onClick={() => setUploadError(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} /></button>
          </div>
        )}

        {isAdmin && !cloudApi.isCloudActive() && (
          <div className="mb-8 p-6 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-100 flex items-center justify-between animate-in fade-in zoom-in">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-2xl"><Server size={32} /></div>
                <div>
                   <h3 className="text-lg font-black tracking-tight">Cloud Database Not Active</h3>
                   <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Setup Supabase to share data across devices</p>
                </div>
             </div>
             <button 
                onClick={() => window.open('https://supabase.com', '_blank')}
                className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors"
             >
                Activate Cloud
             </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${sync.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Environment:</span>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{selectedEmployer}</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/30 rounded-full border border-indigo-50">
                <RefreshCcw size={14} className={`text-indigo-400 ${sync.isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                  {sync.isSyncing ? 'Syncing...' : 'Real-time V5.0 (Global)'}
                </span>
            </div>
        </div>

        <div className="animate-in fade-in duration-700">
          {activeTab === TabType.HOME && <HomeTab employees={filteredEmployees} onUploadTrigger={isAdmin ? () => fileInputRef.current?.click() : undefined} />}
          {activeTab === TabType.PAYSLIPS && <PayslipsTab employees={filteredEmployees} companyLogo={companyLogo} showBulkOptions={isAdmin} />}
          {activeTab === TabType.INSIGHTS && <InsightsTab employees={filteredEmployees} />}
          {activeTab === TabType.USERS && isAdmin && <UserManagementTab employees={filteredEmployees} />}
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
      </main>
    </div>
  );

  if (auth.loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><RefreshCcw className="animate-spin text-indigo-600" size={48} /></div>;
  if (!auth.isAuthenticated) return <Login onLogin={handleLogin} error={authError} logo={companyLogo} />;

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {renderContent()}

      {/* Security Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[400] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3"><ShieldEllipsis size={24}/> Security Settings</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>

            {resetSuccess ? (
              <div className="p-10 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[30px] flex items-center justify-center shadow-inner animate-bounce"><CheckCircle2 size={40} /></div>
                <h4 className="text-xl font-black text-gray-900">Security Key Updated</h4>
                <p className="text-sm text-gray-500 font-medium">Your credentials have been updated successfully.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input required type="password" value={resetOldPass} onChange={e => setResetOldPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="••••••••" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input required type="password" value={resetNewPass} onChange={e => setResetNewPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Min 6 characters" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input required type="password" value={resetConfirmPass} onChange={e => setResetConfirmPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Repeat new password" />
                  </div>
                </div>
                {resetError && <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase animate-in slide-in-from-top-1"><AlertCircle size={14} />{resetError}</div>}
                <button type="submit" disabled={isResetting} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isResetting ? <Loader2 className="animate-spin" size={18} /> : <><span>Update Credentials</span><ArrowRight size={16}/></>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddEmployerOpen && (
        <div className="fixed inset-0 z-[450] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Plus size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">New Principal Employer</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">Add a new company/client to your Maruthi portal.</p>
              
              <input 
                value={newEmployerName}
                onChange={e => setNewEmployerName(e.target.value)}
                placeholder="Client Company Name"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold mb-6 outline-none focus:ring-2 focus:ring-indigo-600"
              />

              <div className="flex gap-4 w-full">
                <button onClick={() => setIsAddEmployerOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button onClick={handleAddEmployer} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Add Client</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMapping && isAdmin && (
        <div className="fixed inset-0 z-[400] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8">
            <div className="p-10 border-b border-gray-50 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Import for {selectedEmployer}</h3>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Mapping Data Structure</p>
              </div>
              <button onClick={() => setShowMapping(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={28} /></button>
            </div>
            <div className="p-10 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-gray-50/30">
              {FIELD_DEFINITIONS.map((f) => (
                <div key={f.key} className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                  <select 
                    value={mapping[f.key] || ''} 
                    onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold"
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.filter(h => h === mapping[f.key] || !Object.values(mapping).includes(h)).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="p-10 bg-white border-t border-gray-100 flex gap-6">
              <button onClick={processDataWithMapping} className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                <Cloud size={18} /> UPLOAD TO CLOUD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;