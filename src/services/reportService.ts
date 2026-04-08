import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Employee, AttendanceRecord, PayrollReport, ISRTable } from '../types';
import { PayrollService } from './payrollService';
import { formatCurrency, formatHours } from '../lib/utils';

export class ReportService {
  /**
   * Generates a professional PDF report for an individual employee.
   */
  static generateIndividualPDF(
    employee: Employee,
    records: AttendanceRecord[],
    isrTable: ISRTable
  ) {
    const doc = new jsPDF() as any;
    const report = PayrollService.generateReport(employee, records, isrTable);

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('REPORTE EJECUTIVO DE ASISTENCIA Y NÓMINA', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Empleado: ${employee.name} (${employee.code})`, 20, 40);
    doc.text(`Periodo: ${isrTable.type.toUpperCase()} - Año: ${isrTable.year}`, 20, 48);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, 56);

    // Summary Table
    const summaryData = [
      ['Días Trabajados', report.totalDaysWorked.toString()],
      ['Horas Totales', formatHours(report.totalHoursWorked)],
      ['Horas Extras', formatHours(report.totalOvertimeHours)],
      ['Adeudo de Horas', formatHours(report.totalDeficitHours)],
      ['Salario Base', formatCurrency(report.baseSalary)],
      ['Pago de Extras', formatCurrency(report.overtimePay)],
      ['Descanso Trabajado', formatCurrency(report.restDayPay)],
      ['Prima Dominical', formatCurrency(report.sundayPremium)],
      ['Salario Bruto', formatCurrency(report.grossSalary)],
      ['ISR Retenido', formatCurrency(report.isr)],
      ['Salario Neto', formatCurrency(report.netSalary)],
    ];

    doc.autoTable({
      startY: 70,
      head: [['Concepto', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Observations
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(14);
    doc.text('OBSERVACIONES Y CONCLUSIONES', 20, finalY + 20);
    
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(report.observations, 170);
    doc.text(splitText, 20, finalY + 30);

    // Footer
    doc.setFontSize(10);
    doc.text('__________________________', 105, 270, { align: 'center' });
    doc.text('Firma Autorizada', 105, 275, { align: 'center' });

    doc.save(`Reporte_${employee.code}_${new Date().getTime()}.pdf`);
  }

  /**
   * Exports attendance data to Excel.
   */
  static exportToExcel(employees: Employee[], records: AttendanceRecord[]) {
    const data = records.map(record => {
      const employee = employees.find(e => e.id === record.employeeId);
      return {
        'Código': employee?.code,
        'Nombre': employee?.name,
        'Fecha': record.date,
        'Entrada': record.checkIn || 'N/A',
        'Salida': record.checkOut || 'N/A',
        'Horas Trabajadas': record.hoursWorked,
        'Horas Extras': record.overtime,
        'Adeudo': record.deficit,
        'Incidencia': record.incidenceType || 'Ninguna',
        'Notas': record.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');
    XLSX.writeFile(workbook, `Reporte_Asistencia_${new Date().getTime()}.xlsx`);
  }

  /**
   * Imports attendance data from Excel.
   */
  static async importFromExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
