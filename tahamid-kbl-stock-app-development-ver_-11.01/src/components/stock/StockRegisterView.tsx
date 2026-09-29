import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity, StockTransaction } from '../../types';
import {
  Boxes,
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
import { StockEntryModal } from './StockEntryModal';
import { RecordDetailsModal } from '../common/RecordDetailsModal';
import { formatDisplayDate } from '../../utils/dateUtils';

export const StockRegisterView: React.FC = () => {
  const {
    stockTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    deleteStockTransaction,
    openConfirmationDialog,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modal states for CRUD
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StockTransaction | null>(null);
  const [viewingRecord, setViewingRecord] = useState<StockTransaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
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
    setSelectedBlock('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    addToast?.('Stock In filters reset', 'info');
  };

  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(selectedStorage),
    Boolean(selectedVariety),
    Boolean(selectedClass),
    Boolean(selectedGrade),
    Boolean(selectedBlock),
    Boolean(selectedType),
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Filtered dataset
  const filteredList = useMemo(() => {
    return stockTransactions.filter((s) => {
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      if (selectedStorage && s.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && s.varietyId !== selectedVariety) return false;
      if (selectedClass && s.classId !== selectedClass) return false;
      if (selectedGrade && s.gradeId !== selectedGrade) return false;
      if (selectedBlock && s.productionBlockId !== selectedBlock) return false;
      if (selectedType && s.potatoTypeId !== selectedType) return false;

      const csName = coldStorages.find((c) => c.id === s.coldStorageId)?.name || '';
      const vName = varieties.find((v) => v.id === s.varietyId)?.name || '';
      const cName = seedClasses.find((c) => c.id === s.classId)?.name || '';
      const gName = grades.find((g) => g.id === s.gradeId)?.name || '';
      const bName = productionBlocks.find((b) => b.id === s.productionBlockId)?.name || '';
      const tName = potatoTypes.find((t) => t.id === s.potatoTypeId)?.name || '';

      if (
        !matchesUniversalSearch(s, searchQuery, [
          csName,
          vName,
          cName,
          gName,
          bName,
          tName,
          s.kblChallanNo,
          s.srNo,
        ])
      ) {
        return false;
      }

      return true;
    });
  }, [
    stockTransactions,
    startDate,
    endDate,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedBlock,
    selectedType,
    searchQuery,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
  ]);

  // Sort base data
  const sortedList = useMemo(() => {
    const sorted = sortData(filteredList, sortKey, sortDir);
    return sorted.map((s, index) => {
      const kgPerBag = s.kgPerBag || 50;
      const totalKgIn = s.totalKg || s.sackQuantity * kgPerBag;
      const totalMtIn = s.totalMt || Number((totalKgIn / 1000).toFixed(3));
      const kblBags = s.sackQuantity;
      const srCopyBags = (s as any).srCopyBags ? Number((s as any).srCopyBags) : s.sackQuantity;

      const csName = coldStorages.find((c) => c.id === s.coldStorageId)?.name || '-';
      const varietyName = varieties.find((v) => v.id === s.varietyId)?.name || '-';
      const blockName =
        productionBlocks.find((b) => b.id === s.productionBlockId)?.name || s.farmBlock || '-';
      const typeName =
        potatoTypes.find((t) => t.id === s.potatoTypeId)?.name || 'Seed Potato';

      return {
        ...s,
        sl: index + 1,
        date: s.date,
        kblChallanNo: s.kblChallanNo || '-',
        srNo: s.srNo || '-',
        storageName: csName,
        varietyName,
        kblBags,
        srCopyBags,
        kgPerBag,
        totalKgIn,
        totalMtIn,
        blockName,
        typeName,
      };
    });
  }, [filteredList, sortKey, sortDir, coldStorages, varieties, productionBlocks, potatoTypes]);

  // Totals
  const totals = useMemo(() => {
    const totalKblBags = sortedList.reduce((acc, row) => acc + row.kblBags, 0);
    const totalSrBags = sortedList.reduce((acc, row) => acc + row.srCopyBags, 0);
    const totalKg = sortedList.reduce((acc, row) => acc + row.totalKgIn, 0);
    const totalMt = Number((totalKg / 1000).toFixed(3));
    return {
      totalKblBags,
      totalSrBags,
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
    setIsEntryModalOpen(true);
  };

  const handleEdit = (record: StockTransaction) => {
    setEditingRecord(record);
    setIsEntryModalOpen(true);
  };

  const handleDelete = (record: StockTransaction) => {
    openConfirmationDialog({
      title: 'DELETE STOCK ENTRY',
      message: `Are you sure you want to delete Stock In record "${record.kblChallanNo}" (SR: ${record.srNo})? This record will be moved to the Recycle Bin.`,
      confirmText: 'DELETE RECORD',
      cancelText: 'CANCEL',
      onConfirm: () => {
        deleteStockTransaction(record.id);
        addToast?.(`Deleted Stock Entry ${record.kblChallanNo}. Moved to Recycle Bin.`, 'info');
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
      kblChallanNo: row.kblChallanNo,
      srNo: row.srNo,
      storageName: row.storageName,
      kblBags: row.kblBags,
      srCopyBags: row.srCopyBags,
      kgPerBag: row.kgPerBag,
      totalKgIn: row.totalKgIn,
      totalMtIn: row.totalMtIn,
      blockName: row.blockName,
      typeName: row.typeName,
    }));

    const columns = [
      { header: '#', key: 'sl', width: 6 },
      { header: 'DATE', key: 'date', width: 14 },
      { header: 'KBL CHALLAN NO', key: 'kblChallanNo', width: 18 },
      { header: 'SR NO.', key: 'srNo', width: 16 },
      { header: 'COLD STORAGE NAME', key: 'storageName', width: 28 },
      { header: 'NO OF BAG IN (KBL CHALLAN)', key: 'kblBags', width: 26 },
      { header: 'NO OF BAG IN (SR COPY)', key: 'srCopyBags', width: 24 },
      { header: 'KG PER BAG', key: 'kgPerBag', width: 14 },
      { header: 'TOTAL KG IN', key: 'totalKgIn', width: 18 },
      { header: 'TOTAL MT IN', key: 'totalMtIn', width: 16 },
      { header: 'PRODUCTION BLOCK NAME', key: 'blockName', width: 24 },
      { header: 'POTATO TYPE', key: 'typeName', width: 18 },
    ];

    exportToExcel(
      exportData,
      columns,
      `STOCK_IN_ALL_RECORD_${companySettings?.fiscalYear || '2024'}`,
      'STOCK IN ALL RECORD',
      companySettings,
      `Generated on ${new Date().toLocaleDateString('en-GB')}`
    );
    addToast?.('Stock In All Record exported to Excel successfully!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData = sortedList.map((row) => ({
      sl: String(row.sl),
      date: formatDisplayDate(row.date),
      kblChallanNo: row.kblChallanNo,
      srNo: row.srNo,
      storageName: row.storageName,
      kblBags: row.kblBags.toLocaleString(),
      srCopyBags: row.srCopyBags.toLocaleString(),
      kgPerBag: String(row.kgPerBag),
      totalKgIn: row.totalKgIn.toLocaleString(),
      totalMtIn: row.totalMtIn.toFixed(3),
      blockName: row.blockName,
      typeName: row.typeName,
    }));

    const columns = [
      { header: '#', key: 'sl' },
      { header: 'DATE', key: 'date' },
      { header: 'KBL CHALLAN NO', key: 'kblChallanNo' },
      { header: 'SR NO.', key: 'srNo' },
      { header: 'COLD STORAGE NAME', key: 'storageName' },
      { header: 'NO OF BAG IN (KBL CHALLAN)', key: 'kblBags' },
      { header: 'NO OF BAG IN (SR COPY)', key: 'srCopyBags' },
      { header: 'KG PER BAG', key: 'kgPerBag' },
      { header: 'TOTAL KG IN', key: 'totalKgIn' },
      { header: 'TOTAL MT IN', key: 'totalMtIn' },
      { header: 'PRODUCTION BLOCK NAME', key: 'blockName' },
      { header: 'POTATO TYPE', key: 'typeName' },
    ];

    exportToPdf(
      exportData,
      columns,
      `STOCK_IN_ALL_RECORD_${companySettings?.fiscalYear || '2024'}`,
      'STOCK IN ALL RECORD',
      companySettings,
      `FY: ${companySettings?.fiscalYear || '2024-2025'}`
    );
    addToast?.('Stock In All Record exported as PDF!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            STOCK IN ALL RECORD
          </h2>
        </div>

        {/* Action Controls: New Entry, Density & Exports */}
        <div className="flex items-center flex-wrap gap-2">
          {/* New Stock In Button */}
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NEW STOCK IN</span>
          </button>

          {/* Density Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'compact'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
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
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
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
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
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
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium shadow-2xs"
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
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
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
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
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
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
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
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
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
              value={selectedBlock}
              onChange={(e) => {
                setSelectedBlock(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
            >
              <option value="">ALL BLOCKS</option>
              {productionBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between">
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
            Showing <strong className="text-slate-900 dark:text-white">{sortedList.length}</strong> total records
          </div>
        </div>
      </div>

      {/* Main Table with CRUD Action Buttons */}
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
                  onClick={() => handleSort('kblChallanNo')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center gap-1">
                    KBL CHALLAN NO
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="kblChallanNo" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('srNo')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center gap-1">
                    SR NO.
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="srNo" />
                  </span>
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
                  onClick={() => handleSort('kblBags')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    NO OF BAG IN (KBL CHALLAN)
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="kblBags" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('srCopyBags')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    NO OF BAG IN (SR COPY)
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="srCopyBags" />
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
                  onClick={() => handleSort('totalKgIn')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    TOTAL KG IN
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgIn" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('totalMtIn')}
                  className={`${thPadding} text-right font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <span className="flex items-center justify-end gap-1">
                    TOTAL MT IN
                    <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalMtIn" />
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
                  onClick={() => handleSort('blockName')}
                  className={`${thPadding} font-bold uppercase tracking-wider text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1">
                      PRODUCTION BLOCK NAME
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="blockName" />
                    </span>
                    <ColumnHeaderFilter
                      columnTitle="PRODUCTION BLOCK"
                      type="select"
                      options={productionBlocks.map((b) => ({ label: b.name, value: b.id }))}
                      value={selectedBlock}
                      onChangeValue={(val) => {
                        setSelectedBlock(val);
                        setCurrentPage(1);
                      }}
                      isFiltered={Boolean(selectedBlock)}
                      onClearFilter={() => setSelectedBlock('')}
                      onClearAllFilters={resetFilters}
                    />
                  </div>
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
                  <td colSpan={14} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching Stock In records found.
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
                    <td className={`${cellPadding} font-mono font-bold text-sky-700 dark:text-sky-400 whitespace-nowrap`}>
                      {row.kblChallanNo}
                    </td>
                    <td className={`${cellPadding} font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap`}>
                      {row.srNo}
                    </td>
                    <td className={`${cellPadding} font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap`}>
                      {row.storageName}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-slate-900 dark:text-white`}>
                      {row.kblBags.toLocaleString()}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-slate-700 dark:text-slate-300`}>
                      {row.srCopyBags.toLocaleString()}
                    </td>
                    <td className={`${cellPadding} text-right font-mono text-slate-600 dark:text-slate-400`}>
                      {row.kgPerBag}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-slate-900 dark:text-white`}>
                      {row.totalKgIn.toLocaleString()}
                    </td>
                    <td className={`${cellPadding} text-right font-mono font-bold text-emerald-600 dark:text-emerald-400`}>
                      {row.totalMtIn.toFixed(3)}
                    </td>
                    <td className={`${cellPadding} font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap`}>
                      {row.varietyName}
                    </td>
                    <td className={`${cellPadding} text-slate-700 dark:text-slate-300 whitespace-nowrap`}>
                      {row.blockName}
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
                  <td colSpan={5} className={`${cellPadding} text-center uppercase tracking-wider font-bold`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>TOTALS ({sortedList.length} LOTS):</span>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-right font-mono font-black text-sky-700 dark:text-sky-400`}>
                    {totals.totalKblBags.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} text-right font-mono font-black text-slate-800 dark:text-slate-200`}>
                    {totals.totalSrBags.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} text-right font-mono text-slate-400`}>-</td>
                  <td className={`${cellPadding} text-right font-mono font-black text-slate-900 dark:text-white`}>
                    {totals.totalKg.toLocaleString()} KG
                  </td>
                  <td className={`${cellPadding} text-right font-mono font-black text-emerald-600 dark:text-emerald-400`}>
                    {totals.totalMt.toFixed(3)} MT
                  </td>
                  <td colSpan={4} className={`${cellPadding} text-slate-400`}>-</td>
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
      <StockEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingRecord(null);
        }}
        editRecord={editingRecord}
      />

      {/* View Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="STOCK IN RECORD DETAILS"
        subtitle={`Transaction ${viewingRecord?.kblChallanNo || ''}`}
        icon={<Boxes className="w-5 h-5 text-sky-600" />}
        fields={
          viewingRecord
            ? [
                { label: 'DATE', value: viewingRecord.date },
                { label: 'KBL CHALLAN NO', value: viewingRecord.kblChallanNo, highlight: true },
                { label: 'SR NO.', value: viewingRecord.srNo, highlight: true },
                {
                  label: 'COLD STORAGE',
                  value:
                    coldStorages.find((c) => c.id === viewingRecord.coldStorageId)?.name || '-',
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
                  label: 'PRODUCTION BLOCK',
                  value:
                    productionBlocks.find((b) => b.id === viewingRecord.productionBlockId)?.name ||
                    viewingRecord.farmBlock ||
                    '-',
                },
                {
                  label: 'POTATO TYPE',
                  value:
                    potatoTypes.find((t) => t.id === viewingRecord.potatoTypeId)?.name ||
                    'Seed Potato',
                },
                {
                  label: 'NO OF BAGS (KBL CHALLAN)',
                  value: viewingRecord.sackQuantity?.toLocaleString(),
                  highlight: true,
                },
                {
                  label: 'NO OF BAGS (SR COPY)',
                  value: (
                    (viewingRecord as any).srCopyBags || viewingRecord.sackQuantity
                  )?.toLocaleString(),
                },
                { label: 'KG PER BAG', value: viewingRecord.kgPerBag || 50 },
                {
                  label: 'TOTAL KG IN',
                  value: `${(
                    viewingRecord.totalKg || viewingRecord.sackQuantity * (viewingRecord.kgPerBag || 50)
                  ).toLocaleString()} KG`,
                  highlight: true,
                },
                {
                  label: 'TOTAL MT IN',
                  value: `${(
                    viewingRecord.totalMt ||
                    (viewingRecord.sackQuantity * (viewingRecord.kgPerBag || 50)) / 1000
                  ).toFixed(3)} MT`,
                  highlight: true,
                },
                { label: 'STATUS', value: viewingRecord.status?.toUpperCase() || 'APPROVED' },
                { label: 'REMARKS', value: viewingRecord.remarks || '-' },
                { label: 'CREATED BY', value: viewingRecord.createdBy || 'System' },
                {
                  label: 'CREATED AT',
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
        documentTitle="STOCK IN ALL RECORD"
        subtitle={`Complete Inbound Stock Transaction Ledger • Fiscal Year: ${companySettings?.fiscalYear || '2024-2025'}`}
        summaryItems={[
          { label: 'Total In Bags (KBL)', value: `${totals.totalKblBags.toLocaleString()} Bags` },
          { label: 'Total In Bags (SR)', value: `${totals.totalSrBags.toLocaleString()} Bags` },
          { label: 'Total Weight (KG)', value: `${totals.totalKg.toLocaleString()} KG` },
          { label: 'Total Weight (MT)', value: `${totals.totalMt.toFixed(3)} MT` },
        ]}
        onConfirmPrint={() => validateAndTriggerPrint()}
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-900 text-white font-bold uppercase">
              <tr>
                <th className="py-2 px-1.5 border border-slate-700 text-center">#</th>
                <th className="py-2 px-1.5 border border-slate-700 text-center">DATE</th>
                <th className="py-2 px-1.5 border border-slate-700 text-center">KBL CHALLAN NO</th>
                <th className="py-2 px-1.5 border border-slate-700 text-center">SR NO.</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">COLD STORAGE NAME</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">BAG IN (KBL)</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">BAG IN (SR)</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">KG/BAG</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">TOTAL KG IN</th>
                <th className="py-2 px-1.5 border border-slate-700 text-right">TOTAL MT IN</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">BLOCK NAME</th>
                <th className="py-2 px-1.5 border border-slate-700 text-left">POTATO TYPE</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((row, ri) => (
                <tr key={row.id} className={ri % 2 === 1 ? 'bg-slate-50/80 hover:bg-sky-50/40' : 'bg-white hover:bg-sky-50/40'}>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono">{row.sl}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono">{formatDisplayDate(row.date)}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono font-bold">{row.kblChallanNo}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono font-bold">{row.srNo}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.storageName}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono font-bold">{row.kblBags.toLocaleString()}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono">{row.srCopyBags.toLocaleString()}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono">{row.kgPerBag}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono font-bold">{row.totalKgIn.toLocaleString()}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200 text-right font-mono">{row.totalMtIn.toFixed(3)}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.blockName}</td>
                  <td className="py-1.5 px-1.5 border border-slate-200">{row.typeName}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-b-2 border-slate-400">
              <tr>
                <td colSpan={5} className="py-2 px-1.5 border border-slate-300 font-black uppercase text-center tracking-wider text-slate-900">
                  TOTAL
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalKblBags.toLocaleString()}
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalSrBags.toLocaleString()}
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">-</td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalKg.toLocaleString()}
                </td>
                <td className="py-2 px-1.5 border border-slate-300 text-right font-black text-slate-900">
                  {totals.totalMt.toFixed(3)}
                </td>
                <td colSpan={2} className="py-2 px-1.5 border border-slate-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </PrintPreviewModal>
    </div>
  );
};
