import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Employee, Holiday, WorkDays, AttendanceRecord, ShiftDefinition, IncidenceDefinition, PaymentType } from '../types';
import { cn } from '../lib/utils';
import { CalendarService } from '../services/calendarService';
import { Calendar as CalendarIcon, Clock, User, AlertTriangle, X, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  employees: Employee[];
  year: number;
  customHolidays?: Holiday[];
  attendanceRecords?: AttendanceRecord[];
  shifts?: ShiftDefinition[];
  incidences?: IncidenceDefinition[];
  paymentTypes?: PaymentType[];
}

export default function ShiftCronogram({ 
  employees, 
  year, 
  customHolidays = [], 
  attendanceRecords = [],
  shifts = [],
  incidences = [],
  paymentTypes = []
}: Props) {
  const [selectedCell, setSelectedCell] = useState<{ emp: Employee, day: Date } | null>(null);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-12 p-4 relative">
      {months.map(month => (
        <MonthView 
          key={month} 
          month={month} 
          year={year} 
          employees={employees} 
          customHolidays={customHolidays} 
          attendanceRecords={attendanceRecords}
          shifts={shifts}
          incidences={incidences}
          onCellClick={(emp, day) => setSelectedCell({ emp, day })}
        />
      ))}

      <AnimatePresence>
        {selectedCell && (
          <div className="fixed inset-0 bg-corporate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="dark-card w-full max-w-md p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-corporate/5 rounded-full -mr-16 -mt-16"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-corporate-800 rounded-2xl flex items-center justify-center border border-corporate-700">
                    <User className="w-6 h-6 text-blue-corporate" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{selectedCell.emp.name}</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{format(selectedCell.day, 'PPPP', { locale: es })}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCell(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-corporate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                {(() => {
                  const record = attendanceRecords.find(r => r.employeeId === selectedCell.emp.id && r.date === format(selectedCell.day, 'yyyy-MM-dd'));
                  const shift = shifts.find(s => s.id === selectedCell.emp.shiftId);
                  const holiday = customHolidays.find(h => isSameDay(new Date(h.date), selectedCell.day));
                  const isRest = CalendarService.isRestDay(selectedCell.emp, selectedCell.day);
                  const incidence = record?.incidenceId ? incidences.find(i => i.id === record.incidenceId) : null;
                  const paymentType = record?.paymentTypeId ? paymentTypes.find(pt => pt.id === record.paymentTypeId) : null;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-corporate-800/50 p-4 rounded-2xl border border-corporate-700">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Turno Asignado
                          </p>
                          <p className="text-sm font-black text-white">{shift?.name || 'No definido'}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{shift?.startTime} - {shift?.endTime}</p>
                        </div>
                        <div className="bg-corporate-800/50 p-4 rounded-2xl border border-corporate-700">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Estatus
                          </p>
                          <div className="flex items-center gap-2">
                            {holiday ? (
                              <span className="text-sm font-black text-red-500">Festivo</span>
                            ) : isRest ? (
                              <span className="text-sm font-black text-gray-400">Descanso</span>
                            ) : record ? (
                              <span className="text-sm font-black text-green-500">Presente</span>
                            ) : (
                              <span className="text-sm font-black text-orange-500">Falta</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {record && (
                        <div className="space-y-4">
                          <div className="bg-corporate-800/50 p-6 rounded-2xl border border-corporate-700 space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-corporate-700">
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Entrada</p>
                                <p className="text-lg font-black text-white">{record.checkIn || '--:--'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Salida</p>
                                <p className="text-lg font-black text-white">{record.checkOut || '--:--'}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Horas Trabajadas</p>
                                <p className="text-sm font-black text-blue-corporate">{record.hoursWorked.toFixed(2)}h</p>
                              </div>
                              {record.overtime > 0 && (
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Extras</p>
                                  <p className="text-sm font-black text-green-500">+{record.overtime.toFixed(2)}h</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {(record.isRestDayWorked || record.isSundayWorked || paymentType) && (
                            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                              <p className="text-[10px] font-bold text-blue-corporate uppercase tracking-widest mb-2">Compensación Especial (LFT)</p>
                              <div className="flex flex-wrap gap-2">
                                {record.isRestDayWorked && (
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-corporate rounded text-[9px] font-black uppercase tracking-widest border border-blue-500/30">
                                    Descanso Trabajado
                                  </span>
                                )}
                                {record.isSundayWorked && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-[9px] font-black uppercase tracking-widest border border-yellow-500/30">
                                    Domingo Trabajado
                                  </span>
                                )}
                                {paymentType && (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-[9px] font-black uppercase tracking-widest border border-green-500/30">
                                    {paymentType.name} (x{paymentType.multiplier})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {incidence && (
                        <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 flex items-center gap-4">
                          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-0.5">Incidencia Registrada</p>
                            <p className="text-sm font-black text-white">{incidence.name}</p>
                          </div>
                        </div>
                      )}

                      {!record && !holiday && !isRest && (
                        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                            <XCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-0.5">Ausencia Detectada</p>
                            <p className="text-sm font-black text-white">No se encontró registro de asistencia.</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <button 
                onClick={() => setSelectedCell(null)}
                className="w-full mt-8 dark-button-primary py-4"
              >
                Cerrar Detalle
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MonthView({ 
  month, 
  year, 
  employees, 
  customHolidays, 
  attendanceRecords,
  shifts,
  incidences,
  onCellClick 
}: { 
  month: number, 
  year: number, 
  employees: Employee[], 
  customHolidays: Holiday[],
  attendanceRecords: AttendanceRecord[],
  shifts: ShiftDefinition[],
  incidences: IncidenceDefinition[],
  onCellClick: (emp: Employee, day: Date) => void
}) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });
  const monthName = format(start, 'MMMM yyyy', { locale: es });

  return (
    <div className="dark-card overflow-hidden border-corporate-800/50">
      <div className="p-4 border-b border-corporate-800 bg-corporate-900/50 flex items-center gap-3">
        <div className="p-2 bg-blue-corporate/10 rounded-lg">
          <CalendarIcon className="w-4 h-4 text-blue-corporate" />
        </div>
        <h3 className="font-black text-white capitalize tracking-tight">{monthName}</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-corporate-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-corporate-900/30 border-b border-corporate-800">
              <th className="sticky left-0 z-20 bg-corporate-900 px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] min-w-[200px] text-left border-r border-corporate-800 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">Colaborador</th>
              {days.map(day => (
                <th key={day.toString()} className="px-2 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest min-w-[40px] text-center border-r border-corporate-800/50 last:border-r-0">
                  <div className={cn(isWeekend(day) ? "text-red-500" : "text-gray-400")}>{format(day, 'dd')}</div>
                  <div className="text-[8px] font-bold text-gray-600 mt-1">{format(day, 'eee', { locale: es }).charAt(0)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-corporate-800/50">
            {employees.map(emp => (
              <tr key={emp.id} className="group hover:bg-corporate-800/20 transition-colors">
                <td className="sticky left-0 z-10 bg-corporate-900 group-hover:bg-corporate-800/40 px-6 py-3 border-r border-corporate-800 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-corporate-800 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-blue-corporate group-hover:text-white transition-all">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-[11px] font-black text-white truncate max-w-[140px] tracking-tight">{emp.name}</span>
                  </div>
                </td>
                {days.map(day => {
                  const holiday = customHolidays.find(h => isSameDay(new Date(h.date), day));
                  const isRest = CalendarService.isRestDay(emp, day);
                  const record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === format(day, 'yyyy-MM-dd'));
                  
                  let label = 'T';
                  let colorClass = "bg-blue-corporate/10 text-blue-corporate border-blue-corporate/20";
                  let title = "Turno Ordinario";

                  if (holiday) {
                    label = 'F';
                    colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
                    title = holiday.name;
                  } else if (isRest) {
                    label = 'D';
                    colorClass = "bg-corporate-800 text-gray-600 border-corporate-700";
                    title = "Descanso";
                  } else if (record) {
                    label = 'P';
                    colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
                    title = "Presente";
                  } else if (day < new Date()) {
                    label = 'A';
                    colorClass = "bg-orange-500/10 text-orange-500 border-orange-500/20";
                    title = "Ausente";
                  }

                  return (
                    <td 
                      key={day.toString()} 
                      className="px-1 py-3 text-center border-r border-corporate-800/30 last:border-r-0 cursor-pointer"
                      title={`${emp.name} - ${format(day, 'PPP', { locale: es })}: ${title}`}
                      onClick={() => onCellClick(emp, day)}
                    >
                      <div className={cn(
                        "w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-[9px] font-black border transition-all hover:scale-110",
                        colorClass
                      )}>
                        {label}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
