// Типы для проекта "Тех. отчёты"

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface TechReport {
  id: string;
  object: string;
  service_type: string;
  equipment: string;
  rp_status: string;
  letters_status: string;
  work_dates: string;
  date_ranges: DateRange[];
  executor: string;
  executor_ids: string[];
  report_number: string;
  report_status: string;
  direction: string;
  notes: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  object: string;
  service_type: string;
  report_status: string;
  executor: string;
  search: string;
  show_archived: boolean;
}

export const STATUS_COLORS: Record<string, string> = {
  'Согласовано': '#10b981',
  'у Заказчика': '#f59e0b',
  'Не требуется': '#94a3b8',
  'Требуется': '#ef4444',
  'На согласовании': '#f59e0b',
  'РП': '#3b82f6',
  'Процедура': '#8b5cf6',
  '.pdf': '#6366f1',
  'Печат верс': '#0ea5e9',
  'Распечатать': '#f97316',
};

export const SERVICE_TYPES = [
  'ЧР', 'КДО', 'ТИ', 'ВД', 'Заклин', 'Магнит поток', 'ЭЛСИД', 'Иное',
];

export const RP_STATUS_OPTIONS = [
  'РП', 'Процедура', 'Не требуется', 'у Заказчика', 'Согласовано',
];

export const LETTERS_STATUS_OPTIONS = [
  'Не требуется', 'Согласовано', 'у Заказчика', 'Требуется',
];

export const REPORT_STATUS_OPTIONS = [
  'Требуется', 'у Заказчика', 'Согласовано',
];

export const DIRECTION_OPTIONS = [
  '.pdf', 'Печат верс', 'Распечатать',
];

// Хардкод-список инициалов сотрудников (9 специалистов)
export const EXECUTORS = [
  'АДА', 'ККА', 'СНМ', 'ЧАС', 'СМВ', 'ТИС', 'ТАА', 'ЯН', 'КДА',
];
