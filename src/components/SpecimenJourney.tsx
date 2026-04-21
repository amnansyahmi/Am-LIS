import React from 'react';
import { 
  ClipboardList, 
  Truck, 
  LogIn, 
  FlaskConical, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { OrderStatus } from '../types';

interface Step {
  id: string;
  label: string;
  icon: any;
  status: 'completed' | 'active' | 'pending';
  desc: string;
}

const SpecimenJourney: React.FC<{ status: OrderStatus; createdAt: string }> = ({ status, createdAt }) => {
  const steps: Step[] = [
    { 
      id: 'Request', 
      label: 'Order Entry', 
      icon: ClipboardList, 
      status: 'completed',
      desc: `Authorized at ${new Date(createdAt).toLocaleTimeString()}` 
    },
    { 
      id: 'Collected', 
      label: 'Specimen Collection', 
      icon: Truck, 
      status: (status === 'Pending') ? 'active' : 'completed',
      desc: status === 'Pending' ? 'Specimen not yet marked' : 'Specimen verified'
    },
    { 
      id: 'In-Progress', 
      label: 'Analytical Phase', 
      icon: FlaskConical, 
      status: (status === 'Collected') ? 'active' : (status === 'In-Progress' || status === 'Completed') ? 'completed' : 'pending',
      desc: 'Machine interface active'
    },
    { 
      id: 'Validate', 
      label: 'Clinical Validation', 
      icon: CheckCircle2, 
      status: (status === 'In-Progress') ? 'active' : (status === 'Completed') ? 'completed' : 'pending',
      desc: 'Pathologist review queue'
    },
    { 
      id: 'Completed', 
      label: 'Report Released', 
      icon: FileText, 
      status: (status === 'Completed') ? 'completed' : 'pending',
      desc: 'HL7 & PDF transmission'
    },
  ];

  return (
    <div className="relative mt-8">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
      <div className="space-y-10 relative">
        {steps.map((s, i) => (
          <div key={s.id} className="flex gap-6 items-start">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
              s.status === 'completed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' :
              s.status === 'active' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 animate-pulse' :
              'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              <s.icon size={22} />
            </div>
            <div className="pt-1.5 flex-1">
              <div className="flex justify-between items-center">
                <h4 className={`text-sm font-black uppercase tracking-widest ${s.status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>{s.label}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  s.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  s.status === 'active' ? 'bg-blue-50 text-blue-600' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecimenJourney;
