
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { EmployeeSalaryData } from '../types';

const drawPayslip = (doc: jsPDF, employee: EmployeeSalaryData, logo?: string) => {
  const blueColor = [41, 128, 185];
  const orangeColor = [230, 126, 34];
  const footerColor = [231, 76, 60];

  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 140);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('MARUTHI HR SOLUTION', 105, 20, { align: 'center' });

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 12, 12, 20, 14, undefined, 'FAST');
      doc.addImage(logo, 'PNG', 178, 12, 20, 14, undefined, 'FAST');
    } catch (e) {
      console.error("Logo error", e);
    }
  }

  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.line(10, 28, 200, 28);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  
  // Dynamic Principal Employer Name
  doc.text(`Principal Employer: ${employee.principalEmployer || 'HEALTHY FOOD PRODUCTS'}`, 15, 34);
  doc.text(`Date: ${employee.displayDate}`, 195, 34, { align: 'right' });
  
  doc.line(10, 38, 200, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  
  const drawGridRow = (y: number, label1: string, val1: string, label2: string, val2: string) => {
    doc.line(10, y, 200, y);
    doc.text(label1, 20, y + 4);
    doc.text(val1, 80, y + 4, { align: 'center' });
    doc.text(label2, 130, y + 4);
    doc.text(val2, 185, y + 4, { align: 'right' });
    doc.line(45, y, 45, y + 6);
    doc.line(115, y, 115, y + 6);
    doc.line(155, y, 155, y + 6);
  };

  drawGridRow(38, 'Employee ID:', employee.id, 'Month:', `${employee.month}-${employee.year}`);
  drawGridRow(44, 'Employee Name:', employee.name, 'Worked Days:', employee.workedDays.toFixed(1));
  drawGridRow(50, 'ESI No:', employee.esiNo, 'OT Hours:', employee.otHours.toFixed(1));
  drawGridRow(56, 'UAN No:', employee.uanNo, 'Fixed Gross:', employee.fixedGross.toLocaleString(undefined, { minimumFractionDigits: 1 }));
  doc.line(10, 62, 200, 62);

  autoTable(doc, {
    startY: 68,
    margin: { left: 10, right: 10 },
    head: [['Description', 'Components', 'Description', 'Deduction Amount']],
    body: [
      ['Basic & DA', employee.basicDA.toLocaleString(undefined, { minimumFractionDigits: 1 }), 'ESI @ 0.75%', employee.esiDeduction.toLocaleString(undefined, { minimumFractionDigits: 1 })],
      ['Bonus', employee.bonus.toLocaleString(undefined, { minimumFractionDigits: 1 }), 'PF @ 12%', employee.pfDeduction.toLocaleString(undefined, { minimumFractionDigits: 1 })],
      ['OT Amount', employee.otAmount.toLocaleString(undefined, { minimumFractionDigits: 1 }), 'PT', employee.ptDeduction > 0 ? employee.ptDeduction.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '-'],
      ['Arrears', employee.arrears > 0 ? employee.arrears.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '-', 'LWF', employee.lwfDeduction.toLocaleString(undefined, { minimumFractionDigits: 1 })],
      ['Attendance Bonus', employee.attendanceBonus > 0 ? employee.attendanceBonus.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '-', 'Other Deduction', employee.otherDeduction > 0 ? employee.otherDeduction.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '-'],
      ['', '', 'Canteen', employee.canteenDeduction.toLocaleString(undefined, { minimumFractionDigits: 1 })]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: blueColor, fontStyle: 'bold', fontSize: 9, lineWidth: 0.1, lineColor: blueColor },
    styles: { fontSize: 8, cellPadding: 1, textColor: 0, lineWidth: 0.1, lineColor: blueColor },
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const lastTable = (doc as any).lastAutoTable;
  const totalY = (lastTable ? lastTable.finalY : 120) + 4;
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, totalY, 200, totalY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  
  doc.text('Total Earned Gross', 15, totalY + 6);
  doc.text(employee.grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 1 }), 110, totalY + 6, { align: 'right' });
  doc.text('Total Deductions', 115, totalY + 6);
  doc.text(employee.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 1 }), 195, totalY + 6, { align: 'right' });
  doc.line(10, totalY + 8, 200, totalY + 8);
  
  doc.text('Total Net Pay', 15, totalY + 12);
  doc.text(employee.netSalary.toLocaleString(undefined, { minimumFractionDigits: 1 }), 110, totalY + 12, { align: 'right' });
  doc.line(10, totalY + 14, 200, totalY + 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(footerColor[0], footerColor[1], footerColor[2]);
  doc.text('This is Computer Generated Document. No Signature Required.', 105, totalY + 22, { align: 'center' });
};

export const generateSinglePayslip = (employee: EmployeeSalaryData, logo?: string, save: boolean = true) => {
  const doc = new jsPDF('l', 'mm', 'a5');
  drawPayslip(doc, employee, logo);
  if (save) {
    doc.save(`Payslip_${employee.id}.pdf`);
  }
  return doc;
};

export const generateBulkPayslips = (employees: EmployeeSalaryData[], logo?: string) => {
  if (employees.length === 0) return;
  const doc = new jsPDF('l', 'mm', 'a5');
  employees.forEach((emp, i) => {
    if (i > 0) doc.addPage();
    drawPayslip(doc, emp, logo);
  });
  doc.save(`Bulk_Payslips_${Date.now()}.pdf`);
};

export const generateIndividualZippedPayslips = async (employees: EmployeeSalaryData[], logo?: string) => {
  if (employees.length === 0) return;
  const zip = new JSZip();
  const folderName = `Payslips_${Date.now()}`;
  const folder = zip.folder(folderName);
  if (!folder) return;

  employees.forEach((emp) => {
    const doc = new jsPDF('l', 'mm', 'a5');
    drawPayslip(doc, emp, logo);
    const pdfBlob = doc.output('blob');
    const safeName = emp.name.replace(/[^a-z0-9]/gi, '_').toUpperCase();
    folder.file(`Payslip_${emp.id}_${safeName}.pdf`, pdfBlob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${folderName}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
};
