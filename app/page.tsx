'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminPanel from '@/components/AdminPanel';
import { ArchiveModal, type ArchiveObject } from '@/components/ArchiveModal';
import { loadReports, saveReport, generateId } from '@/lib/data';
import type { TechReport, ReportFilters } from '@/lib/types';
import { STATUS_COLORS, SERVICE_TYPES } from '@/lib/types';
import { logout, getCurrentUser, isAdmin } from '@/lib/auth';
import { Archive, ArchiveRestore, ChevronDown } from 'lucide-react';
import { useRef } from 'react';

// === Archive helpers ===
const ARCHIVE_STORAGE_KEY = 'tech_reports_archived_ids';

function loadArchivedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveArchivedIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(ids));
}

export default function Home() {
  const [reports, setReports] = useState<TechReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    object: '',
    service_type: '',
    report_status: '',
    executor: '',
    search: '',
  });
  const [editing, setEditing] = useState<TechReport | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Archive state
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);

  // Close archive dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (archiveRef.current && !archiveRef.current.contains(e.target as Node)) {
        setArchiveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load data
  useEffect(() => {
    setArchivedIds(loadArchivedIds());
    loadReports().then((data) => {
      setReports(data);
      setLoaded(true);
    });
  }, []);

  // Unique filter values
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

  // Filtered reports (with archive filtering)
  const filtered = useMemo(() => {
    return reports.filter(r => {
      // Archive filter: archived objects have id = object name
      const objectArchived = archivedIds.includes(r.object);
      if (showArchived && !objectArchived) return false;
      if (!showArchived && objectArchived) return false;

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
  }, [reports, filters, archivedIds, showArchived]);

  // Archive objects (grouped by object name)
  const archiveObjects: ArchiveObject[] = useMemo(() => {
    const map = new Map<string, ArchiveObject>();
    for (const r of reports) {
      const key = r.object;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, { id: key, object: key, service_type: r.service_type, equipment: r.equipment, count: 0 });
      }
      map.get(key)!.count++;
    }
    return Array.from(map.values()).sort((a, b) => a.object.localeCompare(b.object));
  }, [reports]);

  const archivedCount = useMemo(() => {
    const objIds = new Set(reports.map(r => r.object));
    return archivedIds.filter(id => objIds.has(id)).length;
  }, [reports, archivedIds]);

  // Handlers
  const handleAdd = useCallback(() => {
    setEditing({
      id: generateId(),
      object: '',
      service_type: '',
      equipment: '',
      rp_status: '',
      letters_status: '',
      work_dates: '',
      executor: '',
      report_number: '',
      report_status: '',
      direction: '',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((report: TechReport) => {
    setEditing({ ...report });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async (report: TechReport) => {
    const success = await saveReport(report);
    if (success) {
      setReports(prev => {
        const idx = prev.findIndex(r => r.id === report.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = report;
          return updated;
        }
        return [report, ...prev];
      });
      setShowModal(false);
      setEditing(null);
    } else {
      alert('Ошибка сохранения');
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    window.location.reload();
  }, []);

  // Archive handlers
  const handleArchive = useCallback((ids: string[]) => {
    const newArchivedIds = Array.from(new Set([...archivedIds, ...ids]));
    saveArchivedIds(newArchivedIds);
    setArchivedIds(newArchivedIds);
  }, [archivedIds]);

  const handleUnarchive = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const newArchivedIds = archivedIds.filter(id => !idSet.has(id));
    saveArchivedIds(newArchivedIds);
    setArchivedIds(newArchivedIds);
  }, [archivedIds]);

  // Hash routing for admin panel
  const [showAdmin, setShowAdmin] = useState(false);
  useEffect(() => {
    const checkHash = () => {
      setShowAdmin(window.location.hash === '#/admin');
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const color = STATUS_COLORS[status] || '#94a3b8';
    return (
      <span
        className="status-badge"
        style={{
          background: `${color}18`,
          color: color,
          border: `1px solid ${color}40`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 6 }} />
        {status || '—'}
      </span>
    );
  };

  const btnStyle: React.CSSProperties = {
    padding: 8,
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 8,
    color: '#5a5a72',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <AuthGuard>
      {showAdmin ? (
        <AdminPanel onBack={() => { window.location.hash = ''; setShowAdmin(false); }} />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0eeeb' }}>
        {/* Header */}
        <header style={{
          position: 'relative',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>📋 Тех. отчёты</h1>
            <span style={{ fontSize: 13, color: '#5a5a72' }}>
              {filtered.length} из {reports.length} записей{archivedCount > 0 && !showArchived && <span> · {archivedCount} в архиве</span>}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#5a5a72' }}>
              👤 {getCurrentUser()} {isAdmin() ? '(админ)' : ''}
            </span>
            {isAdmin() && (
              <button
                onClick={() => { window.location.hash = '#/admin'; }}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Управление
              </button>
            )}
            <button
              onClick={handleAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              }}
            >
              + Добавить
            </button>
            {/* Archive button */}
            <div ref={archiveRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setArchiveMenuOpen(!archiveMenuOpen)}
                style={{
                  ...btnStyle,
                  gap: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: showArchived ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.04)',
                  border: showArchived ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(0,0,0,0.06)',
                  color: showArchived ? '#f59e0b' : '#5a5a72',
                }}
              >
                {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                Архив
                {archivedCount > 0 && !showArchived && (
                  <span style={{ background: 'rgba(245,158,11,0.2)', color: '#d97706', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, minWidth: 16, textAlign: 'center' }}>{archivedCount}</span>
                )}
                <ChevronDown size={12} />
              </button>
              {archiveMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  padding: 6,
                  minWidth: 200,
                  zIndex: 9999,
                }}>
                  <button
                    onClick={() => { setShowArchived(!showArchived); setArchiveMenuOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: '#5a5a72',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{showArchived ? 'Показать активные' : 'Показать архив'}</div>
                      <div style={{ fontSize: 10, color: '#8e8ea0', marginTop: 2 }}>{showArchived ? 'Вернуться к активным' : `Просмотреть ${archivedCount} архивных`}</div>
                    </div>
                  </button>
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
                  <button
                    onClick={() => { setShowArchiveModal(true); setArchiveMenuOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: '#5a5a72',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Archive size={16} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Управление архивом</div>
                      <div style={{ fontSize: 10, color: '#8e8ea0', marginTop: 2 }}>Архивировать или восстановить объекты</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#5a5a72',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Выйти
            </button>
          </div>
        </header>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.5)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="🔍 Поиск..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 13,
              minWidth: 180,
            }}
          />
          <select
            value={filters.object}
            onChange={(e) => setFilters(f => ({ ...f, object: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}
          >
            <option value="">Все объекты</option>
            {uniqueObjects.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            value={filters.service_type}
            onChange={(e) => setFilters(f => ({ ...f, service_type: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}
          >
            <option value="">Все виды услуг</option>
            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.report_status}
            onChange={(e) => setFilters(f => ({ ...f, report_status: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}
          >
            <option value="">Все статусы</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.executor}
            onChange={(e) => setFilters(f => ({ ...f, executor: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}
          >
            <option value="">Все исполнители</option>
            {uniqueExecutors.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {(filters.object || filters.service_type || filters.report_status || filters.executor || filters.search) && (
            <button
              onClick={() => setFilters({ object: '', service_type: '', report_status: '', executor: '', search: '' })}
              style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
            >
              ✕ Сбросить
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, padding: '16px 24px', overflow: 'auto' }}>
          {!loaded ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a5a72' }}>Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a5a72' }}>
              {reports.length === 0 ? 'Нет данных. Добавьте первый отчёт или импортируйте из Excel.' : showArchived ? '📦 Архив пуст.' : 'Нет записей по выбранным фильтрам.'}
            </div>
          ) : (
            <table className="report-table" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <thead>
                <tr>
                  <th>Объект</th>
                  <th>РП/ППР</th>
                  <th>Письма</th>
                  <th>Даты работ</th>
                  <th>Исполнители</th>
                  <th>№ отчёта</th>
                  <th>Статус</th>
                  <th>Направление</th>
                  <th>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(r)}>
                    <td style={{ fontWeight: 500, verticalAlign: 'top' }}>
                      <div>{r.object}</div>
                      {(r.service_type || r.equipment) && (
                        <div style={{ fontSize: 11, color: '#8e8ea0', fontWeight: 400, marginTop: 2 }}>
                          {[r.service_type, r.equipment].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={r.rp_status} /></td>
                    <td><StatusBadge status={r.letters_status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.work_dates}</td>
                    <td>{r.executor}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.report_number}</td>
                    <td><StatusBadge status={r.report_status} /></td>
                    <td>{r.direction}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.notes}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit Modal */}
        {showModal && editing && (
          <EditModal
            report={editing}
            isNew={!reports.find(r => r.id === editing.id)}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditing(null); }}
          />
        )}

        {/* Archive Modal */}
        {showArchiveModal && (
          <ArchiveModal
            objects={archiveObjects}
            archivedIds={archivedIds}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onClose={() => setShowArchiveModal(false)}
          />
        )}
      </div>
      )}
    </AuthGuard>
  );
}

// === EDIT MODAL ===
function EditModal({ report, isNew, onSave, onClose }: {
  report: TechReport;
  isNew: boolean;
  onSave: (r: TechReport) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TechReport>({ ...report });

  const fields: Array<{ key: keyof TechReport; label: string; type?: string }> = [
    { key: 'object', label: 'Объект' },
    { key: 'service_type', label: 'Вид услуг' },
    { key: 'equipment', label: 'Оборудование' },
    { key: 'rp_status', label: 'РП/ППР' },
    { key: 'letters_status', label: 'Письма' },
    { key: 'work_dates', label: 'Даты работ' },
    { key: 'executor', label: 'Исполнители' },
    { key: 'report_number', label: '№ отчёта' },
    { key: 'report_status', label: 'Статус отчёта' },
    { key: 'direction', label: 'Направление' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>
          {isNew ? '➕ Новый отчёт' : '✏️ Редактировать отчёт'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5a5a72', marginBottom: 4 }}>{f.label}</label>
              {f.key === 'service_type' ? (
                <select
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
                >
                  <option value="">—</option>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
                />
              )}
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#5a5a72', marginBottom: 4 }}>Примечание</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 24px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
          >
            Отмена
          </button>
          <button
            onClick={() => onSave({ ...form, updated_at: new Date().toISOString() })}
            style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
