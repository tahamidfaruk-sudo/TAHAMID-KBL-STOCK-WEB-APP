import React, { useState } from 'react';
import {
  Warehouse,
  MapPin,
  User,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  BarChart3,
  Scale,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ColdStorage } from '../../types';
import { matchesUniversalSearch } from '../../utils/searchUtils';

export const ColdStorageListView: React.FC = () => {
  const {
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    addColdStorage,
    updateColdStorage,
    deleteColdStorage,
    addToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStorage, setEditingStorage] = useState<ColdStorage | null>(null);
  const [viewingStorage, setViewingStorage] = useState<ColdStorage | null>(null);
  const [deletingStorage, setDeletingStorage] = useState<ColdStorage | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<ColdStorage, 'id'>>({
    code: '',
    name: '',
    location: '',
    district: '',
    capacity: 50000,
    rentPerBag: 140,
    contactPerson: '',
    contactPhone: '',
    status: 'active',
    remarks: '',
  });

  const resetFilters = () => {
    setSearchTerm('');
    setDistrictFilter('');
    setStatusFilter('all');
    addToast('Cold storage filters reset', 'info');
  };

  // Districts for dropdown
  const uniqueDistricts = Array.from(
    new Set(coldStorages.map((c) => c.district || c.location).filter(Boolean))
  );

  // Filtered List
  const filtered = coldStorages.filter((c) => {
    const matchesSearch = matchesUniversalSearch(c, searchTerm, [
      c.name,
      c.code,
      c.location,
      c.district,
      c.contactPerson,
      c.contactPhone,
      c.capacity,
    ]);
    const matchesDistrict = districtFilter ? (c.district || c.location) === districtFilter : true;
    const matchesStatus =
      statusFilter === 'all' ? true : (c.status || 'active') === statusFilter;
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  // Calculate Aggregates
  const totalCapacity = coldStorages.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalCurrentStock = coldStorages.reduce((sum, cs) => {
    const inBags = stockTransactions
      .filter((s) => s.coldStorageId === cs.id)
      .reduce((acc, s) => acc + (s.sackQuantity || 0), 0);
    const outBags = deliveryTransactions
      .filter((d) => d.coldStorageId === cs.id)
      .reduce((acc, d) => acc + (d.sackQuantity || d.quantity || 0), 0);
    return sum + Math.max(0, inBags - outBags);
  }, 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalCurrentStock / totalCapacity) * 100) : 0;

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStorage(null);
    const nextNum = coldStorages.length + 1;
    const autoCode = `CS-${nextNum.toString().padStart(3, '0')}`;
    setFormData({
      code: autoCode,
      name: '',
      location: '',
      district: '',
      capacity: 50000,
      rentPerBag: 140,
      contactPerson: '',
      contactPhone: '',
      status: 'active',
      remarks: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (storage: ColdStorage) => {
    setEditingStorage(storage);
    setFormData({
      code: storage.code || '',
      name: storage.name || '',
      location: storage.location || '',
      district: storage.district || '',
      capacity: storage.capacity || 10000,
      rentPerBag: storage.rentPerBag || 140,
      contactPerson: storage.contactPerson || '',
      contactPhone: storage.contactPhone || storage.phone || '',
      status: storage.status || 'active',
      remarks: storage.remarks || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Handle Form Submit (Add or Update)
  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Cold storage name is required', 'warning');
      return;
    }
    if (!formData.code.trim()) {
      addToast('Facility code is required', 'warning');
      return;
    }
    if (formData.capacity <= 0) {
      addToast('Capacity must be greater than 0', 'warning');
      return;
    }

    if (editingStorage) {
      updateColdStorage(editingStorage.id, formData);
      addToast(`Updated facility "${formData.name}" successfully!`, 'success');
    } else {
      addColdStorage(formData);
      addToast(`Added new cold storage "${formData.name}"!`, 'success');
    }
    setIsAddEditModalOpen(false);
    setEditingStorage(null);
  };

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (!deletingStorage) return;
    deleteColdStorage(deletingStorage.id);
    addToast(`Facility "${deletingStorage.name}" moved to Recycle Bin`, 'info');
    setDeletingStorage(null);
  };

  // Helper to compute specific facility statistics
  const getStorageMetrics = (cs: ColdStorage) => {
    const inSacks = stockTransactions
      .filter((s) => s.coldStorageId === cs.id)
      .reduce((acc, s) => acc + (s.sackQuantity || 0), 0);
    const outSacks = deliveryTransactions
      .filter((d) => d.coldStorageId === cs.id)
      .reduce((acc, d) => acc + (d.sackQuantity || d.quantity || 0), 0);
    const inTransactionsCount = stockTransactions.filter((s) => s.coldStorageId === cs.id).length;
    const outTransactionsCount = deliveryTransactions.filter((d) => d.coldStorageId === cs.id).length;
    const currentBags = Math.max(0, inSacks - outSacks);
    const capacityBags = cs.capacity || 10000;
    const occupancyPct = Math.min(100, Math.round((currentBags / capacityBags) * 100));
    const availableBags = Math.max(0, capacityBags - currentBags);

    return {
      currentBags,
      capacityBags,
      occupancyPct,
      availableBags,
      inSacks,
      outSacks,
      inTransactionsCount,
      outTransactionsCount,
    };
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card: strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            COLD STORAGES
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase font-mono">
            {filtered.length} FACILITIES
          </span>
        </div>

        {/* Action Button: Add Cold Storage */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD COLD STORAGE</span>
        </button>
      </div>

      {/* 2. Aggregate KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              TOTAL UNITS
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {coldStorages.length}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              TOTAL CAPACITY
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalCapacity.toLocaleString()} <span className="text-xs font-medium text-slate-400">Bags</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              CURRENT STORED
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalCurrentStock.toLocaleString()} <span className="text-xs font-medium text-slate-400">Bags</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              AVG OCCUPANCY
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {overallOccupancy}%
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar: Strictly matching Cold Storage Wise Summary section colors & button styles */}
      <div className="bg-slate-200/85 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 font-medium shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* District dropdown */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase cursor-pointer shadow-2xs"
            >
              <option value="">ALL LOCATIONS</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase cursor-pointer shadow-2xs"
            >
              <option value="all">ALL STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold uppercase"
              title="Reset search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Warehouse className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">No Cold Storage Facilities Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new facility.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs uppercase cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD COLD STORAGE</span>
            </button>
          </div>
        ) : (
          filtered.map((cs) => {
            const m = getStorageMetrics(cs);

            return (
              <div
                key={cs.id}
                className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-sky-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Name, Code & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                          {cs.code || 'CS'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                          {cs.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cs.location || cs.district || 'Location Not Specified'}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        (cs.status || 'active') === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40'
                      }`}
                    >
                      {cs.status || 'ACTIVE'}
                    </span>
                  </div>

                  {/* Progress Bar & Occupancy */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                        Occupancy
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {m.occupancyPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.occupancyPct > 90
                            ? 'bg-rose-500'
                            : m.occupancyPct > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${m.occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Current Stock</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                        {m.currentBags.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">Bags</span>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Capacity</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                        {m.capacityBags.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">Bags</span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Manager info */}
                  {cs.contactPerson && (
                    <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-medium truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cs.contactPerson}</span>
                      </span>
                      {cs.contactPhone && (
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">
                          {cs.contactPhone}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Card Bottom Action Buttons (View, Edit, Delete) */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  {/* View Details */}
                  <button
                    type="button"
                    onClick={() => setViewingStorage(cs)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer uppercase"
                    title="View facility details and lot history"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>VIEW</span>
                  </button>

                  {/* Edit / Update */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cs)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-lg text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer uppercase"
                    title="Edit facility settings"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>EDIT</span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeletingStorage(cs)}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer shrink-0"
                    title="Delete facility and move to Recycle Bin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL 1: ADD OR EDIT COLD STORAGE --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingStorage ? 'EDIT COLD STORAGE' : 'ADD NEW COLD STORAGE'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingStorage ? `Update parameters for ${editingStorage.name}` : 'Register a new storage facility'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveStorage} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Facility Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              {/* Location and District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Capacity & Rent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Total Capacity (Bags) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Rent Per Bag (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rentPerBag || 0}
                    onChange={(e) => setFormData({ ...formData, rentPerBag: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Manager & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contact Person / Manager
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
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
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer"
                >
                  {editingStorage ? 'UPDATE FACILITY' : 'SAVE FACILITY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: VIEW DETAILS MODAL --- */}
      {viewingStorage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {viewingStorage.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    CODE: {viewingStorage.code} • {viewingStorage.district || viewingStorage.location}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingStorage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {(() => {
              const m = getStorageMetrics(viewingStorage);
              return (
                <div className="p-5 space-y-4 text-xs">
                  {/* Status & Capacity Overview */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Current Occupancy Level
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {m.occupancyPct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.occupancyPct > 90
                            ? 'bg-rose-500'
                            : m.occupancyPct > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${m.occupancyPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Capacity</p>
                        <p className="font-mono font-black text-slate-800 dark:text-slate-200 mt-0.5">
                          {m.capacityBags.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Stored Bags</p>
                        <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {m.currentBags.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Free Space</p>
                        <p className="font-mono font-black text-sky-600 dark:text-sky-400 mt-0.5">
                          {m.availableBags.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Stats */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Inbound Lots</p>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
                        {m.inTransactionsCount} Entries
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {m.inSacks.toLocaleString()} total bags received
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Dispatches</p>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
                        {m.outTransactionsCount} Deliveries
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {m.outSacks.toLocaleString()} total bags delivered
                      </p>
                    </div>
                  </div>

                  {/* Contact & Location Details */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Address:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                        {viewingStorage.location || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">District:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {viewingStorage.district || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Supervisor / Manager:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {viewingStorage.contactPerson || 'Not Assigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Contact Phone:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {viewingStorage.contactPhone || viewingStorage.phone || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Rental Rate:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        ৳{viewingStorage.rentPerBag || 0} / Bag
                      </span>
                    </div>

                    {viewingStorage.remarks && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold uppercase block text-[10px] text-slate-400 mb-0.5">Notes:</span>
                        {viewingStorage.remarks}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingStorage(null)}
                      className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                    >
                      CLOSE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingStorage;
                        setViewingStorage(null);
                        handleOpenEdit(target);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>EDIT FACILITY</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- MODAL 3: DELETE CONFIRMATION MODAL --- */}
      {deletingStorage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE COLD STORAGE
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingStorage.name}"</span>?
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  This facility will be moved to the Recycle Bin and can be restored anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingStorage(null)}
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
