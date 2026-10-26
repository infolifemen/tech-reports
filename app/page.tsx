'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminPanel from '@/components/AdminPanel';
import ArchiveModal from '@/components/ArchiveModal';
import { loadReports, saveReport, archiveReport, generateId } from '@/lib/data';
import type { TechReport, ReportFilters, DateRange } from '@/lib/types';
import {
  STATUS_COLORS, SERVICE_TYPES, RP_STATUS_OPTIONS,
  LETTERS_STATUS_OPTIONS, REPORT_STATUS_OPTIONS, DIRECTION_OPTIONS,
  EXECUTORS,
} from '@/lib/types';
import { logout, getCurrentUser, isAdmin } from '@/lib/auth';

export default function Home() {
  const [reports, setReports] = useState<TechReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({ object: '', service_type: '', report_status: '', executor: '', search: '', show_archived: false });
  const [editing, setEditing] = useState<TechReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(108);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadReports().then((data) => {
      const normalized = data.map(r => ({
        ...r,
        date_ranges: r.date_ranges || [],
        executor_ids: r.executor_ids || [],
        archived: r.archived || false,
      }));
      setReports(normalized);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const checkHash = () => { setShowAdmin(window.location.hash === '#/admin'); };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Измеряем высоту header для sticky th
  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    // Повторное измерение после загрузки данных
    const timer = setTimeout(measure, 100);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [loaded]);

  const uniqueObjects = useMemo(() => Array.from(new Set(reports.map(r => r.object))).filter(Boolean).sort(), [reports]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(reports.map(r => r.report_status))).filter(Boolean).sort(), [reports]);
  const uniqueExecutors = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      for (const e of (r.executor || '').split(/[,\/\s]+/)) {
        if (e.trim()) set.add(e.trim());
      }
    }
    return Array.from(set).sort();
  }, [reports]);

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (!filters.show_archived && r.archived) return false;
      if (filters.object && r.object !== filters.object) return false;
      if (filters.service_type && r.service_type !== filters.service_type) return false;
      if (filters.report_status && r.report_status !== filters.report_status) return false;
      if (filters.executor && !(r.executor || '').includes(filters.executor)) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const searchable = [r.object, r.service_type, r.equipment, r.executor, r.report_number, r.notes].join(' ').toLowerCase();
        if (!searchable.includes(s)) return false;
      }
      return true;
    });
  }, [reports, filters]);

  const archivedCount = useMemo(() => reports.filter(r => r.archived).length, [reports]);

  const handleAdd = useCallback(() => {
    setEditing({
      id: generateId(),
      object: '', service_type: '', equipment: '',
      rp_status: '', letters_status: '', work_dates: '',
      date_ranges: [], executor: '', executor_ids: [],
      report_number: '', report_status: '', direction: '', notes: '',
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((report: TechReport) => {
    setEditing({
      ...report,
      date_ranges: report.date_ranges || [],
      executor_ids: report.executor_ids || [],
      archived: report.archived || false,
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async (report: TechReport) => {
    try {
      const workDatesStr = (report.date_ranges || [])
        .filter(d => d.from || d.to)
        .map(d => {
          const from = d.from ? new Date(d.from).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '';
          const to = d.to ? new Date(d.to).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '';
          return from && to ? `${from}-${to}` : from || to;
        })
        .join(', ');
      const finalReport = { ...report, work_dates: workDatesStr || report.work_dates };
      const success = await saveReport(finalReport);
      if (success) {
        setReports(prev => {
          const idx = prev.findIndex(r => r.id === report.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = finalReport;
            return updated;
          }
          return [finalReport, ...prev];
        });
        setShowModal(false);
        setEditing(null);
      } else {
        alert('Ошибка сохранения. Проверьте подключение к интернету и попробуйте снова.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Критическая ошибка при сохранении:\n' + message);
      console.error('[handleSave] error:', err);
    }
  }, []);

  const handleArchive = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await archiveReport(id, true);
    }
    setReports(prev => prev.map(r => ids.includes(r.id) ? { ...r, archived: true } : r));
  }, []);

  const handleUnarchive = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await archiveReport(id, false);
    }
    setReports(prev => prev.map(r => ids.includes(r.id) ? { ...r, archived: false } : r));
  }, []);

  const handleLogout = useCallback(() => { logout(); window.location.reload(); }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    if (!status) return <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>;
    const color = STATUS_COLORS[status] || '#94a3b8';
    return (
      <span className="status-badge" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, marginRight: 4, display: 'inline-block' }} />
        {status}
      </span>
    );
  };

  return (
    <AuthGuard>
      {showAdmin ? (
        <AdminPanel onBack={() => { window.location.hash = ''; setShowAdmin(false); }} />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* STICKY HEADER */}
        <header ref={headerRef} style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>📋 Тех. отчёты</h1>
              <span style={{ fontSize: 12, color: '#5a5a72' }}>
                {filtered.length} из {reports.length}
                {archivedCount > 0 && <span style={{ color: '#f59e0b' }}> | 📦 {archivedCount}</span>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#5a5a72' }}>👤 {getCurrentUser()} {isAdmin() ? '(админ)' : ''}</span>
              {isAdmin() && (
                <button
                  onClick={() => { window.location.hash = '#/admin'; }}
                  style={{ padding: '6px 12px', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                >
                  ⚙️ Управление
                </button>
              )}
              <button
                onClick={() => setShowArchive(true)}
                style={{ padding: '6px 12px', background: '#fff7ed', color: '#d97706', border: '1px solid #fed7aa', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                📦 Архив
              </button>
              <button
                onClick={handleAdd}
                style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                + Добавить
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: '6px 12px', background: 'transparent', color: '#5a5a72', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                Выйти
              </button>
            </div>
          </div>
          {/* Filters bar */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 20px', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.04)', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍"
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, minWidth: 150 }}
            />
            <select value={filters.object} onChange={(e) => setFilters(f => ({ ...f, object: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">Все объекты</option>
              {uniqueObjects.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={filters.service_type} onChange={(e) => setFilters(f => ({ ...f, service_type: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">Все виды услуг</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.report_status} onChange={(e) => setFilters(f => ({ ...f, report_status: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">Все статусы</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.executor} onChange={(e) => setFilters(f => ({ ...f, executor: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">Все исполнители</option>
              {uniqueExecutors.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {(filters.object || filters.service_type || filters.report_status || filters.executor || filters.search) && (
              <button
                onClick={() => setFilters({ object: '', service_type: '', report_status: '', executor: '', search: '', show_archived: filters.show_archived })}
                style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                ✕ Сбросить
              </button>
            )}
          </div>
        </header>

        {/* TABLE */}
        <div style={{ padding: '12px 20px' }}>
          {!loaded ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a5a72' }}>Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a5a72' }}>
              {reports.length === 0 ? 'Нет данных. Добавьте первый отчёт.' : 'Нет записей по выбранным фильтрам.'}
            </div>
          ) : (
            <table className="report-table">
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ top: headerHeight }}>Объект</th>
                  <th style={{ top: headerHeight }}>Вид услуг</th>
                  <th style={{ top: headerHeight }}>Оборудование</th>
                  <th style={{ top: headerHeight }}>РП/ППР</th>
                  <th style={{ top: headerHeight }}>Письма</th>
                  <th style={{ top: headerHeight }}>Даты работ</th>
                  <th style={{ top: headerHeight }}>Исполнители</th>
                  <th style={{ top: headerHeight }}>№ отчёта</th>
                  <th style={{ top: headerHeight }}>Статус</th>
                  <th style={{ top: headerHeight }}>Отправлено</th>
                  <th style={{ top: headerHeight }}>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className={r.archived ? 'archived' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleEdit(r)}
                  >
                    <td style={{ fontWeight: 500 }}>{r.object}</td>
                    <td>{r.service_type}</td>
                    <td>{r.equipment}</td>
                    <td><StatusBadge status={r.rp_status} /></td>
                    <td><StatusBadge status={r.letters_status} /></td>
                    <td style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{r.work_dates}</td>
                    <td>{r.executor}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.report_number}</td>
                    <td><StatusBadge status={r.report_status} /></td>
                    <td><StatusBadge status={r.direction} /></td>
                    <td style={{ whiteSpace: 'normal', lineHeight: 1.3 }} title={r.notes}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && editing && (
          <EditModal
            report={editing}
            isNew={!reports.find(r => r.id === editing.id)}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditing(null); }}
          />
        )}

        {showArchive && (
          <ArchiveModal
            reports={reports}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onClose={() => setShowArchive(false)}
          />
        )}
      </div>
      )}
    </AuthGuard>
  );
}

// ===== EDIT MODAL =====

function EditModal({ report, isNew, onSave, onClose }: {
  report: TechReport;
  isNew: boolean;
  onSave: (r: TechReport) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TechReport>({
    ...report,
    date_ranges: report.date_ranges?.length ? [...report.date_ranges] : [],
    executor_ids: report.executor_ids?.length ? [...report.executor_ids] : [],
  });
  const [showExecutors, setShowExecutors] = useState(false);
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#5a5a72', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' };

  const toggleExecutor = (initials: string) => {
    setForm(prev => {
      const ids = prev.executor_ids || [];
      const has = ids.includes(initials);
      const newIds = has ? ids.filter(id => id !== initials) : [...ids, initials];
      const names = newIds.join(', ');
      return { ...prev, executor_ids: newIds, executor: names };
    });
  };

  const addDateRange = () => {
    if ((form.date_ranges || []).length >= 6) return;
    setForm(prev => ({ ...prev, date_ranges: [...(prev.date_ranges || []), { from: '', to: '' }] }));
  };
  const removeDateRange = (index: number) => {
    setForm(prev => ({ ...prev, date_ranges: (prev.date_ranges || []).filter((_, i) => i !== index) }));
  };
  const updateDateRange = (index: number, field: 'from' | 'to', value: string) => {
    setForm(prev => {
      const ranges = [...(prev.date_ranges || [])];
      ranges[index] = { ...ranges[index], [field]: value };
      return { ...prev, date_ranges: ranges };
    });
  };

  const handleSaveClick = async () => {
    setSaving(true);
    try {
      await onSave({ ...form, updated_at: new Date().toISOString() });
    } catch (err) {
      console.error('[EditModal] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' }}>
          {isNew ? '➕ Новый отчёт' : '✏️ Редактировать отчёт'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* 1. Объект */}
          <div>
            <label style={labelStyle}>Объект</label>
            <input type="text" value={form.object} onChange={e => setForm(prev => ({ ...prev, object: e.target.value }))} style={inputStyle} />
          </div>

          {/* 2. Вид услуг */}
          <div>
            <label style={labelStyle}>Вид услуг</label>
            <select value={form.service_type} onChange={e => setForm(prev => ({ ...prev, service_type: e.target.value }))} style={selectStyle}>
              <option value="">— выберите —</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 3. Оборудование */}
          <div>
            <label style={labelStyle}>Оборудование</label>
            <input type="text" value={form.equipment} onChange={e => setForm(prev => ({ ...prev, equipment: e.target.value }))} style={inputStyle} />
          </div>

          {/* 4. РП/ППР */}
          <div>
            <label style={labelStyle}>РП/ППР</label>
            <select value={form.rp_status} onChange={e => setForm(prev => ({ ...prev, rp_status: e.target.value }))} style={selectStyle}>
              <option value="">— выберите —</option>
              {RP_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 5. Письма */}
          <div>
            <label style={labelStyle}>Письма</label>
            <select value={form.letters_status} onChange={e => setForm(prev => ({ ...prev, letters_status: e.target.value }))} style={selectStyle}>
              <option value="">— выберите —</option>
              {LETTERS_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 8. № отчёта */}
          <div>
            <label style={labelStyle}>№ отчёта</label>
            <input type="text" value={form.report_number} onChange={e => setForm(prev => ({ ...prev, report_number: e.target.value }))} style={inputStyle} />
          </div>

          {/* 9. Статус отчёта */}
          <div>
            <label style={labelStyle}>Статус отчёта</label>
            <select value={form.report_status} onChange={e => setForm(prev => ({ ...prev, report_status: e.target.value }))} style={selectStyle}>
              <option value="">— выберите —</option>
              {REPORT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 10. Отправлено */}
          <div>
            <label style={labelStyle}>Отправлено</label>
            <select value={form.direction} onChange={e => setForm(prev => ({ ...prev, direction: e.target.value }))} style={selectStyle}>
              <option value="">— выберите —</option>
              {DIRECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 6. Даты работ */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Даты работ (до 6 периодов)</label>
            {(form.date_ranges || []).map((range, idx) => (
              <div key={idx} className="date-range-row">
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{idx + 1}.</span>
                <input type="date" value={range.from} onChange={e => updateDateRange(idx, 'from', e.target.value)} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>по</span>
                <input type="date" value={range.to} onChange={e => updateDateRange(idx, 'to', e.target.value)} />
                <button type="button" onClick={() => removeDateRange(idx)}>✕</button>
              </div>
            ))}
            {(form.date_ranges || []).length < 6 && (
              <button
                type="button"
                onClick={addDateRange}
                style={{ marginTop: 4, padding: '4px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                + Добавить период
              </button>
            )}
          </div>

          {/* 7. Исполнители */}
          <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
            <label style={labelStyle}>Исполнители (мульти-выбор)</label>
            <div className="executor-multi-select">
              <div
                onClick={() => setShowExecutors(!showExecutors)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  minHeight: 36,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {form.executor_ids && form.executor_ids.length > 0 ? (
                  form.executor_ids.map(id => (
                    <span key={id} className="executor-tag">
                      {id}
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleExecutor(id); }}
                        style={{ cursor: 'pointer', marginLeft: 2, color: '#ef4444' }}
                      >×</span>
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#9ca3af' }}>Выберите исполнителей...</span>
                )}
              </div>
              {showExecutors && (
                <div className="executor-dropdown">
                  {EXECUTORS.map(initials => (
                    <div
                      key={initials}
                      className="executor-option"
                      onClick={() => toggleExecutor(initials)}
                    >
                      <input
                        type="checkbox"
                        checked={(form.executor_ids || []).includes(initials)}
                        readOnly
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{initials}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 11. Примечание */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Примечание</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '10px 24px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            Отмена
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saving ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '💾 Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
