import { createClient } from "./supabase-browser";
import type { TechReport } from "./types";

// === LOAD ===
export async function loadReports(): Promise<TechReport[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tech_reports")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[loadReports] error:", error.message);
    return [];
  }
  return (data || []) as TechReport[];
}

// === SAVE (UPSERT) ===
// Single round-trip instead of SELECT→UPDATE/INSERT (2 round-trips).
// Postgres .upsert() with onConflict:'id' handles both insert and update.
export async function saveReport(report: TechReport): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("tech_reports")
    .upsert(
      {
        id: report.id,
        object: report.object,
        service_type: report.service_type,
        equipment: report.equipment,
        rp_status: report.rp_status,
        letters_status: report.letters_status,
        work_dates: report.work_dates,
        executor: report.executor,
        report_number: report.report_number,
        report_status: report.report_status,
        direction: report.direction,
        notes: report.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[saveReport] error:", error.message);
    return false;
  }
  return true;
}

// === BATCH SAVE (UPSERT array) ===
// Single DB round-trip for multiple reports. Use Promise.all on the caller
// side if you need to save independent batches in parallel.
export async function saveReports(reports: TechReport[]): Promise<boolean> {
  if (reports.length === 0) return true;
  const supabase = createClient();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tech_reports")
    .upsert(
      reports.map((r) => ({
        id: r.id,
        object: r.object,
        service_type: r.service_type,
        equipment: r.equipment,
        rp_status: r.rp_status,
        letters_status: r.letters_status,
        work_dates: r.work_dates,
        executor: r.executor,
        report_number: r.report_number,
        report_status: r.report_status,
        direction: r.direction,
        notes: r.notes,
        updated_at: now,
      })),
      { onConflict: "id" }
    );

  if (error) {
    console.error("[saveReports] batch error:", error.message);
    return false;
  }
  return true;
}

// === DELETE ===
// Kept for future admin use; removed from UI.
export async function deleteReport(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tech_reports")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteReport] error:", error.message);
    return false;
  }
  return true;
}

// === GENERATE UUID ===
export function generateId(): string {
  return crypto.randomUUID();
}
