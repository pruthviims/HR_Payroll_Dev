
import React, { useState, useMemo } from 'react';
import { EmployeeSalaryData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { TrendingUp, Calculator, ShieldCheck, Download, Calendar, Repeat, FileSpreadsheet, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

interface InsightsTabProps {
  employees: EmployeeSalaryData[];
}

const InsightsTab: React.FC<InsightsTabProps> = ({ employees }) => {
  const [compareMode, setCompareMode] = useState<'monthly' | 'yearly'>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const totalGross = employees.reduce((sum, emp) => sum + emp.grossEarnings, 0);
  const totalPF = employees.reduce((sum, emp) => sum + emp.pfDeduction, 0);
  const totalESI = employees.reduce((sum, emp) => sum + emp.esiDeduction, 0);
  const totalPT = employees.reduce((sum, emp) => sum + emp.ptDeduction, 0);

  const pieData = [
    { name: 'PF Fund', value: totalPF, color: '#6366f1' },
    { name: 'ESI Payout', value: totalESI, color: '#10b981' },
    { name: 'Prof. Tax', value: totalPT, color: '#f59e0b' },
    { name: 'Others', value: employees.reduce((sum, emp) => sum + emp.lwfDeduction + emp.canteenDeduction + emp.otherDeduction, 0), color: '#ef4444' }
  ];

  const comparisonData = useMemo(() => {
    if (compareMode === 'monthly') {
      const monthMap: Record<string, number> = {};
      employees.forEach(emp => {
        const key = `${emp.month} ${emp.year}`;
        monthMap[key] = (monthMap[key] || 0) + emp.netSalary;
      });
      const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return Object.entries(monthMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const [mA, yA] = a.name.split(' ');
          const [mB, yB] = b.name.split(' ');
          if (yA !== yB) return parseInt(yA) - parseInt(yB);
          return monthsOrder.indexOf(mA) - monthsOrder.indexOf(mB);
        });
    } else {
      const yearMap: Record<string, number> = {};
      employees.forEach(emp => {
        yearMap[emp.year] = (yearMap[emp.year] || 0) + emp.netSalary;
      });
      return Object.entries(yearMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }
  }, [employees, compareMode]);

  const handleDownloadReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const reportData = employees.map(emp => ({
        'Employee ID': emp.id,
        'Name': emp.name,
        'Employer': emp.principalEmployer,
        'Period': `${emp.month} ${emp.year}`,
        'Gross Earnings': emp.grossEarnings,
        'PF Deduction': emp.pfDeduction,
        'ESI Deduction': emp.esiDeduction,
        'Prof Tax': emp.ptDeduction,
        'Net Salary': emp.netSalary,
        'Worked Days': emp.workedDays
      }));

      const csv = Papa.unparse(reportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Payroll_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Financial Insights</h2>
          <p className="text-gray-500 text-sm font-medium">Real-time analysis of payroll expenditures</p>
        </div>
        
        <div className="flex items-center bg-white border border-gray-200 p-1.5 rounded-[20px] shadow-sm">
          <button 
            onClick={() => setCompareMode('monthly')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${compareMode === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setCompareMode('yearly')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${compareMode === 'yearly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:border-indigo-200 transition-colors">
          <TrendingUp className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform" size={28} />
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total CTC Payout</p>
          <h4 className="text-2xl font-black text-gray-900">₹{totalGross.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:border-emerald-200 transition-colors">
          <ShieldCheck className="text-emerald-600 mb-4 group-hover:scale-110 transition-transform" size={28} />
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">ESI Contributions</p>
          <h4 className="text-2xl font-black text-gray-900">₹{totalESI.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:border-orange-200 transition-colors">
          <Calculator className="text-orange-600 mb-4 group-hover:scale-110 transition-transform" size={28} />
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">PF Statutory Pool</p>
          <h4 className="text-2xl font-black text-gray-900">₹{totalPF.toLocaleString()}</h4>
        </div>
        <button 
          onClick={handleDownloadReport}
          disabled={isExporting}
          className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex flex-col justify-between group active:scale-[0.98] disabled:opacity-70"
        >
          {isExporting ? <Loader2 size={28} className="animate-spin mb-4" /> : <FileSpreadsheet className="mb-4 group-hover:translate-y-1 transition-transform" size={28} />}
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Export Data</p>
            <p className="text-xs font-black">Generate Full CSV</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Net Payout Velocity</h3>
            <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
              Live Trend Analysis
            </div>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparisonData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} />
                <Tooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                  labelStyle={{ fontWeight: 900, fontSize: '10px', color: '#6366f1', marginBottom: '4px', textTransform: 'uppercase' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Net Payout']}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight">Statutory Mix</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={12} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', fontWeight: 900 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-lg font-black text-gray-900">₹{(totalPF + totalESI + totalPT).toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-3 mt-8">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{item.name}</p>
                </div>
                <p className="text-xs font-black text-gray-900">₹{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight">Financial Efficiency Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-50">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Avg Net Pay / Employee</p>
            <p className="text-2xl font-black text-indigo-900">₹{(totalGross/Math.max(1, employees.length)).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
          </div>
          <div className="p-8 bg-emerald-50/50 rounded-[32px] border border-emerald-50">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Max Single Budget</p>
            <p className="text-2xl font-black text-emerald-900">₹{comparisonData.length > 0 ? Math.max(...comparisonData.map(d => d.value)).toLocaleString() : '0'}</p>
          </div>
          <div className="p-8 bg-orange-50/50 rounded-[32px] border border-orange-50">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Unique Staff Audited</p>
            <p className="text-2xl font-black text-orange-900">{new Set(employees.map(e => e.id)).size}</p>
          </div>
          <div className="p-8 bg-red-50/50 rounded-[32px] border border-red-50">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Liability Ratio</p>
            <p className="text-2xl font-black text-red-900">{totalGross > 0 ? ((totalPF + totalESI) / totalGross * 100).toFixed(1) : '0'}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;
