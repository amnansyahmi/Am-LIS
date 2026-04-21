import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Patient, Test, UserProfile } from '../types';
import { 
  Plus, 
  Search, 
  Clock, 
  Beaker,
  CheckCircle2,
  Activity,
  Eye,
  User,
  Info,
  X,
  Printer,
  Barcode,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  Milestone,
  Zap,
  Send,
  Check,
  RotateCcw,
  FlaskConical
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import SpecimenJourney from './SpecimenJourney';
import BarcodeLabel from './BarcodeLabel';

const OrderManager: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingTest, setViewingTest] = useState<Test | null>(null);
  const [managerTab, setManagerTab] = useState<'requests' | 'catalogue'>('requests');
  const [modalTab, setModalTab] = useState<'details' | 'journey'>('details');
  const [catalogueSearch, setCatalogueSearch] = useState('');

  const filteredTests = tests.filter(t => 
    t.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    t.loinc?.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    t.snomed?.toLowerCase().includes(catalogueSearch.toLowerCase())
  );
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<'Routine' | 'STAT' | 'Urgent'>('Routine');
  const [referringDoc, setReferringDoc] = useState('');

  // Professional Form State
  const [formStep, setFormStep] = useState(1);
  const [requestNumber, setRequestNumber] = useState('');
  const [practitioner, setPractitioner] = useState('');
  const [location, setLocation] = useState('');
  const [fasting, setFasting] = useState<'No' | 'Yes' | 'Unknown'>('No');
  const [fastingTime, setFastingTime] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [collectionTime, setCollectionTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [lastDoseTime, setLastDoseTime] = useState('');
  const [clinicalDetails, setClinicalDetails] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [orderSpecimens, setOrderSpecimens] = useState<any[]>([]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnap = await getDocs(ordersQ);
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));

      const patientsSnap = await getDocs(collection(db, 'patients'));
      setPatients(patientsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));

      const testsSnap = await getDocs(collection(db, 'tests'));
      setTests(testsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Test)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || selectedTests.length === 0) return;

    try {
      const orderData = {
        patientId: selectedPatientId,
        patientName: patients.find(p => p.id === selectedPatientId)?.name,
        status: 'Pending' as const,
        orderedBy: profile?.uid || 'Unknown',
        referringDoc,
        priority,
        createdAt: new Date().toISOString(),
        testIds: selectedTests,
        requestNumber,
        practitioner,
        location,
        fasting,
        fastingTime,
        pregnant,
        collectionTime,
        arrivalTime,
        lastDoseTime,
        clinicalDetails,
        hospitalNumber,
        specimens: orderSpecimens
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      for (const tId of selectedTests) {
        await addDoc(collection(db, 'results'), {
          orderId: orderRef.id,
          testId: tId,
          testName: tests.find(t => t.id === tId)?.name,
          value: '',
          flag: 'Normal',
          technicianId: '',
          updatedAt: new Date().toISOString()
        });
      }

      setShowOrderForm(false);
      setFormStep(1); // Reset step
      setSelectedTests([]);
      setOrderSpecimens([]);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: any) => {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { status: newStatus });
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTest = (id: string) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const DUMMY_PRACTITIONERS = [
    "Dr. Ahmad Ibrahim",
    "Dr. Sarah Lim",
    "Dr. Rajesh Kumar",
    "Dr. Siti Aminah",
    "Dr. Kevin Wong",
    "Dr. Michelle Tan"
  ];

  const DUMMY_LOCATIONS = [
    "Emergency Dept (ED)",
    "Ward 5A (Medical)",
    "Intensive Care Unit (ICU)",
    "Outpatient Clinic (OPC)",
    "Pediatrics Ward (4B)",
    "Maternity Suite (3C)",
    "Operating Theater (OT)"
  ];

  return (
    <>
      <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/40 border border-white/60 p-2 rounded-2xl">
        <div className="flex gap-2">
          <button 
            onClick={() => setManagerTab('requests')}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${managerTab === 'requests' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/60 text-slate-800'}`}
          >
            Diagnostic Requests
          </button>
          <button 
            onClick={() => setManagerTab('catalogue')}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${managerTab === 'catalogue' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/60 text-slate-800'}`}
          >
            Test Catalogue
          </button>
        </div>
        
        {managerTab === 'requests' && (
          <button 
            onClick={() => setShowOrderForm(true)}
            className="glass-button flex items-center gap-2"
          >
            <Plus size={16} />
            New Request
          </button>
        )}
      </div>

      {managerTab === 'requests' ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="glass-panel p-12 text-center text-slate-400 font-semibold uppercase animate-pulse">Initializing_Order_Sync...</div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="glass-card flex items-stretch">
                <div className="p-5 bg-white/20 border-r border-black/5 flex flex-col justify-center items-center gap-1 w-28 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">UID</span>
                  <span className="text-xs font-black text-slate-800 uppercase">{o.id.substring(0, 6)}</span>
                </div>
                
                <div className="p-6 flex-1 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 mb-1">{o.patientName || 'Clinical Subject'}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock size={12} /> {formatDate(o.createdAt)}
                      </span>
                      {o.priority && o.priority !== 'Routine' && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                          o.priority === 'STAT' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <Zap size={10} /> {o.priority}
                        </span>
                      )}
                      <span className={`status-pill ${
                        o.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'In-Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setViewingOrder(o)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-2"
                      title="View Details"
                    >
                      <Eye size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Details</span>
                    </button>

                    <button 
                      onClick={() => alert('Initiating High-Resolution Label Printing Protocol...')}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all flex items-center gap-2"
                      title="Print Specimen Labels"
                    >
                      <Printer size={18} />
                    </button>

                    {o.status === 'Pending' && (
                      <button 
                        onClick={() => updateStatus(o.id, 'Collected')}
                        className="px-4 py-2 bg-white/40 border border-white/60 hover:bg-white/60 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-2"
                      >
                        <Beaker size={14} /> Specimen Collected
                      </button>
                    )}
                    {o.status === 'Collected' && (
                      <button 
                        onClick={() => updateStatus(o.id, 'In-Progress')}
                        className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-2"
                      >
                        <Activity size={14} /> Start Scans
                      </button>
                    )}
                    {o.status === 'Completed' && (
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search Test Catalogue (LOINC, SNOMED, Name)..." 
              className="w-full bg-white border-2 border-slate-100 p-6 pl-16 rounded-[2.5rem] outline-none focus:border-blue-500 transition-all font-bold text-slate-800"
              value={catalogueSearch}
              onChange={(e) => setCatalogueSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-6">
            {filteredTests.map(t => (
              <div key={t.id} className="glass-panel group hover:border-blue-300 transition-all cursor-pointer overflow-hidden p-0" onClick={() => setViewingTest(t)}>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                      <Activity size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fee</p>
                      <p className="text-xl font-black text-slate-900">RM {t.price?.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{t.name}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] mt-2">{t.category}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                    <span className="flex-1 text-[10px] font-black text-blue-600 uppercase tracking-widest">Specifications</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      <AnimatePresence>
        {showOrderForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-blue-600 text-white flex justify-between items-center py-5 px-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[4px] opacity-80 block mb-0.5">Authorization Portal</span>
                    <span className="text-lg font-black uppercase tracking-[2px]">Diagnostic Order Entry</span>
                  </div>
                </div>
                <button onClick={() => setShowOrderForm(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Wizard Steps Indicator */}
              <div className="px-10 py-8 bg-slate-50/80 border-b border-black/5 flex items-center gap-16 shrink-0">
                {[
                  { n: 1, l: 'Patient Identity' },
                  { n: 2, l: 'Clinical Metadata' },
                  { n: 3, l: 'Analytical Profile' }
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-4 relative">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all text-sm ${
                      formStep >= s.n ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {formStep > s.n ? <Check size={20} /> : s.n}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${formStep >= s.n ? 'text-blue-600' : 'text-slate-400'}`}>Step 0{s.n}</span>
                      <span className={`text-xs font-black tracking-tight ${formStep >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.l}</span>
                    </div>
                    {s.n < 3 && <div className={`h-[2px] w-12 ml-4 ${formStep > s.n ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <form onSubmit={handleCreateOrder} className="space-y-12">
                  {formStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        {patients.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPatientId(p.id)}
                            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center gap-6 ${
                              selectedPatientId === p.id 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20' 
                                : 'bg-white border-slate-100 hover:border-blue-200 group'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedPatientId === p.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                              <User size={30} />
                            </div>
                            <div>
                              <p className={`font-black text-base ${selectedPatientId === p.id ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>MRN: {p.id.substring(0, 10)}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {formStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                      <div className="grid grid-cols-3 gap-10">
                        {/* Column 1: Core IDs */}
                        <div className="space-y-8">
                          <div>
                            <label className="input-label">Request Ref #</label>
                            <input type="text" className="modern-input" value={requestNumber} onChange={e => setRequestNumber(e.target.value)} placeholder="SYS-100234" />
                          </div>
                          <div>
                            <label className="input-label">Collection Location</label>
                            <div className="relative">
                              <select className="modern-input appearance-none pr-10" value={location} onChange={e => setLocation(e.target.value)}>
                                <option value="">Select Location</option>
                                {DUMMY_LOCATIONS.map(l => (
                                  <option key={l} value={l}>{l}</option>
                                ))}
                              </select>
                              <ChevronLeft className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-[270deg]" size={18} />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Practitioner & External Ref */}
                        <div className="space-y-8">
                          <div>
                            <label className="input-label">Ordering Practitioner *</label>
                            <div className="relative">
                              <select className="modern-input appearance-none pr-10" value={practitioner} onChange={e => setPractitioner(e.target.value)}>
                                <option value="">Select Practitioner</option>
                                {DUMMY_PRACTITIONERS.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                                <option value="External">External Physician...</option>
                              </select>
                              <ChevronLeft className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-[270deg]" size={18} />
                            </div>
                          </div>
                          <div>
                            <label className="input-label">External Hospital #</label>
                            <input type="text" className="modern-input" value={hospitalNumber} onChange={e => setHospitalNumber(e.target.value)} placeholder="HOSP-442" />
                          </div>
                        </div>

                        {/* Column 3: Logistics & Triage */}
                        <div className="space-y-8">
                          <div>
                            <label className="input-label">Priority Triage</label>
                            <select value={priority} onChange={e => setPriority(e.target.value as any)} className="modern-input">
                              <option value="Routine">Routine (P3)</option>
                              <option value="Urgent">Urgent (P2)</option>
                              <option value="STAT">STAT [CRITICAL] (P1)</option>
                            </select>
                          </div>
                          <div>
                            <label className="input-label">In-Flight Logistics</label>
                            <label className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 cursor-pointer transition-all hover:bg-slate-100 h-[60px]">
                              <input type="checkbox" checked={pregnant} onChange={e => setPregnant(e.target.checked)} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Pregnancy Scan</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 p-10 rounded-[2.5rem] space-y-8">
                        <div className="flex items-center gap-3">
                          <Clock className="text-amber-600" size={18} />
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-[4px]">Fasting & Metabolic Compliance</p>
                        </div>
                        <div className="grid grid-cols-3 gap-10">
                          <div>
                            <label className="input-label text-amber-900/40">Fasting State</label>
                            <div className="flex gap-2">
                              {['No', 'Yes', 'Unknown'].map(v => (
                                <button key={v} type="button" onClick={() => setFasting(v as any)} className={`flex-1 py-3 text-[10px] font-black rounded-xl border transition-all ${fasting === v ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50'}`}>{v}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="input-label text-amber-900/40">Fasting Time (HRS)</label>
                            <input type="text" className="modern-input !border-amber-200 focus:!border-amber-500" value={fastingTime} onChange={e => setFastingTime(e.target.value)} placeholder="e.g. 12" />
                          </div>
                          <div>
                            <label className="input-label text-amber-900/40">Last Medication Dose</label>
                            <input type="text" className="modern-input !border-amber-200 focus:!border-amber-500" value={lastDoseTime} onChange={e => setLastDoseTime(e.target.value)} placeholder="HH:MM" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="input-label">Clinical Details Summary</label>
                        <textarea 
                          rows={3} 
                          className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-sm outline-none focus:border-blue-500 transition-all font-medium italic text-slate-600 placeholder:text-slate-300" 
                          value={clinicalDetails}
                          onChange={e => setClinicalDetails(e.target.value)}
                          placeholder="Provide context for analytical interpretation (e.g., persistent malaise, suspected liver dysfunction)..."
                        />
                      </div>
                    </motion.div>
                  )}

                  {formStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                          <label className="text-[11px] font-black uppercase text-slate-500 tracking-[3px]">Analytical profile selection ({selectedTests.length})</label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {tests.map(t => (
                            <div
                              key={t.id}
                              className={`p-6 rounded-3xl border-2 text-left transition-all relative group ${
                                selectedTests.includes(t.id) 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/20' 
                                  : 'bg-white border-slate-100 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => toggleTest(t.id)}
                                >
                                  <p className="text-sm font-black tracking-tight leading-tight">{t.name}</p>
                                  <p className={`text-[10px] font-bold uppercase mt-1 opacity-60 tracking-widest`}>{t.category}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {selectedTests.includes(t.id) && <div className="p-1 bg-white/20 rounded-lg"><Check size={14} /></div>}
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setViewingTest(t); }}
                                    className={`p-2 rounded-xl transition-all ${selectedTests.includes(t.id) ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600'}`}
                                  >
                                    <Info size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="flex justify-between items-center bg-amber-50/50 p-4 rounded-2xl">
                          <label className="text-[11px] font-black uppercase text-amber-600 tracking-[3px]">Specimen Logistics Monitoring ({orderSpecimens.length})</label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          {['S - Serum', 'F - Faeces', 'U - Urine', 'W - Whole Blood', 'P - Plasma'].map(type => {
                            const current = orderSpecimens.find(s => s.type === type);
                            return (
                              <div key={type} className={`p-6 border-2 rounded-[2rem] transition-all flex items-center justify-between ${current ? (current.status === 'Received' ? 'bg-emerald-50 border-emerald-500/30' : 'bg-amber-50 border-amber-500/30 shadow-xl shadow-amber-500/5') : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
                                <div className="flex items-center gap-5">
                                  <div className={`p-3 rounded-2xl ${current ? (current.status === 'Received' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white') : 'bg-slate-200 text-slate-400'}`}>
                                    <Beaker size={20} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900 tracking-tight">{type}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${current ? (current.status === 'Received' ? 'text-emerald-600' : 'text-amber-600 animate-pulse') : 'text-slate-400'}`}>{current ? current.status : 'Awaiting Request'}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {!current ? (
                                    <button type="button" onClick={() => setOrderSpecimens([...orderSpecimens, { id: Math.random().toString(36).substr(2, 9), type, status: 'Expected' }])} className="p-3 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-600 transition-all text-slate-400 shadow-sm"><Plus size={20} /></button>
                                  ) : (
                                    <>
                                      {current.status === 'Expected' ? (
                                        <button type="button" onClick={() => setOrderSpecimens(orderSpecimens.map(s => s.type === type ? { ...s, status: 'Received' } : s))} className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">Check In</button>
                                      ) : (
                                        <button type="button" onClick={() => setOrderSpecimens(orderSpecimens.map(s => s.type === type ? { ...s, status: 'Expected' } : s))} className="px-6 py-2.5 bg-white border-2 border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">Revert</button>
                                      )}
                                      <button type="button" onClick={() => setOrderSpecimens(orderSpecimens.filter(s => s.type !== type))} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={18} /></button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>

              {/* Actions Area */}
              <div className="p-10 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
                <div className="flex gap-4">
                  {formStep > 1 && (
                    <button 
                      type="button" 
                      onClick={() => setFormStep(prev => prev - 1)}
                      className="px-8 py-4 bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-[3px] rounded-2xl transition-all flex items-center gap-3 hover:bg-slate-50 shadow-sm"
                    >
                      <ChevronLeft size={18} /> Prev Section
                    </button>
                  )}
                  <button type="button" className="px-8 py-4 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[3px] rounded-2xl transition-all hover:text-slate-600 shadow-sm" onClick={() => { setFormStep(1); setSelectedTests([]); setOrderSpecimens([]); setClinicalDetails(''); setFasting('No'); }}>Clear Form</button>
                </div>

                <div className="flex gap-4">
                  {formStep < 3 ? (
                    <button 
                      type="button" 
                      disabled={formStep === 1 && !selectedPatientId}
                      onClick={() => setFormStep(prev => prev + 1)}
                      className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[4px] rounded-2xl shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] transition-all flex items-center gap-4 disabled:opacity-50 disabled:shadow-none"
                    >
                      Next Phase <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleCreateOrder}
                      disabled={selectedTests.length === 0}
                      className="px-16 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-[4px] rounded-2xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all flex items-center gap-4 disabled:opacity-50"
                    >
                      Authorize Order <Send size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingTest && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-white/40 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[4px] opacity-50">Analytical Specification</p>
                      <h2 className="text-3xl font-black tracking-tight">{viewingTest.name}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">{viewingTest.category}</span>
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">{viewingTest.department}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingTest(null)}
                  className="absolute top-10 right-10 p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 space-y-12">
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Activity size={16} />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Normal Range Protocol</h4>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-black/[0.03]">
                      <p className="text-2xl font-black text-slate-900">{viewingTest.normalRange}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-2">{viewingTest.unit}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Zap size={16} />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Financial Authorization</h4>
                    </div>
                    <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-500/10">
                      <p className="text-2xl font-black text-emerald-900">RM {viewingTest.price?.toFixed(2)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-2">Standard Fee (MYR)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 border-b border-slate-50 pb-4">Standardized Nomenclature (LOINC/SNOMED)</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50/50 rounded-[2rem] flex items-center justify-between border border-black/[0.03]">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">LOINC CODE</p>
                        <p className="text-base font-black text-slate-900 font-mono tracking-tight">{viewingTest.loinc || 'UNASSIGNED'}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm">
                        <Milestone size={20} />
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50/50 rounded-[2rem] flex items-center justify-between border border-black/[0.03]">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">SNOMED RT-ID</p>
                        <p className="text-base font-black text-slate-900 font-mono tracking-tight">{viewingTest.snomed || 'UNMAPPED'}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm">
                        <Barcode size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="pl-4">
                      <p className="text-[9px] font-black text-slate-900 uppercase">System Integrity Checked</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Calibration: Valid</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingTest(null)}
                    className="px-12 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-[4px] rounded-2xl transition-all"
                  >
                    Dismiss Specification
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel !p-0 shadow-2xl relative"
            >
              <div className="glass-header !bg-white/40 flex justify-between items-center pr-4">
                <div className="flex bg-black/5 p-1 rounded-xl ml-4">
                  <button 
                    onClick={() => setModalTab('details')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'details' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Specifications
                  </button>
                  <button 
                    onClick={() => setModalTab('journey')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'journey' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Specimen Journey
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setViewingOrder(null);
                    setModalTab('details');
                  }}
                  className="p-1 hover:text-slate-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {modalTab === 'details' ? (
                  <>
                    {/* Patient Info Section */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-blue-600" />
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Subject Information</h3>
                        </div>
                        <button 
                          onClick={() => window.print()}
                          className="text-[9px] font-black uppercase text-blue-600 hover:underline"
                        >
                          Print Label Sheet
                        </button>
                      </div>
                      {(() => {
                        const patient = patients.find(p => p.id === viewingOrder.patientId);
                        return (
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 grid grid-cols-2 gap-4 bg-white/20 p-6 rounded-2xl border border-black/5">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</p>
                                <p className="text-sm font-black text-slate-800">{patient?.name || viewingOrder.patientName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Patient MRN</p>
                                <p className="text-[10px] font-mono text-slate-600">{viewingOrder.patientId}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gender / DOB</p>
                                <p className="text-xs font-semibold text-slate-600">{patient?.gender || 'N/A'} • {patient ? formatDate(patient.dob) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Clinic Reference</p>
                                <p className="text-xs font-semibold text-slate-600">{viewingOrder.hospitalNumber || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center justify-center">
                              <BarcodeLabel 
                                value={`SPC-${viewingOrder.id.substring(0, 8).toUpperCase()}`} 
                                patientName={patient?.name || 'Subject'} 
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </section>

                    {/* Metadata Section */}
                    <section className="bg-slate-50/50 p-6 rounded-[2rem] border border-black/5">
                      <div className="flex items-center gap-2 mb-6">
                        <Milestone size={16} className="text-blue-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Clinical Framework</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ordering Physician</p>
                          <p className="text-xs font-black text-slate-800">{viewingOrder.practitioner || viewingOrder.referringDoc || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Department / Location</p>
                          <p className="text-xs font-black text-slate-800">{viewingOrder.location || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Authorization Ref</p>
                          <p className="text-xs font-black text-slate-800">{viewingOrder.requestNumber || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-8 mt-6 pt-6 border-t border-black/5">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fasting State</p>
                          <p className="text-xs font-black text-amber-600">{viewingOrder.fasting || 'N/A'} {viewingOrder.fastingTime ? `(${viewingOrder.fastingTime} hrs)` : ''}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pregnant</p>
                          <p className="text-xs font-black text-slate-800">{viewingOrder.pregnant ? 'YES' : 'NO'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Priority Triage</p>
                          <p className={`text-xs font-black uppercase ${viewingOrder.priority === 'STAT' ? 'text-red-600 font-black' : viewingOrder.priority === 'Urgent' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {viewingOrder.priority || 'Routine'}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Clinical Details */}
                    {viewingOrder.clinicalDetails && (
                      <section className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                        <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Clinical Context</p>
                        <p className="text-xs italic text-slate-600 line-clamp-3">{viewingOrder.clinicalDetails}</p>
                      </section>
                    )}

                    {/* Tests Section */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-blue-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Included Diagnostics</h3>
                      </div>
                      <div className="space-y-3">
                        {viewingOrder.testIds?.map((tId, idx) => {
                          const test = tests.find(t => t.id === tId);
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-xl transition-all hover:border-blue-200">
                              <div>
                                <p className="text-xs font-black text-slate-800">{test?.name || 'Unknown Panel'}</p>
                                <p className={`text-[9px] font-bold uppercase ${test?.category === 'STAT' ? 'text-red-500' : 'text-slate-400'}`}>{test?.category || 'General'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-mono text-slate-500">{test?.normalRange ? `Ref: ${test.normalRange}` : ''}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400">{test?.unit || ''}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </>
                ) : (
                  <SpecimenJourney status={viewingOrder.status} createdAt={viewingOrder.createdAt} />
                )}

                <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black border border-black/5">AT</div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 uppercase">Authorized By</p>
                      <p className="text-[10px] text-slate-500">Dr. Aris Thorne</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setViewingOrder(null);
                      setModalTab('details');
                    }}
                    className="glass-button px-8"
                  >
                    Close Protocol
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrderManager;
