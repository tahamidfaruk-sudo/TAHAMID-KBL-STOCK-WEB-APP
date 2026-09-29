import React, { useState } from 'react';
import {
  Sliders,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Layers,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { Variety, SeedClass, Grade, ProductionBlock } from '../../types';

export const MasterDataView: React.FC = () => {
  const {
    varieties,
    addVariety,
    updateVariety,
    deleteVariety,
    seedClasses,
    addSeedClass,
    updateSeedClass,
    deleteSeedClass,
    grades,
    addGrade,
    updateGrade,
    deleteGrade,
    productionBlocks,
    addProductionBlock,
    updateProductionBlock,
    deleteProductionBlock,
    addToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'varieties' | 'classes' | 'grades' | 'blocks'>('varieties');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: string; data: any } | null>(null);
  const [viewingItem, setViewingItem] = useState<{ type: string; data: any } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: string; name: string } | null>(null);

  // Unified Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSizeSpec, setFormSizeSpec] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const resetFilters = () => {
    setSearchTerm('');
    addToast('Master data search reset', 'info');
  };

  const getFilteredItems = () => {
    switch (activeSubTab) {
      case 'varieties':
        return varieties.filter((v) =>
          matchesUniversalSearch(v, searchTerm, [v.name, v.code, v.description])
        );
      case 'classes':
        return seedClasses.filter((c) =>
          matchesUniversalSearch(c, searchTerm, [c.name, c.code, c.description])
        );
      case 'grades':
        return grades.filter((g) =>
          matchesUniversalSearch(g, searchTerm, [g.name, g.code, g.sizeSpec])
        );
      case 'blocks':
        return productionBlocks.filter((b) =>
          matchesUniversalSearch(b, searchTerm, [b.name, b.code, b.district, b.location])
        );
    }
  };

  const currentItems = getFilteredItems();

  const getTabLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'varieties':
        return 'VARIETY';
      case 'classes':
        return 'SEED CLASS';
      case 'grades':
        return 'GRADE';
      case 'blocks':
        return 'BLOCK';
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setFormSizeSpec('');
    setFormDistrict('');
    setFormLocation('');
    setFormStatus('active');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem({ id: item.id, type: activeSubTab, data: item });
    setFormName(item.name || '');
    setFormCode(item.code || '');
    setFormDesc(item.description || '');
    setFormSizeSpec(item.sizeSpec || '');
    setFormDistrict(item.district || '');
    setFormLocation(item.location || '');
    setFormStatus(item.status || 'active');
    setIsAddEditModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Name is required', 'warning');
      return;
    }

    if (activeSubTab === 'varieties') {
      const payload: Omit<Variety, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateVariety(editingItem.id, payload);
        addToast(`Variety "${formName}" updated successfully!`, 'success');
      } else {
        addVariety(payload);
        addToast(`Variety "${formName}" created!`, 'success');
      }
    } else if (activeSubTab === 'classes') {
      const payload: Omit<SeedClass, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateSeedClass(editingItem.id, payload);
        addToast(`Seed Class "${formName}" updated!`, 'success');
      } else {
        addSeedClass(payload);
        addToast(`Seed Class "${formName}" created!`, 'success');
      }
    } else if (activeSubTab === 'grades') {
      const payload: Omit<Grade, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        sizeSpec: formSizeSpec.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateGrade(editingItem.id, payload);
        addToast(`Grade "${formName}" updated!`, 'success');
      } else {
        addGrade(payload);
        addToast(`Grade "${formName}" created!`, 'success');
      }
    } else if (activeSubTab === 'blocks') {
      const payload: Omit<ProductionBlock, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        district: formDistrict.trim() || undefined,
        location: formLocation.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateProductionBlock(editingItem.id, payload);
        addToast(`Production Block "${formName}" updated!`, 'success');
      } else {
        addProductionBlock(payload);
        addToast(`Production Block "${formName}" created!`, 'success');
      }
    }

    setIsAddEditModalOpen(false);
    setEditingItem(null);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    const { id, type, name } = deletingItem;

    if (type === 'varieties') {
      deleteVariety(id);
      addToast(`Variety "${name}" deleted`, 'info');
    } else if (type === 'classes') {
      deleteSeedClass(id);
      addToast(`Seed Class "${name}" deleted`, 'info');
    } else if (type === 'grades') {
      deleteGrade(id);
      addToast(`Grade "${name}" deleted`, 'info');
    } else if (type === 'blocks') {
      deleteProductionBlock(id);
      addToast(`Block "${name}" deleted`, 'info');
    }

    setDeletingItem(null);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-amber-600 dark:bg-amber-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            MASTER DATA
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
            {currentItems.length} ITEMS
          </span>
        </div>

        {/* Action: Add Master Item */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD {getTabLabel(activeSubTab)}</span>
        </button>
      </div>

      {/* 2. Sub Tabs & Category Navigator */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('varieties')}
            className={`px-3 py-1.5 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
              activeSubTab === 'varieties'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            VARIETIES ({varieties.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('classes')}
            className={`px-3 py-1.5 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
              activeSubTab === 'classes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            CLASSES ({seedClasses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('grades')}
            className={`px-3 py-1.5 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
              activeSubTab === 'grades'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            GRADES ({grades.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('blocks')}
            className={`px-3 py-1.5 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
              activeSubTab === 'blocks'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            BLOCKS ({productionBlocks.length})
          </button>
        </div>
      </div>

      {/* 3. Filter and Search Bar matching Cold Storage Wise Summary styling */}
      <div className="flex items-center justify-between gap-2.5 p-3 bg-slate-200/85 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs text-slate-800 dark:text-slate-100 no-print">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-2xs"
          />
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold uppercase"
          title="Reset search"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* 4. Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {currentItems.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Sliders className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
              No matching {getTabLabel(activeSubTab)} records found.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs uppercase cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD NEW {getTabLabel(activeSubTab)}</span>
            </button>
          </div>
        ) : (
          currentItems.map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 dark:text-white uppercase block truncate">
                      {item.name}
                    </span>
                    {item.code && (
                      <span className="inline-block mt-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
                        {item.code}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      (item.status || 'active') === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Sub details */}
                <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.sizeSpec && (
                    <p className="font-mono text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                      Size: {item.sizeSpec}
                    </p>
                  )}
                  {item.district && (
                    <p className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.district} {item.location ? `(${item.location})` : ''}</span>
                    </p>
                  )}
                  {item.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewingItem({ type: activeSubTab, data: item })}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer uppercase"
                  title="View details"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>VIEW</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/70 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer uppercase"
                  title="Edit item"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>EDIT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingItem({ id: item.id, type: activeSubTab, name: item.name })}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer shrink-0"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingItem ? `EDIT ${getTabLabel(activeSubTab)}` : `ADD NEW ${getTabLabel(activeSubTab)}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Code / ID
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Specific fields based on sub tab */}
              {activeSubTab === 'grades' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Size Specification
                  </label>
                  <input
                    type="text"
                    value={formSizeSpec}
                    onChange={(e) => setFormSizeSpec(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              )}

              {activeSubTab === 'blocks' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Location / Upazila
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer"
                >
                  {editingItem ? 'UPDATE' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW DETAILS MODAL --- */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                  {viewingItem.data.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">CATEGORY:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{viewingItem.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">CODE:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{viewingItem.data.code || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">STATUS:</span>
                <span className="font-bold text-emerald-600 uppercase">{viewingItem.data.status || 'ACTIVE'}</span>
              </div>
              {viewingItem.data.sizeSpec && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase">SIZE SPEC:</span>
                  <span className="font-mono font-bold text-teal-600">{viewingItem.data.sizeSpec}</span>
                </div>
              )}
              {viewingItem.data.district && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase">DISTRICT:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{viewingItem.data.district}</span>
                </div>
              )}
              {viewingItem.data.description && (
                <div className="py-1">
                  <span className="text-slate-400 font-bold uppercase block mb-1">DESCRIPTION:</span>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                    {viewingItem.data.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-xs cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE RECORD
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingItem.name}"</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
