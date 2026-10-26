export interface TechReport {
  id: string;
  object: string;
  service_type: string;
  equipment: string;
  rp_status: string;
  letters_status: string;
  work_dates: string;
  executor: string;
  report_number: string;
  report_status: string;
  direction: string;
  notes: string;
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
  'Согласовано': '#10b981',
  'у Заказчика': '#f59e0b',
  'Не требуется': '#94a3b8',
  'Требуется': '#ef4444',
  'На согласовании': '#f59e0b',
};

export const SERVICE_TYPES = ['ЧР', 'КДО', 'ТИ', 'ВД', 'Заклин', 'Магнит поток', 'ЭЛСИД', 'Иное'];
