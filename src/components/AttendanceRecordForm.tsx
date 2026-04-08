import React, { useState, useEffect } from 'react';
import { Clock, Save, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Employee, AttendanceRecord, IncidenceDefinition, ShiftDefinition, PaymentType } from '../types';
import { cn, formatHours } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  employee: Employee;
  date: string;
  record?: AttendanceRecord;
  incidences: IncidenceDefinition[];
  shifts: ShiftDefinition[];
  paymentTypes: PaymentType[];
  onSave: (record: Partial<AttendanceRecord>) => void;
  onClose: () => void;
}

export default function AttendanceRecordForm({ employee, date, record, incidences, shifts, paymentTypes, onSave, onClose }: Props) {
  const employeeShift = shifts.find(s => s.id === employee.shiftId) || shifts[0];
  const standardHours = employeeShift?.totalHours || 8;

  const [formData, setFormData] = useState<Partial<AttendanceRecord>>(
    record || {
      employeeId: employee.id,
      date,
      checkIn: employeeShift?.startTime || '09:00',
      checkOut: employeeShift?.endTime || '18:00',
      hoursWorked: standardHours,
      overtime: 0,
      deficit: 0,
      incidenceId: '',
      paymentTypeId: '',
      isRestDayWorked: false,
      isSundayWorked: false,
      isPending: false,
      notes: ''
    }
  );

  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut) return;

    const [inH, inM] = formData.checkIn.split(':').map(Number);
    const [outH, outM] = formData.checkOut.split(':').map(Number);
    
    const inDecimal = inH + (inM / 60);
    const outDecimal = outH + (outM / 60);
    
    let worked = outDecimal - inDecimal;
    if (worked < 0) worked += 24;

    const diff = worked - standardHours;
    
    setFormData(prev => ({
      ...prev,
      hoursWorked: Number(worked.toFixed(2)),
      overtime: diff > 0 ? Number(diff.toFixed(2)) : 0,
      deficit: diff < 0 ? Number(Math.abs(diff).toFixed(2)) : 0,
      isPending: diff < 0 && !prev.incidenceId
    }));
  }, [formData.checkIn, formData.checkOut, formData.incidenceId, standardHours]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-3 h-3" /> Horarios de Registro
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Entrada</label>
              <input
                type="time"
                className="dark-input w-full"
                value={formData.checkIn}
                onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Salida</label>
              <input
                type="time"
                className="dark-input w-full"
                value={formData.checkOut}
                onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-corporate-800/50 p-6 rounded-2xl border border-corporate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Horas Calculadas</span>
              <span className="text-2xl font-black text-white">{formatHours(formData.hoursWorked || 0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-corporate-900/50 p-3 rounded-xl border border-corporate-800">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Extras</p>
                <p className="text-sm font-black text-green-500">+{formatHours(formData.overtime || 0)}</p>
              </div>
              <div className="bg-corporate-900/50 p-3 rounded-xl border border-corporate-800">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Adeudo</p>
                <p className="text-sm font-black text-red-500">-{formatHours(formData.deficit || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" /> Incidencias y Notas
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tipo de Incidencia</label>
              <select
                className="dark-input w-full"
                value={formData.incidenceId}
                onChange={e => setFormData({ ...formData, incidenceId: e.target.value })}
              >
                <option value="">Ninguna / Ordinaria</option>
                {incidences.map(inc => (
                  <option key={inc.id} value={inc.id}>{inc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tipo de Pago (LFT)</label>
              <select
                className="dark-input w-full"
                value={formData.paymentTypeId}
                onChange={e => setFormData({ ...formData, paymentTypeId: e.target.value })}
              >
                <option value="">Ordinario (x1)</option>
                {paymentTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.name} (x{pt.multiplier})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-corporate-800/50 p-3 rounded-xl border border-corporate-700">
                <input 
                  type="checkbox" 
                  id="isRestDayWorked"
                  className="w-4 h-4 rounded border-corporate-700 bg-corporate-800 text-blue-corporate focus:ring-blue-corporate"
                  checked={formData.isRestDayWorked}
                  onChange={e => setFormData({ ...formData, isRestDayWorked: e.target.checked })}
                />
                <label htmlFor="isRestDayWorked" className="text-[10px] font-bold text-gray-300 uppercase">Descanso Trabajado</label>
              </div>
              <div className="flex items-center gap-3 bg-corporate-800/50 p-3 rounded-xl border border-corporate-700">
                <input 
                  type="checkbox" 
                  id="isSundayWorked"
                  className="w-4 h-4 rounded border-corporate-700 bg-corporate-800 text-blue-corporate focus:ring-blue-corporate"
                  checked={formData.isSundayWorked}
                  onChange={e => setFormData({ ...formData, isSundayWorked: e.target.checked })}
                />
                <label htmlFor="isSundayWorked" className="text-[10px] font-bold text-gray-300 uppercase">Domingo Trabajado</label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Observaciones</label>
              <textarea
                className="dark-input w-full min-h-[120px] resize-none text-sm"
                placeholder="Detalles adicionales sobre el registro..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-8 border-t border-corporate-800">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 dark-button-secondary py-3"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 dark-button-primary py-3"
        >
          <Save className="w-5 h-5" />
          Guardar Registro
        </button>
      </div>
    </form>
  );
}
