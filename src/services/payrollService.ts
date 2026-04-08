import { ISRTable, ISRRow, PayrollReport, Employee, AttendanceRecord, PaymentRegimen } from '../types';
import { formatCurrency, formatHours } from '../lib/utils';

export class PayrollService {
  /**
   * Calculates ISR based on a given table and gross salary.
   */
  static calculateISR(grossSalary: number, table: ISRTable): number {
    if (!table || !table.rows || table.rows.length === 0) return 0;

    // Find the row where grossSalary is between lowerLimit and upperLimit
    const row = table.rows.find(
      (r) => grossSalary >= r.lowerLimit && (grossSalary <= r.upperLimit || r.upperLimit === 0)
    );

    if (!row) {
      // If not found, check if it exceeds the last row's upper limit
      const lastRow = table.rows[table.rows.length - 1];
      if (grossSalary >= lastRow.lowerLimit) {
        const excess = grossSalary - lastRow.lowerLimit;
        const taxOnExcess = excess * (lastRow.rate / 100);
        return lastRow.fixedFee + taxOnExcess;
      }
      return 0;
    }

    const excess = grossSalary - row.lowerLimit;
    const taxOnExcess = excess * (row.rate / 100);
    return row.fixedFee + taxOnExcess;
  }

  /**
   * Calculates overtime pay based on Mexican labor law (LFT).
   * First 9 hours are double, subsequent are triple.
   */
  static calculateOvertimePay(hourlyRate: number, overtimeHours: number): { double: number; triple: number; total: number } {
    const doubleHours = Math.min(overtimeHours, 9);
    const tripleHours = Math.max(0, overtimeHours - 9);

    const doublePay = doubleHours * (hourlyRate * 2);
    const triplePay = tripleHours * (hourlyRate * 3);

    return {
      double: doublePay,
      triple: triplePay,
      total: doublePay + triplePay,
    };
  }

  /**
   * Calculates vacation premium (Prima Vacacional).
   * Usually 25% of the salary for the vacation days.
   */
  static calculateVacationPremium(dailySalary: number, vacationDays: number, percentage: number = 0.25): number {
    return (dailySalary * vacationDays) * percentage;
  }

  /**
   * Generates a comprehensive payroll report for an employee.
   */
  static generateReport(
    employee: Employee,
    records: AttendanceRecord[],
    isrTable: ISRTable,
    paymentBasis: 'regimen' | 'weekly' | 'hourly' | 'daily' = 'regimen'
  ): PayrollReport {
    const dailySalary = employee.sbc;
    const hourlyRate = dailySalary / 8; // Assuming 8h standard day for calculation

    let totalHoursWorked = 0;
    let totalOvertimeHours = 0;
    let totalDeficitHours = 0;
    let totalDaysWorked = 0;
    let restDayPay = 0;
    let sundayPremium = 0;

    records.forEach(record => {
      if (record.hoursWorked > 0) {
        totalDaysWorked++;
        
        // Sunday Premium (25% of daily salary)
        if (record.isSundayWorked) {
          sundayPremium += dailySalary * 0.25;
        }

        // Rest Day Worked (200% extra, total 300%)
        if (record.isRestDayWorked) {
          restDayPay += dailySalary * 2;
        }
      }
      totalHoursWorked += record.hoursWorked;
      totalOvertimeHours += record.overtime;
      totalDeficitHours += record.deficit;
    });

    // Calculate base salary based on selected basis
    let baseSalary = 0;
    const daysInPeriod = records.length;

    const effectiveBasis = paymentBasis === 'regimen' ? employee.paymentRegimen : paymentBasis;

    switch (effectiveBasis) {
      case PaymentRegimen.HOURLY:
      case 'hourly':
        baseSalary = totalHoursWorked * hourlyRate;
        break;
      case PaymentRegimen.DAILY:
      case 'daily':
        baseSalary = totalDaysWorked * dailySalary;
        break;
      case PaymentRegimen.WEEKLY:
      case 'weekly':
        // If weekly, we assume a standard week pay if they worked at least some days
        baseSalary = dailySalary * 7;
        break;
      case PaymentRegimen.BIWEEKLY:
        baseSalary = dailySalary * 14;
        break;
      case PaymentRegimen.SEMI_MONTHLY:
        baseSalary = dailySalary * 15;
        break;
      case PaymentRegimen.MONTHLY:
        baseSalary = dailySalary * 30;
        break;
      default:
        baseSalary = totalDaysWorked * dailySalary;
    }

    // Handle permissions: subtract from overtime
    const netOvertime = Math.max(0, totalOvertimeHours - employee.permissionsHours);
    const overtimePay = this.calculateOvertimePay(hourlyRate, netOvertime);

    const grossSalary = baseSalary + overtimePay.total + restDayPay + sundayPremium;
    const isr = this.calculateISR(grossSalary, isrTable);
    const netSalary = grossSalary - isr;

    // Observations generation
    let observations = `El empleado ${employee.name} trabajó un total de ${formatHours(totalHoursWorked)} en ${totalDaysWorked} días. 
    Base de cálculo: ${effectiveBasis}. `;
    
    if (netOvertime > 0) {
      observations += `Se registraron ${formatHours(netOvertime)} horas extras pagadas. `;
    }
    if (restDayPay > 0) {
      observations += `Se incluyó pago por descanso trabajado. `;
    }
    if (sundayPremium > 0) {
      observations += `Se incluyó prima dominical. `;
    }
    if (totalDeficitHours > 0) {
      observations += `Existe un adeudo de ${formatHours(totalDeficitHours)} horas por cubrir. `;
    }

    observations += `\n\nNOTA IMPORTANTE: La información y cálculos de ISR y pagos no son los finales, ya que dependerá del colaborador si no tiene algún otro servicio o deducción vigente que merme su sueldo neto al final del pago.`;

    return {
      employeeId: employee.id,
      period: isrTable.type,
      totalDaysWorked,
      totalHoursWorked,
      totalOvertimeHours: netOvertime,
      totalDeficitHours,
      baseSalary,
      overtimePay: overtimePay.total,
      restDayPay,
      sundayPremium,
      grossSalary,
      isr,
      vacationPremium: 0, // Calculated separately when vacations are taken
      netSalary,
      observations,
    };
  }
}
