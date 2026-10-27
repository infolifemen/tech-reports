'use client';

import { useState } from 'react';
import { X, Archive } from 'lucide-react';

export interface ArchiveObject {
  id: string;
  object: string;
  service_type: string;
  equipment: string;
  count: number; // количество отчётов по этому объекту
}

interface ArchiveModalProps {
  objects: ArchiveObject[];
  archivedIds: string[];
  onArchive: (ids: string[]) => void;
  onUnarchive: (ids: string[]) => void;
  onClose: () => void;
}

export function ArchiveModal({
  objects,
  archivedIds,
  onArchive,
  onUnarchive,
  onClose,
}: ArchiveModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeObjects = objects.filter(o => !archivedIds.includes(o.id));
  const archivedObjects = objects.filter(o => archivedIds.includes(o.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchive = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    onArchive(ids);
    setSelectedIds(new Set());
    onClose();
  };

  const handleUnarchive = () => {
    const ids = Array.from(selectedIds);
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
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg max-h-[85vh] overflow-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Archive size={20} className="text-amber-400" />
            Архивирование объектов
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Активные объекты — для архивирования */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-300">
                📋 Активные объекты ({activeObjects.length})
              </label>
              {activeObjects.length > 0 && (
                <button
                  onClick={() => selectAll(activeObjects.map(o => o.id))}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Выбрать все
                </button>
              )}
            </div>
            {activeObjects.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4 bg-slate-800/50 rounded-lg">
                Нет активных объектов
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-auto">
                {activeObjects.map((obj) => (
                  <label
                    key={obj.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: selectedIds.has(obj.id) ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.2)',
                      border: selectedIds.has(obj.id) ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(obj.id)}
                      onChange={() => toggleSelect(obj.id)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {obj.object}
                      </div>
                      {(obj.service_type || obj.equipment) && (
                        <div className="text-xs text-slate-500 truncate">
                          {[obj.service_type, obj.equipment].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {obj.count} отч.
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Архивные объекты — для восстановления */}
          {archivedObjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-300">
                  📦 В архиве ({archivedObjects.length})
                </label>
                <button
                  onClick={() => selectAll(archivedObjects.map(o => o.id))}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Выбрать все
                </button>
              </div>
              <div className="space-y-1 max-h-36 overflow-auto">
                {archivedObjects.map((obj) => (
                  <label
                    key={obj.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: selectedIds.has(obj.id) ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.2)',
                      border: selectedIds.has(obj.id) ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                      opacity: 0.7,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(obj.id)}
                      onChange={() => toggleSelect(obj.id)}
                      className="w-4 h-4 rounded accent-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-400 truncate">
                        {obj.object}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
          >
            Отмена
          </button>
          {archivedObjects.some(o => selectedIds.has(o.id)) && (
            <button
              onClick={handleUnarchive}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              ↩ Восстановить ({Array.from(selectedIds).filter(id => archivedIds.includes(id)).length})
            </button>
          )}
          {activeObjects.some(o => selectedIds.has(o.id)) && (
            <button
              onClick={handleArchive}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              📦 В архив ({Array.from(selectedIds).filter(id => !archivedIds.includes(id)).length})
            </button>
          )}
          {selectedIds.size === 0 && (
            <button
              disabled
              className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-600 rounded-lg font-medium cursor-not-allowed"
            >
              Выберите объекты
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
