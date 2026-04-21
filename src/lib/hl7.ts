/**
 * Lightweight HL7 V2.x Parser for Clinical Results
 * Supports MSH, PID, OBR, and OBX segments
 */

export interface HL7Result {
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  flag: string;
  timestamp: string;
}

export interface HL7Message {
  messageId: string;
  patientId: string;
  orderId: string;
  results: HL7Result[];
  raw: string;
}

export const parseORU = (rawMessage: string): HL7Message => {
  const lines = rawMessage.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const segments: Record<string, string[]> = {};
  const obxSegments: string[][] = [];

  lines.forEach(line => {
    const parts = line.split('|');
    const segmentName = parts[0];
    if (segmentName === 'OBX') {
      obxSegments.push(parts);
    } else {
      segments[segmentName] = parts;
    }
  });

  const msh = segments['MSH'] || [];
  const pid = segments['PID'] || [];
  const obr = segments['OBR'] || [];

  return {
    messageId: msh[9] || 'UNKNOWN',
    patientId: pid[3] || 'UNKNOWN',
    orderId: obr[2] || 'UNKNOWN', // Placer Order Number
    raw: rawMessage,
    results: obxSegments.map(parts => ({
      testCode: parts[3]?.split('^')[0] || '',
      testName: parts[3]?.split('^')[1] || '',
      value: parts[5] || '',
      unit: parts[6] || '',
      flag: parts[8] || 'N',
      timestamp: parts[14] || new Date().toISOString()
    }))
  };
};

export const generateSampleHL7 = (orderId: string, patientId: string): string => {
  const now = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
  return [
    `MSH|^~\\&|SYSMEX|LAB|DELPHIC|HOSP|${now}||ORU^R01|MSG${Math.floor(Math.random()*10000)}|P|2.3`,
    `PID|1||${patientId}||DOE^JOHN||19800101|M`,
    `OBR|1|${orderId}|${orderId}|CBC^COMPLETE BLOOD COUNT|||202310241200|||||||||DR^THORNE`,
    `OBX|1|NM|WBC^White Blood Cell|1|7.5|10*3/uL|4.0-11.0|N|||F|||${now}`,
    `OBX|2|NM|HGB^Hemoglobin|1|14.2|g/dL|13.5-17.5|N|||F|||${now}`,
    `OBX|3|NM|PLT^Platelets|1|250|10*3/uL|150-450|N|||F|||${now}`
  ].join('\n');
};
