import React, { useState } from 'react';
import { FileText, Download, Printer, AlertTriangle, TrendingUp, DollarSign, Calculator, Users, User, FileSpreadsheet } from 'lucide-react';
import { Employee, AttendanceRecord, ISRTable, Holiday } from '../types';
import { PayrollService } from '../services/payrollService';
import { ReportService } from '../services/reportService';
import { formatCurrency, cn, formatHours } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  employees: Employee[];
  records: AttendanceRecord[];
  isrTables: ISRTable[];
  holidays: Holiday[];
}

export default function PayrollReportGenerator({ employees, records, isrTables, holidays }: Props) {
  const [period, setPeriod] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [paymentBasis, setPaymentBasis] = useState<'regimen' | 'weekly' | 'hourly' | 'daily'>('regimen');

  const reports = employees.map(emp => {
    const table = isrTables.find(t => `${t.year}-${t.type}` === selectedTableId) || isrTables[0];
    const employeeRecords = records.filter(r => r.employeeId === emp.id && r.date >= period.start && r.date <= period.end);
    return PayrollService.generateReport(emp, employeeRecords, table, paymentBasis);
  });

  const totalGross = reports.reduce((acc, r) => acc + r.grossSalary, 0);
  const totalNet = reports.reduce((acc, r) => acc + r.netSalary, 0);
  const totalISR = reports.reduce((acc, r) => acc + r.isr, 0);

  const exportToExcel = () => {
    const data = reports.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return {
        'Empleado': emp?.name,
        'Código': emp?.code,
        'Régimen': emp?.paymentRegimen,
        'Días Trabajados': r.totalDaysWorked,
        'Horas Trabajadas': r.totalHoursWorked,
        'Sueldo Base': r.baseSalary,
        'Pago Extras': r.overtimePay,
        'Descanso Trabajado': r.restDayPay,
        'Prima Dominical': r.sundayPremium,
        'Sueldo Bruto': r.grossSalary,
        'ISR Retenido': r.isr,
        'Sueldo Neto': r.netSalary,
        'Observaciones': r.observations
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nómina");
    XLSX.writeFile(wb, `Nomina_${period.start}_${period.end}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Reporte General de Nómina", 14, 22);
    doc.setFontSize(10);
    doc.text(`Periodo: ${period.start} al ${period.end}`, 14, 30);
    
    const tableData = reports.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return [
        emp?.name || '',
        emp?.paymentRegimen || '',
        r.totalDaysWorked.toString(),
        formatHours(r.totalHoursWorked),
        formatCurrency(r.baseSalary),
        formatCurrency(r.overtimePay),
        formatCurrency(r.restDayPay + r.sundayPremium),
        formatCurrency(r.grossSalary),
        formatCurrency(r.isr),
        formatCurrency(r.netSalary)
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Empleado', 'Régimen', 'Días', 'Horas', 'Base', 'Extras', 'Primas', 'Bruto', 'ISR', 'Neto']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 7 }
    });

    doc.save(`Nomina_${period.start}_${period.end}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Cálculo de Nómina</h2>
          <p className="text-gray-500 text-sm font-medium">Pre-visualización de pagos, ISR y horas extras.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-3 bg-corporate-900 p-1.5 rounded-2xl border border-corporate-800 shadow-xl">
            <input 
              type="date" 
              className="dark-input border-none bg-transparent text-xs"
              value={period.start}
              onChange={e => setPeriod({ ...period, start: e.target.value })}
            />
            <div className="flex items-center text-gray-600 font-black">→</div>
            <input 
              type="date" 
              className="dark-input border-none bg-transparent text-xs"
              value={period.end}
              onChange={e => setPeriod({ ...period, end: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="dark-button-secondary py-2 px-4 text-xs">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button onClick={exportToPDF} className="dark-button-primary py-2 px-4 text-xs">
              <Download className="w-4 h-4" />
              PDF General
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="dark-card p-6 border-l-4 border-l-blue-corporate">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-4 h-4 text-blue-corporate" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Bruto</span>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalGross)}</p>
        </div>
        <div className="dark-card p-6 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Retención ISR</span>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalISR)}</p>
        </div>
        <div className="dark-card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Neto</span>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalNet)}</p>
        </div>
        <div className="dark-card p-6">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tabla ISR</label>
          <select 
            className="dark-input w-full text-xs"
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {isrTables.map(table => (
              <option key={`${table.year}-${table.type}`} value={`${table.year}-${table.type}`}>
                {table.year} - {table.type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="dark-card p-6">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Base de Pago</label>
          <select 
            className="dark-input w-full text-xs"
            value={paymentBasis}
            onChange={(e) => setPaymentBasis(e.target.value as any)}
          >
            <option value="regimen">Según Régimen</option>
            <option value="weekly">Semanal Fijo</option>
            <option value="daily">Por Día Laborado</option>
            <option value="hourly">Por Hora Laborada</option>
          </select>
        </div>
      </div>

      <div className="dark-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-corporate-900/50 border-b border-corporate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Colaborador</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Días/Horas</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Sueldo Base</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Extras</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Primas/Desc</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">ISR</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Neto Estimado*</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-corporate-800/50">
              {reports.map(report => {
                const employee = employees.find(e => e.id === report.employeeId);
                const table = isrTables.find(t => `${t.year}-${t.type}` === selectedTableId) || isrTables[0];
                const employeeRecords = records.filter(r => r.employeeId === report.employeeId && r.date >= period.start && r.date <= period.end);

                return (
                  <tr key={report.employeeId} className="hover:bg-corporate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-white tracking-tight">{employee?.name}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{employee?.paymentRegimen}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-white">{report.totalDaysWorked} días</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{formatHours(report.totalHoursWorked)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-white">{formatCurrency(report.baseSalary)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-green-500">+{formatCurrency(report.overtimePay)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-blue-corporate">+{formatCurrency(report.restDayPay + report.sundayPremium)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-red-500">-{formatCurrency(report.isr)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="bg-blue-corporate/10 border border-blue-corporate/20 rounded-lg px-3 py-1 inline-block">
                        <span className="text-sm font-black text-blue-corporate">{formatCurrency(report.netSalary)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            if (employee) {
                              ReportService.generateIndividualPDF(employee, employeeRecords, table);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-corporate-800 rounded-xl transition-all" 
                          title="Descargar PDF Individual"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-corporate/5 border border-blue-corporate/20 rounded-2xl p-6 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-blue-corporate flex-shrink-0 mt-1" />
        <div>
          <p className="text-sm font-black text-blue-corporate uppercase tracking-widest mb-1">Nota Importante</p>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            Los cálculos presentados son estimaciones informativas basadas en el Salario Base de Cotización (SBC) y las tablas ISR vigentes. 
            Este reporte no constituye un recibo de nómina oficial ni garantiza el pago neto final, el cual puede variar según deducciones adicionales, 
            prestaciones de ley o políticas internas de la empresa.
          </p>
        </div>
      </div>
    </div>
  );
}
