'use client';

import { useState } from 'react';
import type { TechReport } from '@/lib/types';

interface ArchiveModalProps {
  reports: TechReport[];
  onArchive: (ids: string[]) => void;
  onUnarchive: (ids: string[]) => void;
  onClose: () => void;
}

export default function ArchiveModal({ reports, onArchive, onUnarchive, onClose }: ArchiveModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeReports = reports.filter(r => !r.archived);
  const archivedReports = reports.filter(r => r.archived);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchive = () => {
    const ids = Array.from(selectedIds).filter(id => !reports.find(r => r.id === id)?.archived);
    if (ids.length === 0) return;
    onArchive(ids);
    setSelectedIds(new Set());
    onClose();
  };

  const handleUnarchive = () => {
    const ids = Array.from(selectedIds).filter(id => reports.find(r => r.id === id)?.archived);
    if (ids.length === 0) return;
    onUnarchive(ids);
    setSelectedIds(new Set());
    onClose();
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[85vh] overflow-auto fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {'\ud83d\udce6'} {'\u0410\u0440\u0445\u0438\u0432 \u043e\u0442\u0447\u0451\u0442\u043e\u0432'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* \u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u043e\u0442\u0447\u0451\u0442\u044b */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                {'\ud83d\udccb'} {'\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u043e\u0442\u0447\u0451\u0442\u044b'} ({activeReports.length})
              </label>
              {activeReports.length > 0 && (
                <button
                  onClick={() => selectAll(activeReports.map(r => r.id))}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  {'\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0432\u0441\u0435'}
                </button>
              )}
            </div>
            {activeReports.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                {'\u041d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043e\u0442\u0447\u0451\u0442\u043e\u0432'}
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-auto">
                {activeReports.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: selectedIds.has(r.id) ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.02)',
                      border: selectedIds.has(r.id) ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {r.object} {'\u2014'} {r.service_type}
                      </div>
                      {r.report_number && (
                        <div className="text-xs text-gray-400 truncate">
                          {'\u2116'} {r.report_number} | {r.executor}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* \u0410\u0440\u0445\u0438\u0432\u043d\u044b\u0435 \u043e\u0442\u0447\u0451\u0442\u044b */}
          {archivedReports.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  {'\ud83d\udce6'} {'\u0412 \u0430\u0440\u0445\u0438\u0432\u0435'} ({archivedReports.length})
                </label>
                <button
                  onClick={() => selectAll(archivedReports.map(r => r.id))}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  {'\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0432\u0441\u0435'}
                </button>
              </div>
              <div className="space-y-1 max-h-36 overflow-auto">
                {archivedReports.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: selectedIds.has(r.id) ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.02)',
                      border: selectedIds.has(r.id) ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                      opacity: 0.7,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded accent-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-500 truncate">
                        {r.object} {'\u2014'} {r.service_type}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            {'\u041e\u0442\u043c\u0435\u043d\u0430'}
          </button>
          {archivedReports.some(r => selectedIds.has(r.id)) && (
            <button
              onClick={handleUnarchive}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              {'\u21a9'} {'\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c'} ({Array.from(selectedIds).filter(id => reports.find(r => r.id === id)?.archived).length})
            </button>
          )}
          {activeReports.some(r => selectedIds.has(r.id)) && (
            <button
              onClick={handleArchive}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              {'\ud83d\udce6'} {'\u0412 \u0430\u0440\u0445\u0438\u0432'} ({Array.from(selectedIds).filter(id => !reports.find(r => r.id === id)?.archived).length})
            </button>
          )}
          {selectedIds.size === 0 && (
            <button
              disabled
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
            >
              {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0442\u0447\u0451\u0442\u044b'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
