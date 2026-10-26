import { createClient } from "./supabase-browser";
import type { TechReport } from "./types";

export async function loadReports(): Promise<TechReport[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tech_reports").select("*").order("updated_at", { ascending: false });
  if (error) {
    console.error("[loadReports] error:", error.message);
    return [];
  }
  return (data || []).map((row: any) => ({
    ...row,
    date_ranges: row.date_ranges || [],
    executor_ids: row.executor_ids || [],
    archived: row.archived || false,
  })) as TechReport[];
}

export async function saveReport(report: TechReport): Promise<boolean> {
  const supabase = createClient();
  const payload = {
    object: report.object,
    service_type: report.service_type,
    equipment: report.equipment,
    rp_status: report.rp_status,
    letters_status: report.letters_status,
    work_dates: report.work_dates,
    date_ranges: report.date_ranges || [],
    executor: report.executor,
    executor_ids: report.executor_ids || [],
    report_number: report.report_number,
    report_status: report.report_status,
    direction: report.direction,
    notes: report.notes,
    archived: report.archived || false,
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await supabase.from("tech_reports").select("id").eq("id", report.id).single();
  if (existing) {
    const { error } = await supabase.from("tech_reports").update(payload).eq("id", report.id);
    if (error) {
      console.error("[saveReport] update error:", error.message);
      return false;
    }
  } else {
    const { error } = await supabase.from("tech_reports").insert({
      id: report.id,
      ...payload,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[saveReport] insert error:", error.message);
      return false;
    }
  }
  return true;
}

export async function archiveReport(id: string, archived: boolean): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("tech_reports").update({ archived, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    console.error("[archiveReport] error:", error.message);
    return false;
  }
  return true;
}

export function generateId(): string {
  return crypto.randomUUID();
}
