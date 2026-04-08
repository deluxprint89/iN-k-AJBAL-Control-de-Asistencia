import { addDays, differenceInYears, format, getYear, isSameDay, startOfYear, endOfYear, eachDayOfInterval, isWeekend } from 'date-fns';
import { Employee, Holiday, ShiftType, WorkDays } from '../types';

export class CalendarService {
  /**
   * Returns Mexican federal holidays for a given year.
   * Note: In a real app, this could be fetched from an API.
   */
  static getFederalHolidays(year: number): Holiday[] {
    return [
      { date: `${year}-01-01`, name: 'Año Nuevo', isFederal: true },
      { date: `${year}-02-05`, name: 'Día de la Constitución', isFederal: true },
      { date: `${year}-03-21`, name: 'Natalicio de Benito Juárez', isFederal: true },
      { date: `${year}-05-01`, name: 'Día del Trabajo', isFederal: true },
      { date: `${year}-09-16`, name: 'Día de la Independencia', isFederal: true },
      { date: `${year}-11-20`, name: 'Día de la Revolución', isFederal: true },
      { date: `${year}-12-01`, name: 'Transmisión del Poder Ejecutivo Federal', isFederal: true },
      { date: `${year}-12-25`, name: 'Navidad', isFederal: true },
    ];
  }

  /**
   * Calculates vacation days based on seniority (Mexican LFT).
   */
  static getEntitledVacationDays(seniorityYears: number): number {
    if (seniorityYears < 1) return 0;
    if (seniorityYears === 1) return 12;
    if (seniorityYears === 2) return 14;
    if (seniorityYears === 3) return 16;
    if (seniorityYears === 4) return 18;
    if (seniorityYears === 5) return 20;
    if (seniorityYears >= 6 && seniorityYears <= 10) return 22;
    if (seniorityYears >= 11 && seniorityYears <= 15) return 24;
    if (seniorityYears >= 16 && seniorityYears <= 20) return 26;
    if (seniorityYears >= 21 && seniorityYears <= 25) return 28;
    if (seniorityYears >= 26 && seniorityYears <= 30) return 30;
    if (seniorityYears >= 31 && seniorityYears <= 35) return 32;
    return 32; // Standard cap or further increments
  }

  /**
   * Calculates current seniority in years.
   */
  static calculateSeniority(entryDate: string): number {
    return differenceInYears(new Date(), new Date(entryDate));
  }

  /**
   * Checks if a date is a rest day based on shift and work days.
   */
  static isRestDay(employee: Employee, date: Date): boolean {
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (employee.workDays === WorkDays.CUSTOM && employee.customWorkDays) {
      return !employee.customWorkDays.includes(day);
    }
    if (employee.workDays === WorkDays.MON_FRI) {
      return day === 0 || day === 6;
    }
    if (employee.workDays === WorkDays.MON_SAT) {
      return day === 0;
    }
    return false;
  }

  /**
   * Checks if a date is the employee's birthday.
   */
  static isEmployeeBirthday(date: Date, birthDate: string): boolean {
    const bDate = new Date(birthDate);
    return date.getMonth() === bDate.getMonth() && date.getDate() === bDate.getDate();
  }

  /**
   * Generates a full year cronogram for an employee.
   */
  static generateYearlyCronogram(employee: Employee, year: number, customHolidays: Holiday[] = []) {
    const federalHolidays = this.getFederalHolidays(year);
    const allHolidays = [...federalHolidays, ...customHolidays];
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    const days = eachDayOfInterval({ start, end });

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const holiday = allHolidays.find(h => h.date === dateStr);
      const isRest = this.isRestDay(employee, date);
      const isBirthday = this.isEmployeeBirthday(date, employee.birthDate);
      
      return {
        date: dateStr,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        isFederalHoliday: holiday?.isFederal,
        isRestDay: isRest,
        isBirthday: isBirthday,
        shiftId: employee.shiftId,
      };
    });
  }

  /**
   * Checks if vacation alert is needed (2 days or less remaining).
   */
  static needsVacationAlert(employee: Employee): boolean {
    const seniority = this.calculateSeniority(employee.entryDate);
    const entitled = this.getEntitledVacationDays(seniority);
    const remaining = entitled - employee.vacationsTaken;
    return remaining <= 2 && remaining > 0;
  }
}
