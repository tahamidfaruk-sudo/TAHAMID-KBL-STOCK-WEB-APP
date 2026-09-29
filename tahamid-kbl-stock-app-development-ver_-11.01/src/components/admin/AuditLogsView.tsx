import React, { useState } from 'react';
import { History, Search, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchesUniversalSearch } from '../../utils/searchUtils';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const resetFilters = () => {
    setSearchTerm('');
    addToast('Audit log search reset', 'info');
  };

  const filtered = auditLogs.filter((l) =>
    matchesUniversalSearch(l, searchTerm, [l.action, l.userName, l.userEmail, l.module, l.details, l.timestamp])
  );

  return (
    <div className="space-y-4">
      {/* Header strictly following Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              AUDIT LOGS
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              User transactions, record modifications and system security trail
            </p>
          </div>
        </div>

        {/* Search & Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 uppercase"
            title="Reset search"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            SECURITY & TRANSACTION TRAIL ({filtered.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-850 text-white font-bold border-b border-slate-700 select-none">
              <tr>
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-slate-200">TIMESTAMP</th>
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-slate-200">USER</th>
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-slate-200">ACTION</th>
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-slate-200">MODULE</th>
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-slate-200">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 uppercase border border-sky-200 dark:border-sky-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap font-medium">
                      {log.module || log.entity || 'INVENTORY'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
