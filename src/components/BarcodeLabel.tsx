import React from 'react';

interface BarcodeLabelProps {
  value: string;
  patientName: string;
}

const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ value, patientName }) => {
  // Simple deterministic barcode generation using SVG lines
  const generateBarcodeLines = (str: string) => {
    const lines = [];
    let x = 0;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const binary = charCode.toString(2).padStart(8, '0');
      for (const bit of binary) {
        if (bit === '1') {
          lines.push(<rect key={`${i}-${x}`} x={x} y={0} width={1.5} height={40} fill="black" />);
        }
        x += 2.5;
      }
    }
    return { lines, width: x };
  };

  const { lines, width } = generateBarcodeLines(value);

  return (
    <div className="bg-white border-2 border-slate-900 p-4 w-fit rounded-sm shadow-sm flex flex-col items-center">
      <div className="flex justify-between w-full mb-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-slate-400">Specimen ID</span>
          <span className="text-sm font-black text-slate-900">{value}</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black uppercase text-slate-400">Subject</span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{patientName}</span>
        </div>
      </div>
      
      <div className="bg-white p-2">
        <svg height="40" width={width} viewBox={`0 0 ${width} 40`} className="overflow-visible">
          {lines}
        </svg>
      </div>
      
      <p className="mt-2 text-[10px] font-mono tracking-[4px] text-slate-900 font-bold">*{value.toUpperCase()}*</p>
    </div>
  );
};

export default BarcodeLabel;
