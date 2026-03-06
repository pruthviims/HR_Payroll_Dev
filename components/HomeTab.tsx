
import React, { useState, useMemo } from 'react';
import { EmployeeSalaryData } from '../types';
import { Users, CreditCard, PieChart, Calendar, Upload, ChevronLeft, ChevronRight, TrendingUp, Building2, Shield, Eye, EyeOff } from 'lucide-react';

interface HomeTabProps {
  employees: EmployeeSalaryData[];
  onUploadTrigger?: () => void;
}

const ITEMS_PER_PAGE = 10;

const MaskedField: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const [show, setShow] = useState(false);
  const maskedValue = value && value !== 'N/A' 
    ? `${value.slice(0, 3)} •••• ${value.slice(-4)}` 
    : value;

  return (
    <div className="flex items-center gap-2 group/mask cursor-help" onClick={() => setShow(!show)} title={`Click to toggle ${label}`}>
      <span className="text-[10px] font-bold text-gray-400 uppercase w-12">{label}:</span>
      <span className="text-[10px] font-black text-gray-800 font-mono">
        {show ? value : maskedValue}
      </span>
      {show ? <EyeOff size={10} className="text-indigo-400" /> : <Eye size={10} className="text-gray-300 opacity-0 group-hover/mask:opacity-100" />}
    </div>
  );
};

const HomeTab: React.FC<HomeTabProps> = ({ employees, onUploadTrigger }) => {
  const availablePeriods = useMemo(() => {
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const periods = Array.from(new Set(employees.map(e => `${e.month} ${e.year}`)));
    return periods.sort((a: string, b: string) => {
      const [mA, yA] = a.split(' ');
      const [mB, yB] = b.split(' ');
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return monthsOrder.indexOf(mB) - monthsOrder.indexOf(mA);
    });
  }, [employees]);

  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0] || "");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => `${e.month} ${e.year}` === selectedPeriod);
  }, [employees, selectedPeriod]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const totalNet = filteredEmployees.reduce((acc, emp) => acc + emp.netSalary, 0);
  const totalPF = filteredEmployees.reduce((acc, emp) => acc + emp.pfDeduction, 0);

  React.useEffect(() => { setCurrentPage(1); }, [selectedPeriod]);
  React.useEffect(() => {
    if (!selectedPeriod && availablePeriods.length > 0) setSelectedPeriod(availablePeriods[0]);
  }, [availablePeriods, selectedPeriod]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payroll Summary</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Monitoring company-wide payroll distribution for auditing purposes</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {availablePeriods.length > 0 && (
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex-1 lg:flex-none">
              <Calendar size={18} className="text-indigo-500" />
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="text-sm font-bold text-gray-700 bg-transparent outline-none cursor-pointer w-full">
                {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {onUploadTrigger && (
            <button onClick={onUploadTrigger} className="flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] flex-1 lg:flex-none">
              <Upload size={18} /><span className="whitespace-nowrap">Import Monthly Ledger</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Users size={24} /></div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Audit Population</p>
              <h3 className="text-3xl font-black text-gray-900">{filteredEmployees.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner"><CreditCard size={24} /></div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Disbursements</p>
              <h3 className="text-3xl font-black text-gray-900">₹{totalNet.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl shadow-inner"><PieChart size={24} /></div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">PF Statutory Pool</p>
              <h3 className="text-3xl font-black text-gray-900">₹{totalPF.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-gray-50 bg-white flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <Building2 className="text-indigo-400" size={24} /> Workforce Register
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
              <Shield size={12} /> Audit Ready & Secured
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/30 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-6">Employee Member</th>
                <th className="px-8 py-6">Period</th>
                <th className="px-8 py-6 text-right">Gross Earnings</th>
                <th className="px-8 py-6 text-right">Total Deductions</th>
                <th className="px-8 py-6 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map((emp) => (
                <tr key={`${emp.id}-${emp.month}-${emp.year}`} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-900 group-hover:text-indigo-600">{emp.name}</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">ID: {emp.id}</p>
                        <MaskedField label="ESI" value={emp.esiNo} />
                        <MaskedField label="UAN" value={emp.uanNo} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-gray-500 uppercase">{emp.month} {emp.year}</td>
                  <td className="px-8 py-6 text-right font-black text-sm text-gray-800">₹{emp.grossEarnings.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-black text-sm text-red-500">₹{emp.totalDeductions.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black">₹{emp.netSalary.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2.5 bg-white border border-gray-200 rounded-xl"><ChevronLeft size={18} /></button>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-2.5 bg-white border border-gray-200 rounded-xl"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeTab;
