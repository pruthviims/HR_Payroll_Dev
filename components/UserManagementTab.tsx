
import React, { useState, useEffect } from 'react';
import { User, Role, EmployeeSalaryData } from '../types';
import { cloudApi } from '../services/api';
import { UserPlus, RefreshCcw, Key, Shield, Trash2, CheckCircle2, AlertCircle, X, UserCheck, Mail, Send, Info } from 'lucide-react';

interface UserManagementTabProps {
  employees: EmployeeSalaryData[];
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ employees }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sharingStatus, setSharingStatus] = useState<Record<string, boolean>>({});
  
  // Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>(Role.EMPLOYEE);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await cloudApi.fetchUsers();
    setUsers(data);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    const pass = Array(10).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewUserPassword(pass);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername || !newUserPassword) return;

    const newUser: User = {
      name: newUserName,
      email: newUserEmail,
      username: newUserUsername,
      password: newUserPassword,
      role: newUserRole
    };

    const updatedUsers = [...users, newUser];
    await cloudApi.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setSuccessMsg(`Account created for ${newUserName}`);
    setIsModalOpen(false);
    
    // Reset form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserRole(Role.EMPLOYEE);

    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const deleteUser = async (username: string) => {
    if (username === 'admin') return; 
    const updated = users.filter(u => u.username !== username);
    await cloudApi.saveUsers(updated);
    setUsers(updated);
  };

  const shareCredentials = (user: User) => {
    if (!user.email) {
      alert("No email address associated with this account.");
      return;
    }
    
    setSharingStatus({ ...sharingStatus, [user.username]: true });

    const subject = encodeURIComponent("Your Maruthi Portal Login Credentials");
    const body = encodeURIComponent(
      `Hello ${user.name},\n\n` +
      `Your access to the Maruthi HR Solution Portal has been created.\n\n` +
      `Username: ${user.username}\n` +
      `Password: ${user.password}\n\n` +
      `Please log in at your earliest convenience.\n\n` +
      `Regards,\n` +
      `Payroll Administration`
    );

    // Open mail client
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
    
    setTimeout(() => {
      setSharingStatus({ ...sharingStatus, [user.username]: false });
      setSuccessMsg(`Email client opened for ${user.email}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Staff Management</h2>
          <p className="text-sm text-gray-500 font-medium">Control access for Payroll and HR/Finance team members</p>
          
          <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3">
             <Info className="text-indigo-600 shrink-0" size={18} />
             <div className="space-y-1">
               <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">How to share credentials</p>
               <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                 Clicking the <Send size={10} className="inline mx-0.5" /> icon will open your device's default email app (Outlook/Gmail) with a pre-filled draft. Simply click 'Send' in your mail app to finish.
               </p>
             </div>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all shrink-0"
        >
          <UserPlus size={18} />
          <span className="text-xs uppercase tracking-widest">Add New Staff Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 text-emerald-700 animate-in slide-in-from-top-4">
          <CheckCircle2 size={24} />
          <p className="text-sm font-bold">{successMsg}</p>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-6">Staff Name & Email</th>
                <th className="px-8 py-6">Username / ID</th>
                <th className="px-8 py-6">Role / Team</th>
                <th className="px-8 py-6">Password</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-black text-gray-900">{u.name || 'System'}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{u.email || 'No email set'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">{u.username}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${u.role === Role.ADMIN ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      <Shield size={10} /> {u.role === Role.ADMIN ? 'Payroll Admin' : 'HR/Finance Team'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg font-mono text-xs font-bold text-gray-600 w-fit">
                      {u.password}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => shareCredentials(u)}
                        disabled={sharingStatus[u.username] || !u.email}
                        className="p-3 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-30"
                        title="Open Email Client with Credentials"
                      >
                        {sharingStatus[u.username] ? <RefreshCcw size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                      <button 
                        onClick={() => deleteUser(u.username)}
                        disabled={u.username === 'admin'}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3"><UserCheck size={24}/> Create Staff Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. John Doe" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} type="email" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. john@company.com" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username / Login ID</label>
                <input required value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. hr_auditor_1" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600">
                  <option value={Role.EMPLOYEE}>HR / Finance Team (View Only)</option>
                  <option value={Role.ADMIN}>Payroll Admin (Full Access)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <div className="flex gap-2">
                  <input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="text" className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Set or Generate" />
                  <button type="button" onClick={generatePassword} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"><RefreshCcw size={18}/></button>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
                Confirm & Save User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
