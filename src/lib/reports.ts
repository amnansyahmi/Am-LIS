import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Order, Result } from '../types';
import { formatDate } from './utils';

export const generateReport = (patient: Patient, order: Order, results: Result[]) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text('LABFLOW DIAGNOSTIC CENTER', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Official Laboratory Report | ISO Certified 9001:2015', 105, 28, { align: 'center' });

  // Patient Info Box
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, 35, 182, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', 20, 42);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, 20, 48);
  doc.text(`Age/Sex: ${new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / ${patient.gender}`, 20, 54);
  doc.text(`Patient ID: ${patient.id.substring(0, 8).toUpperCase()}`, 20, 60);
  
  doc.text(`Order ID: ${order.id.substring(0, 8).toUpperCase()}`, 130, 48);
  doc.text(`Date: ${formatDate(order.createdAt)}`, 130, 54);
  doc.text(`Status: ${order.status}`, 130, 60);

  // Results Table
  const tableData = results.map(r => [
    r.testName || 'Test',
    r.value,
    r.flag === 'Normal' ? 'Normal' : `[!] ${r.flag}`,
    'See Reference'
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Test Description', 'Result Value', 'Flag', 'Reference Range']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
    columnStyles: {
      1: { fontStyle: 'bold' }
    }
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated report and does not require a physical signature.', 105, pageHeight - 20, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, pageHeight - 15, { align: 'center' });

  doc.save(`LabReport_${patient.name.replace(/\s+/g, '_')}_${order.id.substring(0, 5)}.pdf`);
};
