import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient } from '../types';
import { 
  UserPlus, 
  Search, 
  ChevronRight,
  Filter,
  MoreVertical
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const PatientManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newPatient, setNewPatient] = useState({
    name: '',
    dob: '',
    gender: 'Male' as any,
    contact: '',
    address: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'patients'), {
        ...newPatient,
        createdAt: new Date().toISOString()
      });
      setNewPatient({ name: '', dob: '', gender: 'Male', contact: '', address: '' });
      setShowAddForm(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Patient Database</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="glass-button flex items-center gap-2"
        >
          <UserPlus size={16} />
          Register Patient
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/40 backdrop-blur-md border border-white/50 px-12 py-3 rounded-2xl text-sm outline-none focus:bg-white/60 transition-all font-sans"
          />
        </div>
      </div>

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">Patient Registry</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">Gender/Age</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">Last Entry</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-semibold uppercase text-xs">Querying_Diagnostic_History...</td></tr>
              ) : filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-white/40 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{p.id.substring(0, 10)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-semibold text-slate-600">{p.gender}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(p.dob)}</p>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500 font-medium">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass-panel !p-0 shadow-2xl"
            >
              <div className="glass-header !bg-white/40">NEW_PATIENT_REGISTRY</div>
              <div className="p-8">
                <form onSubmit={handleAddPatient} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Full Identity</label>
                      <input 
                        required
                        type="text" 
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        className="w-full bg-white/20 border border-black/5 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-sans"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Date of Birth</label>
                      <input 
                        required
                        type="date" 
                        value={newPatient.dob}
                        onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                        className="w-full bg-white/20 border border-black/5 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Gender Class</label>
                      <select 
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                        className="w-full bg-white/20 border border-black/5 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-end pt-6 border-t border-black/5">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit" 
                      className="glass-button"
                    >
                      Commit Registry
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientManager;
