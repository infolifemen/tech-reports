// Типы для проекта "Тех. отчёты"

export interface TechReport {
  id: string;
  object: string;            // Объект (Красноярская ТЭЦ-3, Шатурская ГРЭС, etc.)
  service_type: string;      // Вид услуг (ЧР, КДО, ТИ, ВД, etc.)
  equipment: string;         // Оборудование (ТГ-1, ТГ-2, etc.)
  rp_status: string;         // РП/ППР (Согласовано, у Заказчика)
  letters_status: string;    // Письма (Согласовано, у Заказчика)
  work_dates: string;        // Даты работ (31.10-01.11, etc.)
  executor: string;          // Исполнители (ККА, АДА, СНМ, etc.)
  report_number: string;     // № отчёта (106-25, 1-26, etc.)
  report_status: string;     // Статус отчёта (Согласовано, у Заказчика)
  direction: string;         // Направление (Печат верс, pdf)
  notes: string;             // Примечание
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  object: string;
  service_type: string;
  report_status: string;
  executor: string;
  search: string;
}

export const STATUS_COLORS: Record<string, string> = {
  'Согласовано': '#10b981',     // зелёный
  'у Заказчика': '#f59e0b',     // жёлтый/оранжевый
  'Не требуется': '#94a3b8',    // серый
  'Требуется': '#ef4444',       // красный
  'На согласовании': '#f59e0b', // жёлтый
};

export const SERVICE_TYPES = [
  'ЧР', 'КДО', 'ТИ', 'ВД', 'Заклин', 'Магнит поток', 'ЭЛСИД', 'Иное',
];