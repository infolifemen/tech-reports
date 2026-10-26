'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminPanel from '@/components/AdminPanel';
import ArchiveModal from '@/components/ArchiveModal';
import { loadReports, saveReport, archiveReport, generateId } from '@/lib/data';
import { listUsers } from '@/lib/auth';
import type { TechReport, ReportFilters, DateRange } from '@/lib/types';
import {
  STATUS_COLORS, SERVICE_TYPES, RP_STATUS_OPTIONS,
  LETTERS_STATUS_OPTIONS, REPORT_STATUS_OPTIONS, DIRECTION_OPTIONS,
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
  const [allUsers, setAllUsers] = useState<Array<{ username: string; isAdmin: boolean }>>([]);

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
    listUsers().then(users => setAllUsers(users));
  }, []);

  useEffect(() => {
    const checkHash = () => { setShowAdmin(window.location.hash === '#/admin'); };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

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
      alert('\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f');
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
    if (!status) return <span style={{ color: '#94a3b8', fontSize: 11 }}>\u2014</span>;
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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0eeeb' }}>
        {/* STICKY HEADER */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{'\ud83d\udccb'} \u0422\u0435\u0445. \u043e\u0442\u0447\u0451\u0442\u044b</h1>
              <span style={{ fontSize: 12, color: '#5a5a72' }}>
                {filtered.length} \u0438\u0437 {reports.length}
                {archivedCount > 0 && <span style={{ color: '#f59e0b' }}> | {'\ud83d\udce6'} {archivedCount}</span>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#5a5a72' }}>{'\ud83d\udc64'} {getCurrentUser()} {isAdmin() ? '(\u0430\u0434\u043c\u0438\u043d)' : ''}</span>
              {isAdmin() && (
                <button
                  onClick={() => { window.location.hash = '#/admin'; }}
                  style={{ padding: '6px 12px', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                >
                  {'\u2699\ufe0f'} \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435
                </button>
              )}
              <button
                onClick={() => setShowArchive(true)}
                style={{ padding: '6px 12px', background: '#fff7ed', color: '#d97706', border: '1px solid #fed7aa', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                {'\ud83d\udce6'} \u0410\u0440\u0445\u0438\u0432
              </button>
              <button
                onClick={handleAdd}
                style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                + \u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: '6px 12px', background: 'transparent', color: '#5a5a72', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                \u0412\u044b\u0439\u0442\u0438
              </button>
            </div>
          </div>
          {/* Filters bar */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 20px', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.04)', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={'\ud83d\udd0d'}
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, minWidth: 150 }}
            />
            <select value={filters.object} onChange={(e) => setFilters(f => ({ ...f, object: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">\u0412\u0441\u0435 \u043e\u0431\u044a\u0435\u043a\u0442\u044b</option>
              {uniqueObjects.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={filters.service_type} onChange={(e) => setFilters(f => ({ ...f, service_type: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">\u0412\u0441\u0435 \u0432\u0438\u0434\u044b \u0443\u0441\u043b\u0443\u0433</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.report_status} onChange={(e) => setFilters(f => ({ ...f, report_status: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">\u0412\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044b</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.executor} onChange={(e) => setFilters(f => ({ ...f, executor: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
              <option value="">\u0412\u0441\u0435 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438</option>
              {uniqueExecutors.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {(filters.object || filters.service_type || filters.report_status || filters.executor || filters.search) && (
              <button
                onClick={() => setFilters({ object: '', service_type: '', report_status: '', executor: '', search: '', show_archived: filters.show_archived })}
                style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                \u2715 \u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c
              </button>
            )}
          </div>
        </header>

        {/* TABLE */}
        <div style={{ flex: 1, padding: '12px 20px', overflow: 'auto' }}>
          {!loaded ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a5a72' }}>{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a5a72' }}>
              {reports.length === 0 ? '\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445. \u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043f\u0435\u0440\u0432\u044b\u0439 \u043e\u0442\u0447\u0451\u0442.' : '\u041d\u0435\u0442 \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u043e \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u043c \u0444\u0438\u043b\u044c\u0442\u0440\u0430\u043c.'}
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
                  <th>{'\u041e\u0431\u044a\u0435\u043a\u0442'}</th>
                  <th>{'\u0412\u0438\u0434 \u0443\u0441\u043b\u0443\u0433'}</th>
                  <th>{'\u041e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u0435'}</th>
                  <th>{'\u0420\u041f/\u041f\u041f\u0420'}</th>
                  <th>{'\u041f\u0438\u0441\u044c\u043c\u0430'}</th>
                  <th>{'\u0414\u0430\u0442\u044b \u0440\u0430\u0431\u043e\u0442'}</th>
                  <th>{'\u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438'}</th>
                  <th>{'\u2116 \u043e\u0442\u0447\u0451\u0442\u0430'}</th>
                  <th>{'\u0421\u0442\u0430\u0442\u0443\u0441'}</th>
                  <th>{'\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e'}</th>
                  <th>{'\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435'}</th>
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
            allUsers={allUsers}
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

function EditModal({ report, allUsers, isNew, onSave, onClose }: {
  report: TechReport;
  allUsers: Array<{ username: string; isAdmin: boolean }>;
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#5a5a72', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' };

  const toggleExecutor = (username: string) => {
    setForm(prev => {
      const ids = prev.executor_ids || [];
      const has = ids.includes(username);
      const newIds = has ? ids.filter(id => id !== username) : [...ids, username];
      const names = allUsers.filter(u => newIds.includes(u.username)).map(u => u.username).join(', ');
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
          {isNew ? '\u2795 \u041d\u043e\u0432\u044b\u0439 \u043e\u0442\u0447\u0451\u0442' : '\u270f\ufe0f \u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043e\u0442\u0447\u0451\u0442'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* 1. \u041e\u0431\u044a\u0435\u043a\u0442 */}
          <div>
            <label style={labelStyle}>{'\u041e\u0431\u044a\u0435\u043a\u0442'}</label>
            <input type="text" value={form.object} onChange={e => setForm(prev => ({ ...prev, object: e.target.value }))} style={inputStyle} />
          </div>

          {/* 2. \u0412\u0438\u0434 \u0443\u0441\u043b\u0443\u0433 */}
          <div>
            <label style={labelStyle}>{'\u0412\u0438\u0434 \u0443\u0441\u043b\u0443\u0433'}</label>
            <select value={form.service_type} onChange={e => setForm(prev => ({ ...prev, service_type: e.target.value }))} style={selectStyle}>
              <option value="">{'\u2014 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u2014'}</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 3. \u041e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u0435 */}
          <div>
            <label style={labelStyle}>{'\u041e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u0435'}</label>
            <input type="text" value={form.equipment} onChange={e => setForm(prev => ({ ...prev, equipment: e.target.value }))} style={inputStyle} />
          </div>

          {/* 4. \u0420\u041f/\u041f\u041f\u0420 */}
          <div>
            <label style={labelStyle}>{'\u0420\u041f/\u041f\u041f\u0420'}</label>
            <select value={form.rp_status} onChange={e => setForm(prev => ({ ...prev, rp_status: e.target.value }))} style={selectStyle}>
              <option value="">{'\u2014 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u2014'}</option>
              {RP_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 5. \u041f\u0438\u0441\u044c\u043c\u0430 */}
          <div>
            <label style={labelStyle}>{'\u041f\u0438\u0441\u044c\u043c\u0430'}</label>
            <select value={form.letters_status} onChange={e => setForm(prev => ({ ...prev, letters_status: e.target.value }))} style={selectStyle}>
              <option value="">{'\u2014 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u2014'}</option>
              {LETTERS_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 8. \u2116 \u043e\u0442\u0447\u0451\u0442\u0430 */}
          <div>
            <label style={labelStyle}>{'\u2116 \u043e\u0442\u0447\u0451\u0442\u0430'}</label>
            <input type="text" value={form.report_number} onChange={e => setForm(prev => ({ ...prev, report_number: e.target.value }))} style={inputStyle} />
          </div>

          {/* 9. \u0421\u0442\u0430\u0442\u0443\u0441 \u043e\u0442\u0447\u0451\u0442\u0430 */}
          <div>
            <label style={labelStyle}>{'\u0421\u0442\u0430\u0442\u0443\u0441 \u043e\u0442\u0447\u0451\u0442\u0430'}</label>
            <select value={form.report_status} onChange={e => setForm(prev => ({ ...prev, report_status: e.target.value }))} style={selectStyle}>
              <option value="">{'\u2014 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u2014'}</option>
              {REPORT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 10. \u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e */}
          <div>
            <label style={labelStyle}>{'\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e'}</label>
            <select value={form.direction} onChange={e => setForm(prev => ({ ...prev, direction: e.target.value }))} style={selectStyle}>
              <option value="">{'\u2014 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u2014'}</option>
              {DIRECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 6. \u0414\u0430\u0442\u044b \u0440\u0430\u0431\u043e\u0442 */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{'\u0414\u0430\u0442\u044b \u0440\u0430\u0431\u043e\u0442 (\u0434\u043e 6 \u043f\u0435\u0440\u0438\u043e\u0434\u043e\u0432)'}</label>
            {(form.date_ranges || []).map((range, idx) => (
              <div key={idx} className="date-range-row">
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{idx + 1}.</span>
                <input type="date" value={range.from} onChange={e => updateDateRange(idx, 'from', e.target.value)} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{'\u043f\u043e'}</span>
                <input type="date" value={range.to} onChange={e => updateDateRange(idx, 'to', e.target.value)} />
                <button type="button" onClick={() => removeDateRange(idx)}>{'\u2715'}</button>
              </div>
            ))}
            {(form.date_ranges || []).length < 6 && (
              <button
                type="button"
                onClick={addDateRange}
                style={{ marginTop: 4, padding: '4px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                + {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0435\u0440\u0438\u043e\u0434'}
              </button>
            )}
          </div>

          {/* 7. \u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438 */}
          <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
            <label style={labelStyle}>{'\u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438 (\u043c\u0443\u043b\u044c\u0442\u0438-\u0432\u044b\u0431\u043e\u0440)'}</label>
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
                      >{'\u00d7'}</span>
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#9ca3af' }}>{'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0435\u0439...'}</span>
                )}
              </div>
              {showExecutors && (
                <div className="executor-dropdown">
                  {allUsers.length === 0 ? (
                    <div style={{ padding: '12px', color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439...'}</div>
                  ) : (
                    allUsers.map(u => (
                      <div
                        key={u.username}
                        className="executor-option"
                        onClick={() => toggleExecutor(u.username)}
                      >
                        <input
                          type="checkbox"
                          checked={(form.executor_ids || []).includes(u.username)}
                          readOnly
                          style={{ accentColor: '#2563eb' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{u.username}</span>
                        {u.isAdmin && <span style={{ fontSize: 10, color: '#2563eb' }}>{'\u0430\u0434\u043c\u0438\u043d'}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 11. \u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435 */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{'\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435'}</label>
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
            {'\u041e\u0442\u043c\u0435\u043d\u0430'}
          </button>
          <button
            onClick={() => onSave({ ...form, updated_at: new Date().toISOString() })}
            style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {'\ud83d\udcbe'} {'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}
          </button>
        </div>
      </div>
    </div>
  );
}
