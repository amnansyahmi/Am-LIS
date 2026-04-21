import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

const testCatalog = [
  { name: 'Complete Blood Count (CBC)', category: 'Hematology', department: 'Haematology', normalRange: 'Various', unit: 'cells/mcL', price: 45 },
  { name: 'Lipid Panel', category: 'Biochemistry', department: 'Biochemistry', normalRange: 'HDL > 40, LDL < 130', unit: 'mg/dL', price: 65 },
  { name: 'Basic Metabolic Panel (BMP)', category: 'Biochemistry', department: 'Biochemistry', normalRange: 'Various', unit: 'mg/dL', price: 55 },
  { name: 'Liver Function Test (LFT)', category: 'Biochemistry', department: 'Biochemistry', normalRange: 'Various', unit: 'U/L', price: 75 },
  { name: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology', department: 'Biochemistry', normalRange: '0.4 - 4.0', unit: 'mIU/L', price: 85 },
  { name: 'Hemoglobin A1c', category: 'Endocrinology', department: 'Biochemistry', normalRange: '< 5.7%', unit: '%', price: 50 },
  { name: 'Urinalysis', category: 'Microscopy', department: 'Haematology', normalRange: 'Normal', unit: 'N/A', price: 30 },
  { name: 'C-Reactive Protein (CRP)', category: 'Immunology', department: 'Immunology', normalRange: '< 3.0', unit: 'mg/L', price: 40 },
  { name: 'Viral Load (HIV/HCV)', category: 'Molecular', department: 'Molecular', normalRange: 'Undetectable', unit: 'copies/mL', price: 120 },
];

const dummyPatients = [
  { name: 'John Doe', dob: '1985-05-15', gender: 'Male', contact: '555-0101', address: '123 Maple St, Springfield' },
  { name: 'Jane Smith', dob: '1992-08-22', gender: 'Female', contact: '555-0102', address: '456 Oak Ave, Riverdale' },
  { name: 'Robert Johnson', dob: '1978-11-30', gender: 'Male', contact: '555-0103', address: '789 Pine Rd, Lakeshore' },
  { name: 'Emily Brown', dob: '2001-03-12', gender: 'Female', contact: '555-0104', address: '101 Cedar Ln, Hilltop' },
  { name: 'Michael Wilson', dob: '1965-12-05', gender: 'Male', contact: '555-0105', address: '202 Birch Blvd, Parkview' },
];

export const seedDatabase = async () => {
  try {
    console.log('Starting Seeding...');
    
    // 1. Seed Tests
    const testsSnap = await getDocs(collection(db, 'tests'));
    if (testsSnap.empty) {
      console.log('Seeding tests...');
      for (const test of testCatalog) {
        await addDoc(collection(db, 'tests'), test);
      }
    }

    // 2. Seed Patients
    const patientsSnap = await getDocs(collection(db, 'patients'));
    if (patientsSnap.empty) {
      console.log('Seeding patients...');
      for (const p of dummyPatients) {
        await addDoc(collection(db, 'patients'), {
          ...p,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Optional: Seed some initial orders for the dashboard visibility
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty) {
      const refreshedPatients = await getDocs(collection(db, 'patients'));
      const refreshedTests = await getDocs(collection(db, 'tests'));
      const patients = refreshedPatients.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const tests = refreshedTests.docs.map(d => ({ id: d.id, ...d.data() } as any));

      console.log('Seeding initial orders...');
      for (let i = 0; i < 5; i++) {
        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        const randomTest = tests[Math.floor(Math.random() * tests.length)];
        
        const orderRef = await addDoc(collection(db, 'orders'), {
          patientId: randomPatient.id,
          patientName: randomPatient.name,
          status: 'In-Progress',
          orderedBy: 'dev-mode',
          department: randomTest.department,
          createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          testIds: [randomTest.id]
        });

        await addDoc(collection(db, 'results'), {
          orderId: orderRef.id,
          testId: randomTest.id,
          testName: randomTest.name,
          value: '',
          flag: 'Normal',
          technicianId: '',
          updatedAt: new Date().toISOString()
        });
      }
    }

    console.log('Seeding Complete!');
    return true;
  } catch (err) {
    console.error('Seeding failed:', err);
    return false;
  }
};
