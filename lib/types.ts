// \u0422\u0438\u043f\u044b \u0434\u043b\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u0430 "\u0422\u0435\u0445. \u043e\u0442\u0447\u0451\u0442\u044b"

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
  '\u0421\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u043e': '#10b981',
  '\u0443 \u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430': '#f59e0b',
  '\u041d\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f': '#94a3b8',
  '\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f': '#ef4444',
  '\u041d\u0430 \u0441\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u0438\u0438': '#f59e0b',
  '\u0420\u041f': '#3b82f6',
  '\u041f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0430': '#8b5cf6',
  '.pdf': '#6366f1',
  '\u041f\u0435\u0447\u0430\u0442 \u0432\u0435\u0440\u0441': '#0ea5e9',
  '\u0420\u0430\u0441\u043f\u0435\u0447\u0430\u0442\u0430\u0442\u044c': '#f97316',
};

export const SERVICE_TYPES = [
  '\u0427\u0420', '\u041a\u0414\u041e', '\u0422\u0418', '\u0412\u0414', '\u0417\u0430\u043a\u043b\u0438\u043d', '\u041c\u0430\u0433\u043d\u0438\u0442 \u043f\u043e\u0442\u043e\u043a', '\u042d\u041b\u0421\u0418\u0414', '\u0418\u043d\u043e\u0435',
];

export const RP_STATUS_OPTIONS = [
  '\u0420\u041f', '\u041f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0430', '\u041d\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f', '\u0443 \u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430', '\u0421\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u043e',
];

export const LETTERS_STATUS_OPTIONS = [
  '\u041d\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f', '\u0421\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u043e', '\u0443 \u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430', '\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f',
];

export const REPORT_STATUS_OPTIONS = [
  '\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f', '\u0443 \u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430', '\u0421\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u043e',
];

export const DIRECTION_OPTIONS = [
  '.pdf', '\u041f\u0435\u0447\u0430\u0442 \u0432\u0435\u0440\u0441', '\u0420\u0430\u0441\u043f\u0435\u0447\u0430\u0442\u0430\u0442\u044c',
];
