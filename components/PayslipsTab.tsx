
import React, { useState, useMemo, useEffect } from 'react';
import { EmployeeSalaryData } from '../types';
import { Download, FileDown, Search, Eye, X, Loader2, Calendar, FolderArchive } from 'lucide-react';
import { generateSinglePayslip, generateBulkPayslips, generateIndividualZippedPayslips } from '../utils/pdfGenerator';

interface PayslipsTabProps {
  employees: EmployeeSalaryData[];
  companyLogo?: string;
  showBulkOptions?: boolean; // Kept for prop compatibility but logic updated to show for all
}

const PayslipsTab: React.FC<PayslipsTabProps> = ({ employees, companyLogo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeSalaryData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const availablePeriods = useMemo(() => {
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const periods = Array.from(new Set(employees.map(e => `${e.month} ${e.year}`)));
    // Added explicit string types to fix 'unknown' property error when calling .split()
    return periods.sort((a: string, b: string) => {
      const [mA, yA] = a.split(' ');
      const [mB, yB] = b.split(' ');
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return monthsOrder.indexOf(mB) - monthsOrder.indexOf(mA);
    });
  }, [employees]);

  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0] || "");

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPeriod = !selectedPeriod || `${emp.month} ${emp.year}` === selectedPeriod;
      return matchesSearch && matchesPeriod;
    });
  }, [employees, searchTerm, selectedPeriod]);

  const handleViewPdf = (emp: EmployeeSalaryData) => {
    setIsLoading(true);
    setCurrentEmployee(emp);
    setTimeout(() => {
      try {
        const doc = generateSinglePayslip(emp, companyLogo, false);
        setPreviewPdfUri(doc.output('datauristring'));
        setIsPreviewOpen(true);
      } catch (err) { console.error("PDF Error", err); } finally { setIsLoading(false); }
    }, 100);
  };

  const closePreview = () => { setPreviewPdfUri(null); setIsPreviewOpen(false); };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Generate Payslips</h2>
          <p className="text-gray-500 font-medium font-bold uppercase text-[10px] tracking-widest mt-1">Search, View and Download Salary Statements</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => { setIsZipping(true); await generateIndividualZippedPayslips(filteredEmployees, companyLogo); setIsZipping(false); }} 
            className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 uppercase tracking-widest text-[10px] transition-all"
          >
            {isZipping ? <Loader2 size={16} className="animate-spin" /> : <FolderArchive size={16} />}
            <span>Individual ZIP</span>
          </button>
          <button 
            onClick={() => generateBulkPayslips(filteredEmployees, companyLogo)} 
            className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px] transition-all"
          >
            <FileDown size={18} />
            <span>Bulk PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or employee ID..." 
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm font-bold text-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-3 bg-white px-6 py-5 rounded-[24px] border border-gray-100 shadow-sm md:w-64">
          <Calendar size={20} className="text-indigo-500" />
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="text-sm font-bold text-gray-700 bg-transparent outline-none w-full">
            <option value="">All Periods</option>
            {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-gray-200">
           <Search size={48} className="text-gray-200 mb-4" />
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No matching staff records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredEmployees.map((emp) => (
            <div key={`${emp.id}-${emp.month}-${emp.year}`} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col group">
              <h4 className="font-black text-gray-900 truncate tracking-tight">{emp.name}</h4>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-6">{emp.month} {emp.year}</p>
              <div className="space-y-3 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Employee ID</span>
                  <span className="text-[10px] font-black text-gray-800">{emp.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Net Payable</span>
                  <span className="text-sm font-black text-indigo-600">₹{emp.netSalary.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button onClick={() => handleViewPdf(emp)} className="flex items-center justify-center gap-2 py-3.5 bg-white text-gray-600 font-black rounded-2xl border border-gray-200 text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors">
                  {isLoading && currentEmployee?.id === emp.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                  View
                </button>
                <button onClick={() => generateSinglePayslip(emp, companyLogo)} className="flex items-center justify-center gap-2 py-3.5 bg-indigo-50 text-indigo-600 font-black rounded-2xl border border-indigo-100 text-[10px] uppercase tracking-widest shadow-sm shadow-indigo-100/50 hover:bg-indigo-100 transition-colors">
                  <Download size={16} />
                  Get PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPreviewOpen && previewPdfUri && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[40px] shadow-3xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 bg-white flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Payslip Preview: {currentEmployee?.name}</h3>
              <div className="flex items-center gap-4">
                 <button onClick={() => generateSinglePayslip(currentEmployee!, companyLogo, false).output('dataurlnewwindow')} className="px-4 py-2.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 uppercase tracking-widest">Full Screen</button>
                 <button onClick={closePreview} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
              </div>
            </div>
            <iframe key={previewPdfUri} src={previewPdfUri} className="flex-1 border-none bg-white rounded-b-2xl" title="Payslip View" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipsTab;
