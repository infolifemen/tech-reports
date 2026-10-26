-- Создание таблицы для тех. отчётов

CREATE TABLE IF NOT EXISTS tech_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object TEXT,
  service_type TEXT,
  equipment TEXT,
  rp_status TEXT DEFAULT '',
  letters_status TEXT DEFAULT '',
  work_dates TEXT,
  executor TEXT,
  report_number TEXT,
  report_status TEXT DEFAULT '',
  direction TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_reports_object ON tech_reports(object);
CREATE INDEX IF NOT EXISTS idx_tech_reports_service_type ON tech_reports(service_type);
CREATE INDEX IF NOT EXISTS idx_tech_reports_report_status ON tech_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_tech_reports_executor ON tech_reports(executor);
CREATE INDEX IF NOT EXISTS idx_tech_reports_updated_at ON tech_reports(updated_at DESC);

ALTER TABLE tech_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON tech_reports
  FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_tech_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tech_reports_updated_at
  BEFORE UPDATE ON tech_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_tech_reports_updated_at();
