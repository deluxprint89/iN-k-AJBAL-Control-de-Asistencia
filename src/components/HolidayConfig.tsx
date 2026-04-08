import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Globe, Building, Save } from 'lucide-react';
import { Holiday } from '../types';
import { cn } from '../lib/utils';
import { CalendarService } from '../services/calendarService';

interface Props {
  onSave: (holidays: Holiday[]) => void;
  initialHolidays?: Holiday[];
  year: number;
}

export default function HolidayConfig({ onSave, initialHolidays, year }: Props) {
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays || CalendarService.getFederalHolidays(year));
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', isFederal: false });

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setHolidays([...holidays, newHoliday]);
    setNewHoliday({ date: '', name: '', isFederal: false });
  };

  const removeHoliday = (index: number) => {
    setHolidays(holidays.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-corporate-900 border border-corporate-800 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-8 border-b border-corporate-800 bg-corporate-900/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Días Festivos {year}</h3>
          <p className="text-xs text-gray-500 font-medium">Gestione días federales y voluntarios de la empresa.</p>
        </div>
        <button 
          onClick={() => onSave(holidays)}
          className="dark-button-primary"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      <div className="p-8 space-y-8">
        {/* Add New Holiday Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-corporate-950/50 rounded-2xl border border-corporate-800">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Fecha</label>
            <input 
              type="date" 
              className="dark-input w-full"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Nombre del Día</label>
            <input 
              type="text" 
              placeholder="Ej. Aniversario Empresa"
              className="dark-input w-full"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={addHoliday}
              className="w-full dark-button-secondary py-3"
            >
              <Plus className="w-4 h-4" />
              Agregar Día
            </button>
          </div>
        </div>

        {/* Holiday List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holidays.sort((a, b) => a.date.localeCompare(b.date)).map((holiday, index) => (
            <div key={index} className="flex items-center justify-between p-5 bg-corporate-900/50 border border-corporate-800 rounded-2xl hover:border-blue-corporate/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  holiday.isFederal ? "bg-red-500/10 text-red-500" : "bg-blue-corporate/10 text-blue-corporate"
                )}>
                  {holiday.isFederal ? <Globe className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-tight">{holiday.name}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{holiday.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                  holiday.isFederal ? "bg-red-500/10 text-red-500" : "bg-blue-corporate/10 text-blue-corporate"
                )}>
                  {holiday.isFederal ? 'Federal' : 'Empresa'}
                </span>
                {!holiday.isFederal && (
                  <button 
                    onClick={() => removeHoliday(index)}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
