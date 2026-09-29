import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity, DeliveryTransaction } from '../../types';
import {
  Truck,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { sortData } from '../../utils/sortUtils';
import { TablePagination } from '../common/TablePagination';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { DateRangePicker } from '../common/DateRangePicker';
import { SortIcon } from '../common/SortIcon';
import { ColumnHeaderFilter } from '../common/ColumnHeaderFilter';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { DeliveryModal } from './DeliveryModal';
import { RecordDetailsModal } from '../common/RecordDetailsModal';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DeliveryRegisterView: React.FC = () => {
  const {
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
    deleteDeliveryTransaction,
    openConfirmationDialog,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modal states for CRUD
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DeliveryTransaction | null>(null);
  const [viewingRecord, setViewingRecord] = useState<DeliveryTransaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStorage('');
    setSelectedVariety('');
    setSelectedClass('');
    setSelectedGrade('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    addToast?.('Delivery filters reset', 'info');
  };

  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(selectedStorage),
    Boolean(selectedVariety),
    Boolean(selectedClass),
    Boolean(selectedGrade),
    Boolean(selectedType),
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Filtered dataset
  const filteredList = useMemo(() => {
    return deliveryTransactions.filter((d) => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      if (selectedStorage && d.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && d.varietyId !== selectedVariety) return false;
      if (selectedClass && d.classId !== selectedClass) return false;
      if (selectedGrade && d.gradeId !== selectedGrade) return false;
      if (selectedType && d.potatoTypeId !== selectedType) return false;

      const csName = coldStorages.find((c) => c.id === d.coldStorageId)?.name || '';
      const vName = varieties.find((v) => v.id === d.varietyId)?.name || '';
      const cName = seedClasses.find((c) => c.id === d.classId)?.name || '';
      const gName = grades.find((g) => g.id === d.gradeId)?.name || '';
      const tName = potatoTypes.find((t) => t.id === d.potatoTypeId)?.name || '';
      const srRef = d.srNo || d.deliveryReference || '';

      if (
        !matchesUniversalSearch(d, searchQuery, [
          csName,
          vName,
          cName,
          gName,
          tName,
          srRef,
          d.customerReceiver,
          d.deliveryNo,
        ])
      ) {
        return false;
      }

      return true;
    });
  }, [
    deliveryTransactions,
    startDate,
    endDate,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedType,
    searchQuery,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
  ]);

  // Sort base data
  const sortedList = useMemo(() => {
    const sorted = sortData(filteredList, sortKey, sortDir);
    return sorted.map((d, index) => {
      const kgPerBag = d.kgPerBag || 50;
      const totalKgOut = d.totalKg || d.sackQuantity * kgPerBag;
      const totalMtOut = d.totalMt || Number((totalKgOut / 1000).toFixed(3));
      const bagsOut = d.sackQuantity;

      const csName = coldStorages.find((c) => c.id === d.coldStorageId)?.name || '-';
      const vName = varieties.find((v) => v.id === d.varietyId)?.name || '-';
      const cName = seedClasses.find((c) => c.id === d.classId)?.name || '-';
      const gName = grades.find((g) => g.id === d.gradeId)?.name || '-';
      const tName =
        potatoTypes.find((t) => t.id === d.potatoTypeId)?.name || 'Seed Potato';
      const srNo = d.srNo || d.deliveryReference || '-';

      return {
        ...d,
        sl: index + 1,
        date: d.date,
        storageName: csName,
        srNo,
        varietyName: vName,
        className: cName,
        gradeName: gName,
        bagsOut,
        kgPerBag,
        totalKgOut,
        totalMtOut,
        typeName: tName,
      };
    });
  }, [filteredList, sortKey, sortDir, coldStorages, varieties, seedClasses, grades, potatoTypes]);

  // Totals
  const totals = useMemo(() => {
    const totalBagsOut = sortedList.reduce((acc, row) => acc + row.bagsOut, 0);
    const totalKg = sortedList.reduce((acc, row) => acc + row.totalKgOut, 0);
    const totalMt = Number((totalKg / 1000).toFixed(3));
    return {
      totalBagsOut,
      totalKg,
      totalMt,
    };
  }, [sortedList]);

  // Paginated records
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  // CRUD Actions
  const handleAddNew = () => {
    setEditingRecord(null);
    setIsDeliveryModalOpen(true);
  };

  const handleEdit = (record: DeliveryTransaction) => {
    setEditingRecord(record);
    setIsDeliveryModalOpen(true);
  };

  const handleDelete = (record: DeliveryTransaction) => {
    openConfirmationDialog({
      title: 'DELETE DELIVERY RECORD',
      message: `Are you sure you want to delete Delivery record "${record.deliveryNo || record.srNo}"? This item will be safely moved to the Recycle Bin.`,
      confirmText: 'DELETE DELIVERY',
      cancelText: 'CANCEL',
      onConfirm: () => {
        deleteDeliveryTransaction(record.id);
        addToast?.(`Deleted Delivery ${record.deliveryNo || record.srNo}. Moved to Recycle Bin.`, 'info');
      },
    });
  };

  // Density paddings
  const cellPadding =
    density === 'compact'
      ? 'px-2 py-1.5 text-xs'
      : density === 'comfortable'
      ? 'px-3 py-2.5 text-xs sm:text-sm'
      : 'px-2.5 py-2 text-xs';

  const thPadding =
    density === 'compact'
      ? 'px-2 py-2 text-[11px]'
      : density === 'comfortable'
      ? 'px-3 py-3 text-xs'
      : 'px-2.5 py-2.5 text-[11px]';

  // Excel Export
  const handleExportExcel = () => {
    const exportData = sortedList.map((row) => ({
      sl: row.sl,
      date: formatDisplayDate(row.date),
      storageName: row.storageName,
      srNo: row.srNo,
      varietyName: row.varietyName,
      className: row.className,
      gradeName: row.gradeName,
      bagsOut: row.bagsOut,
      kgPerBag: row.kgPerBag,
      totalKgOut: row.totalKgOut,
      totalMtOut: row.totalMtOut,
      typeName: row.typeName,
    }));

    const columns = [
      { header: '#', key: 'sl', width: 6 },
      { header: 'DATE', key: 'date', width: 14 },
      { header: 'COLD STORAGE NAME', key: 'storageName', width: 28 },
      { header: 'DELIVERY AGAINST ISSUED SR NO', key: 'srNo', width: 30 },
      { header: 'VARIETY', key: 'varietyName', width: 18 },
      { header: 'CLASS', key: 'className', width: 18 },
      { header: 'GRADE', key: 'gradeName', width: 16 },
      { header: 'NO OF BAG OUT', key: 'bagsOut', width: 16 },
      { header: 'KG PER BAG', key: 'kgPerBag', width: 14 },
      { header: 'TOTAL KG OUT', key: 'totalKgOut', width: 18 },
      { header: 'TOTAL MT OUT', key: 'totalMtOut', width: 16 },
      { header: 'POTATO TYPE', key: 'typeName', width: 18 },
    ];

    exportToExcel(
      exportData,
      columns,
      `DELIVERY_ALL_RECORD_${companySettings?.fiscalYear || '2024'}`,
      'DELIVERY ALL RECORD',
      companySettings,
      `Generated on ${new Date().toLocaleDateString('en-GB')}`
    );
    addToast?.('Delivery All Record exported to Excel successfully!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData = sortedList.map((row) => ({
      sl: String(row.sl),
      date: formatDisplayDate(row.date),
      storageName: row.storageName,
      srNo: row.srNo,
      varietyName: row.varietyName,
      className: row.className,
      gradeName: row.gradeName,
      bagsOut: row.bagsOut.toLocaleString(),
      kgPerBag: String(row.kgPerBag),
      totalKgOut: row.totalKgOut.toLocaleString(),
      totalMtOut: row.totalMtOut.toFixed(3),
      typeName: row.typeName,
    }));

    const columns = [
      { header: '#', key: 'sl' },
      { header: 'DATE', key: 'date' },
      { header: 'COLD STORAGE NAME', key: 'storageName' },
      { header: 'DELIVERY AGAINST ISSUED SR NO', key: 'srNo' },
      { header: 'VARIETY', key: 'varietyName' },
      { header: 'CLASS', key: 'className' },
      { header: 'GRADE', key: 'gradeName' },
      { header: 'NO OF BAG OUT', key: 'bagsOut' },
      { header: 'KG PER BAG', key: 'kgPerBag' },
      { header: 'TOTAL KG OUT', key: 'totalKgOut' },
      { header: 'TOTAL MT OUT', key: 'totalMtOut' },
      { header: 'POTATO TYPE', key: 'typeName' },
    ];

    exportToPdf(
      exportData,
      columns,
      `DELIVERY_ALL_RECORD_${companySettings?.fiscalYear || '2024'}`,
      'DELIVERY ALL RECORD',
      companySettings,
      `FY: ${companySettings?.fiscalYear || '2024-2025'}`
    );
    addToast?.('Delivery All Record exported as PDF!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-amber-600 dark:bg-amber-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DELIVERY ALL RECORD
          </h2>
        </div>

        {/* Action Controls: New Entry, Density & Exports */}
        <div className="flex items-center flex-wrap gap-2">
          {/* New Delivery Button */}
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NEW DELIVERY</span>
          </button>

          {/* Density Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'compact'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'normal'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'comfortable'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          <ReportButtonGroup
            iconOnly={true}
            onPrint={() => setIsPreviewOpen(true)}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        </div>
      </div>

      {/* Filter Toolbar Card: Strictly matching Dashboard Cold Storage Wise Summary section colors & button styles */}
      <div className="bg-slate-200/85 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 px-3"
            title="Clear all filters across the entire table"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase">RESET FILTERS{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-300 dark:border-slate-700">
          <div>
            <select
              value={selectedStorage}
              onChange={(e) => {
                setSelectedStorage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
            >
              <option value="">ALL STORAGES</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedVariety}
              onChange={(e) => {
                setSelectedVariety(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
            >
              <option value="">ALL VARIETIES</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
            >
              <option value="">ALL CLASSES</option>
              {seedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
            >
              <option value="">ALL GRADES</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
            >
              <option value="">ALL TYPES</option>
              {potatoTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />
          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{sortedList.length}</strong> total dispatches
          </div>
        </div>
      </div>

      {/* Main Table with CRUD Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-850 text-white font-bold border-b border-slate-700 select-none text-[10.5px]">
              <tr>
                <th className={`${thPadding} text-center font-bold uppercase tracking-wider text-slate-200 w-12`}>
                  #
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      DATE
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="date" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="DATE"
                      type="date-range"
                      startDate={startDate}
                      endDate={endDate}
                      onDateRangeChange={(s, e) => {
                        setStartDate(s);
                        setEndDate(e);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(startDate || endDate)}
                      onClearFilter={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('storageName')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      COLD STORAGE NAME
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="storageName" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="COLD STORAGE"
                      type="select"
                      options={coldStorages.map((cs) => ({ label: cs.name, value: cs.id }))}
                      value={selectedStorage}
                      onChangeValue={(val) => {
                        setSelectedStorage(val);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(selectedStorage)}
                      onClearFilter={() => setSelectedStorage('')}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('srNo')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center gap-1">
                    DELIVERY AGAINST ISSUED SR NO
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="srNo" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('varietyName')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      VARIETY
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="varietyName" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="VARIETY"
                      type="select"
                      options={varieties.map((v) => ({ label: v.name, value: v.id }))}
                      value={selectedVariety}
                      onChangeValue={(val) => {
                        setSelectedVariety(val);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(selectedVariety)}
                      onClearFilter={() => setSelectedVariety('')}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('className')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      CLASS
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="className" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="CLASS"
                      type="select"
                      options={seedClasses.map((c) => ({ label: c.name, value: c.id }))}
                      value={selectedClass}
                      onChangeValue={(val) => {
                        setSelectedClass(val);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(selectedClass)}
                      onClearFilter={() => setSelectedClass('')}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gradeName')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      GRADE
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="gradeName" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="GRADE"
                      type="select"
                      options={grades.map((g) => ({ label: g.name, value: g.id }))}
                      value={selectedGrade}
                      onChangeValue={(val) => {
                        setSelectedGrade(val);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(selectedGrade)}
                      onClearFilter={() => setSelectedGrade('')}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('bagsOut')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    NO OF BAG OUT
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="bagsOut" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('kgPerBag')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    KG PER BAG
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="kgPerBag" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('totalKgOut')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    TOTAL KG OUT
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgOut" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('totalMtOut')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    TOTAL MT OUT
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalMtOut" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('typeName')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      POTATO TYPE
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="typeName" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="POTATO TYPE"
                      type="select"
                      options={potatoTypes.map((t) => ({ label: t.name, value: t.id }))}
                      value={selectedType}
                      onChangeValue={(val) => {
                        setSelectedType(val);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(selectedType)}
                      onClearFilter={() => setSelectedType('')}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
                </th>
                <th className={`${thPadding} text-center font-bold uppercase tracking-wider text-slate-200 w-28`}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching Delivery records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className={`${cellPadding} text-center font-mono text-slate-400 font-bold`}>
                      {row.sl}
                    </td>
                    <td className={`${cellPadding} font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap`}>
                      {formatDisplayDate(row.date)}
                    </td>
                    <td className={`${cellPadding} font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap`}>
                      {row.storageName}
                    </td>
                    <td className={`${cellPadding} font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap`}>
                      {row.srNo}
                    </td>
                    <td className={`${cellPadding} text-slate-800 dark:text-slate-200 whitespace-nowrap`}>
                      {row.varietyName}
                    </td>
                    <td className={`${cellPadding} text-slate-700 dark:text-slate-300 whitespace-nowrap`}>
                      {row.className}
                    </td>
                    <td className={`${cellPadding} text-slate-700 dark:text-slate-300 whitespace-nowrap`}>
                      {row.gradeName}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-slate-900 dark:text-white`}>
                      {row.bagsOut.toLocaleString()}
                    </td>
                    <td className={`${cellPadding} text-right font-mono text-slate-600 dark:text-slate-400`}>
                      {row.kgPerBag}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-slate-900 dark:text-white`}>
                      {row.totalKgOut.toLocaleString()}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-amber-600 dark:text-amber-400`}>
                      {row.totalMtOut.toFixed(3)}
                    </td>
                    <td className={`${cellPadding} text-slate-700 dark:text-slate-300 whitespace-nowrap`}>
                      {row.typeName}
                    </td>
                    {/* Action buttons (CRUD: View, Edit, Delete) */}
                    <td className={`${cellPadding} text-center whitespace-nowrap`}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingRecord(row)}
                          className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Summary Row */}
            {sortedList.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <tr>
                  <td colSpan={7} className={`${cellPadding} text-center uppercase tracking-wider font-bold`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>TOTAL DISPATCHES ({sortedList.length} ORDERS):</span>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-right font-mono font-black text-amber-700 dark:text-amber-400`}>
                    {totals.totalBagsOut.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} text-right font-mono text-slate-400`}>-</td>
                  <td className={`${cellPadding} text-right font-mono font-black text-slate-900 dark:text-white`}>
                    {totals.totalKg.toLocaleString()} KG
                  </td>
                  <td className={`${cellPadding} text-right font-mono font-black text-amber-600 dark:text-amber-400`}>
                    {totals.totalMt.toFixed(3)} MT
                  </td>
                  <td colSpan={2} className={`${cellPadding} text-slate-400`}>-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedList.length > pageSize && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <TablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedList.length / pageSize)}
              pageSize={pageSize}
              totalRecords={sortedList.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* CRUD Entry / Edit Modal */}
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setEditingRecord(null);
        }}
        editRecord={editingRecord}
      />

      {/* View Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="DELIVERY RECORD DETAILS"
        subtitle={`Dispatch ${viewingRecord?.deliveryNo || viewingRecord?.srNo || ''}`}
        icon={<Truck className="w-5 h-5 text-amber-600" />}
        fields={
          viewingRecord
            ? [
                { label: 'DATE', value: viewingRecord.date },
                {
                  label: 'COLD STORAGE',
                  value:
                    coldStorages.find((c) => c.id === viewingRecord.coldStorageId)?.name || '-',
                },
                {
                  label: 'DELIVERY AGAINST ISSUED SR NO',
                  value: viewingRecord.srNo || viewingRecord.deliveryReference,
                  highlight: true,
                },
                {
                  label: 'VARIETY',
                  value: varieties.find((v) => v.id === viewingRecord.varietyId)?.name || '-',
                },
                {
                  label: 'SEED CLASS',
                  value: seedClasses.find((c) => c.id === viewingRecord.classId)?.name || '-',
                },
                {
                  label: 'GRADE',
                  value: grades.find((g) => g.id === viewingRecord.gradeId)?.name || '-',
                },
                {
                  label: 'POTATO TYPE',
                  value:
                    potatoTypes.find((t) => t.id === viewingRecord.potatoTypeId)?.name ||
                    'Seed Potato',
                },
                {
                  label: 'NO OF BAG OUT',
                  value: viewingRecord.sackQuantity?.toLocaleString(),
                  highlight: true,
                },
                { label: 'KG PER BAG', value: viewingRecord.kgPerBag || 50 },
                {
                  label: 'TOTAL KG OUT',
                  value: `${(
                    viewingRecord.totalKg ||
                    viewingRecord.sackQuantity * (viewingRecord.kgPerBag || 50)
                  ).toLocaleString()} KG`,
                  highlight: true,
                },
                {
                  label: 'TOTAL MT OUT',
                  value: `${(
                    viewingRecord.totalMt ||
                    (viewingRecord.sackQuantity * (viewingRecord.kgPerBag || 50)) / 1000
                  ).toFixed(3)} MT`,
                  highlight: true,
                },
                {
                  label: 'CLIENT / RECEIVER',
                  value: viewingRecord.customerReceiver || viewingRecord.clientReceiver || '-',
                },
                { label: 'STATUS', value: viewingRecord.status?.toUpperCase() || 'APPROVED' },
                { label: 'REMARKS', value: viewingRecord.remarks || '-' },
                { label: 'DISPATCHED BY', value: viewingRecord.createdBy || 'System' },
                {
                  label: 'RECORDED AT',
                  value: viewingRecord.createdAt
                    ? new Date(viewingRecord.createdAt).toLocaleString()
                    : '-',
                },
              ]
            : []
        }
      />

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentTitle="DELIVERY ALL RECORD"
        subtitle={`Complete Outbound Delivery Transaction Ledger • Fiscal Year: ${companySettings?.fiscalYear || '2024-2025'}`}
        summaryItems={[
          { label: 'Total Dispatched Bags', value: `${totals.totalBagsOut.toLocaleString()} Bags` },
          { label: 'Total Weight Out (KG)', value: `${totals.totalKg.toLocaleString()} KG` },
          { label: 'Total Weight Out (MT)', value: `${totals.totalMt.toFixed(3)} MT` },
        ]}
        onConfirmPrint={() => validateAndTriggerPrint()}
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-900 text-white font-bold uppercase">
              <tr>
                <th className="py-2 px-1.5 border border-slate-700 text-center">#</th>
                <th className="py-2 px-1.5 border border-slate-700 text-center">DATE</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">COLD STORAGE NAME</th>
                <th className="py-2 px-1.5 border border-slate-700 text-center">SR NO</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">VARIETY</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">CLASS</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">GRADE</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">BAG OUT</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">KG/BAG</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">TOTAL KG OUT</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">TOTAL MT OUT</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">POTATO TYPE</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((row, ri) => (
                <tr key={row.id} className={ri % 2 === 1 ? 'bg-slate-50/80 hover:bg-sky-50/40' : 'bg-white hover:bg-sky-50/40'}>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono">{row.sl}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono">{formatDisplayDate(row.date)}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.storageName}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono font-bold">{row.srNo}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.varietyName}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.className}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.gradeName}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono font-bold">{row.bagsOut.toLocaleString()}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono">{row.kgPerBag}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono font-bold">{row.totalKgOut.toLocaleString()}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono">{row.totalMtOut.toFixed(3)}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.typeName}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-b-2 border-slate-400">
              <tr>
                <td colSpan={7} className="py-2 px-1.5 border border-slate-300 font-black uppercase text-center tracking-wider text-slate-900">
                  TOTAL
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalBagsOut.toLocaleString()}
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">-</td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalKg.toLocaleString()}
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalMt.toFixed(3)}
                </td>
                <td className="py-2 px-1.5 border border-slate-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </PrintPreviewModal>
    </div>
  );
};
