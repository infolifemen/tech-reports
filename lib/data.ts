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

// === SAVE (INSERT or UPDATE) ===
export async function saveReport(report: TechReport): Promise<boolean> {
  const supabase = createClient();
  
  // Check if exists
  const { data: existing } = await supabase
    .from("tech_reports")
    .select("id")
    .eq("id", report.id)
    .single();
  
  if (existing) {
    // UPDATE
    const { error } = await supabase
      .from("tech_reports")
      .update({
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
      })
      .eq("id", report.id);
    
    if (error) {
      console.error("[saveReport] update error:", error.message);
      return false;
    }
  } else {
    // INSERT
    const { error } = await supabase
      .from("tech_reports")
      .insert({
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error("[saveReport] insert error:", error.message);
      return false;
    }
  }
  
  return true;
}

// === DELETE ===
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
