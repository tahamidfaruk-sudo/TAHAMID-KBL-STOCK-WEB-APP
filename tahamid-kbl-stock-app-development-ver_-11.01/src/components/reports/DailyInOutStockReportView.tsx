import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import {
  Search,
  RotateCcw,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Filter,
  SlidersHorizontal,
  Layers,
  Check,
} from 'lucide-react';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { ColumnHeaderFilter } from '../common/ColumnHeaderFilter';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DailyInOutStockReportView: React.FC = () => {
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showColumnFilterBar, setShowColumnFilterBar] = useState(true);

  // Global Filters matching Stock In page
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  // Column-specific filter bar states
  const [categoryType, setCategoryType] = useState<'all' | 'type' | 'variety' | 'class' | 'grade' | 'storage'>('all');
  const [categoryValue, setCategoryValue] = useState<string>('');

  const [inFilterMode, setInFilterMode] = useState<'all' | 'has_in' | 'no_in'>('all');
  const [outFilterMode, setOutFilterMode] = useState<'all' | 'has_out' | 'no_out'>('all');
  const [closingFilterMode, setClosingFilterMode] = useState<'all' | 'positive' | 'zero'>('all');

  const [minInKg, setMinInKg] = useState<number | ''>('');
  const [maxInKg, setMaxInKg] = useState<number | ''>('');
  const [minOutKg, setMinOutKg] = useState<number | ''>('');
  const [maxOutKg, setMaxOutKg] = useState<number | ''>('');
  const [minClosingKg, setMinClosingKg] = useState<number | ''>('');
  const [maxClosingKg, setMaxClosingKg] = useState<number | ''>('');
  const [minBags, setMinBags] = useState<number | ''>('');
  const [maxBags, setMaxBags] = useState<number | ''>('');
  const [minMt, setMinMt] = useState<number | ''>('');
  const [maxMt, setMaxMt] = useState<number | ''>('');

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  // Reset all filters (global and column-specific)
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
    setActiveDatePreset(null);

    setCategoryType('all');
    setCategoryValue('');
    setInFilterMode('all');
    setOutFilterMode('all');
    setClosingFilterMode('all');
    setMinInKg('');
    setMaxInKg('');
    setMinOutKg('');
    setMaxOutKg('');
    setMinClosingKg('');
    setMaxClosingKg('');
    setMinBags('');
    setMaxBags('');
    setMinMt('');
    setMaxMt('');

    setCurrentPage(1);
    addToast?.('All filters reset successfully', 'info');
  };

  // Quick reset only column-specific filter bar
  const resetColumnFilters = () => {
    setCategoryType('all');
    setCategoryValue('');
    setInFilterMode('all');
    setOutFilterMode('all');
    setClosingFilterMode('all');
    setMinInKg('');
    setMaxInKg('');
    setMinOutKg('');
    setMaxOutKg('');
    setMinClosingKg('');
    setMaxClosingKg('');
    setMinBags('');
    setMaxBags('');
    setMinMt('');
    setMaxMt('');
    setCurrentPage(1);
    addToast?.('Column filter bar reset', 'info');
  };

  // Date Presets Handler
  const handleDatePreset = (preset: 'today' | '7days' | 'thisMonth' | 'season') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setActiveDatePreset('today');
    } else if (preset === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setStartDate(formatDate(d7));
      setEndDate(formatDate(today));
      setActiveDatePreset('7days');
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      setActiveDatePreset('thisMonth');
    } else if (preset === 'season') {
      setStartDate('2024-01-01');
      setEndDate('2024-12-31');
      setActiveDatePreset('season');
    }
    setCurrentPage(1);
  };

  // Synchronize unified category filter with specific dropdown state
  const handleCategoryTypeChange = (type: 'all' | 'type' | 'variety' | 'class' | 'grade' | 'storage') => {
    setCategoryType(type);
    setCategoryValue('');
    if (type === 'all') {
      setSelectedType('');
      setSelectedVariety('');
      setSelectedClass('');
      setSelectedGrade('');
      setSelectedStorage('');
    }
    setCurrentPage(1);
  };

  const handleCategoryValueChange = (val: string) => {
    setCategoryValue(val);
    if (categoryType === 'type') setSelectedType(val);
    else if (categoryType === 'variety') setSelectedVariety(val);
    else if (categoryType === 'class') setSelectedClass(val);
    else if (categoryType === 'grade') setSelectedGrade(val);
    else if (categoryType === 'storage') setSelectedStorage(val);
    setCurrentPage(1);
  };

  // Dynamic options for the category dropdown in column filter bar
  const categoryOptions = useMemo(() => {
    if (categoryType === 'type') {
      return potatoTypes.map((t) => ({ id: t.id, name: t.name }));
    }
    if (categoryType === 'variety') {
      return varieties.map((v) => ({ id: v.id, name: v.name }));
    }
    if (categoryType === 'class') {
      return seedClasses.map((c) => ({ id: c.id, name: c.name }));
    }
    if (categoryType === 'grade') {
      return grades.map((g) => ({ id: g.id, name: g.name }));
    }
    if (categoryType === 'storage') {
      return coldStorages.map((cs) => ({ id: cs.id, name: cs.name }));
    }
    return [];
  }, [categoryType, potatoTypes, varieties, seedClasses, grades, coldStorages]);

  const activeColumnFilterCount = [
    Boolean(startDate || endDate),
    Boolean(categoryValue && categoryType !== 'all'),
    inFilterMode !== 'all',
    outFilterMode !== 'all',
    closingFilterMode !== 'all',
    minInKg !== '' || maxInKg !== '',
    minOutKg !== '' || maxOutKg !== '',
    minClosingKg !== '' || maxClosingKg !== '',
    minBags !== '' || maxBags !== '',
    minMt !== '' || maxMt !== '',
  ].filter(Boolean).length;

  const totalActiveFilterCount = [
    Boolean(searchQuery),
    Boolean(selectedStorage),
    Boolean(selectedVariety),
    Boolean(selectedClass),
    Boolean(selectedGrade),
    Boolean(selectedBlock),
    Boolean(selectedType),
    Boolean(startDate || endDate),
    activeColumnFilterCount > 0,
  ].filter(Boolean).length;

  // Filter master datasets for stock in and delivery based on both global and category filters
  const filteredStockIn = useMemo(() => {
    return stockTransactions.filter((s) => {
      if (s.status === 'rejected') return false;
      if (selectedStorage && s.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && s.varietyId !== selectedVariety) return false;
      if (selectedClass && s.classId !== selectedClass) return false;
      if (selectedGrade && s.gradeId !== selectedGrade) return false;
      if (selectedBlock && s.productionBlockId !== selectedBlock) return false;
      if (selectedType && s.potatoTypeId !== selectedType) return false;

      // Category filter bar matching
      if (categoryType === 'type' && categoryValue && s.potatoTypeId !== categoryValue) return false;
      if (categoryType === 'variety' && categoryValue && s.varietyId !== categoryValue) return false;
      if (categoryType === 'class' && categoryValue && s.classId !== categoryValue) return false;
      if (categoryType === 'grade' && categoryValue && s.gradeId !== categoryValue) return false;
      if (categoryType === 'storage' && categoryValue && s.coldStorageId !== categoryValue) return false;

      return true;
    });
  }, [
    stockTransactions,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedBlock,
    selectedType,
    categoryType,
    categoryValue,
  ]);

  const filteredStockOut = useMemo(() => {
    return deliveryTransactions.filter((d) => {
      if (d.status === 'cancelled') return false;
      if (selectedStorage && d.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && d.varietyId !== selectedVariety) return false;
      if (selectedClass && d.classId !== selectedClass) return false;
      if (selectedGrade && d.gradeId !== selectedGrade) return false;
      if (selectedBlock && d.productionBlockId !== selectedBlock) return false;
      if (selectedType && d.potatoTypeId !== selectedType) return false;

      // Category filter bar matching
      if (categoryType === 'type' && categoryValue && d.potatoTypeId !== categoryValue) return false;
      if (categoryType === 'variety' && categoryValue && d.varietyId !== categoryValue) return false;
      if (categoryType === 'class' && categoryValue && d.classId !== categoryValue) return false;
      if (categoryType === 'grade' && categoryValue && d.gradeId !== categoryValue) return false;
      if (categoryType === 'storage' && categoryValue && d.coldStorageId !== categoryValue) return false;

      return true;
    });
  }, [
    deliveryTransactions,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedBlock,
    selectedType,
    categoryType,
    categoryValue,
  ]);

  // Daily Ledger Calculation with opening balance & chronological cumulative closing stock
  const dailyLedgerRecords = useMemo(() => {
    const dateSet = new Set<string>();
    filteredStockIn.forEach((s) => {
      if (s.date) dateSet.add(s.date);
    });
    filteredStockOut.forEach((d) => {
      if (d.date) dateSet.add(d.date);
    });

    const sortedAllDates = Array.from(dateSet).sort();
    if (sortedAllDates.length === 0 && !startDate) {
      return [];
    }

    const effectiveMinDate = sortedAllDates[0] || '2024-01-01';

    let datesToInclude = sortedAllDates;
    if (startDate && endDate) {
      const cur = new Date(startDate);
      const end = new Date(endDate);
      const rangeDates: string[] = [];
      while (cur <= end) {
        rangeDates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
      datesToInclude = rangeDates;
    } else if (startDate) {
      datesToInclude = sortedAllDates.filter((d) => d >= startDate);
    } else if (endDate) {
      datesToInclude = sortedAllDates.filter((d) => d <= endDate);
    }

    const firstReportDate = datesToInclude[0] || effectiveMinDate;
    const priorInKg = filteredStockIn
      .filter((s) => s.date < firstReportDate)
      .reduce((sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)), 0);
    const priorInBags = filteredStockIn
      .filter((s) => s.date < firstReportDate)
      .reduce((sum, s) => sum + (s.sackQuantity || 0), 0);

    const priorOutKg = filteredStockOut
      .filter((d) => d.date < firstReportDate)
      .reduce((sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)), 0);
    const priorOutBags = filteredStockOut
      .filter((d) => d.date < firstReportDate)
      .reduce((sum, d) => sum + (d.sackQuantity || 0), 0);

    let runningClosingKg = priorInKg - priorOutKg;
    let runningClosingBags = priorInBags - priorOutBags;

    const rows = datesToInclude.map((dateStr, idx) => {
      const inItems = filteredStockIn.filter((s) => s.date === dateStr);
      const outItems = filteredStockOut.filter((d) => d.date === dateStr);

      const stockInKg = inItems.reduce(
        (sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)),
        0
      );
      const stockInBags = inItems.reduce((sum, s) => sum + (s.sackQuantity || 0), 0);

      const stockOutKg = outItems.reduce(
        (sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)),
        0
      );
      const stockOutBags = outItems.reduce((sum, d) => sum + (d.sackQuantity || 0), 0);

      runningClosingKg += stockInKg - stockOutKg;
      runningClosingBags += stockInBags - stockOutBags;
      const closingStockMt = Number((runningClosingKg / 1000).toFixed(3));

      return {
        sl: idx + 1,
        date: dateStr,
        stockInKg,
        stockInBags,
        stockOutKg,
        stockOutBags,
        closingStockKg: runningClosingKg,
        noOfBagClosingStock: runningClosingBags,
        closingStockMt,
        hasActivity: stockInKg > 0 || stockOutKg > 0,
      };
    });

    if (!startDate && !endDate) {
      return rows.filter((r) => r.hasActivity);
    }

    return rows;
  }, [filteredStockIn, filteredStockOut, startDate, endDate]);

  // Apply column-specific filters
  const columnFilteredList = useMemo(() => {
    return dailyLedgerRecords.filter((r) => {
      // Stock In column filters
      if (inFilterMode === 'has_in' && r.stockInKg <= 0) return false;
      if (inFilterMode === 'no_in' && r.stockInKg > 0) return false;
      if (minInKg !== '' && r.stockInKg < Number(minInKg)) return false;
      if (maxInKg !== '' && r.stockInKg > Number(maxInKg)) return false;

      // Stock Out column filters
      if (outFilterMode === 'has_out' && r.stockOutKg <= 0) return false;
      if (outFilterMode === 'no_out' && r.stockOutKg > 0) return false;
      if (minOutKg !== '' && r.stockOutKg < Number(minOutKg)) return false;
      if (maxOutKg !== '' && r.stockOutKg > Number(maxOutKg)) return false;

      // Closing Stock KG filters
      if (closingFilterMode === 'positive' && r.closingStockKg <= 0) return false;
      if (closingFilterMode === 'zero' && r.closingStockKg !== 0) return false;
      if (minClosingKg !== '' && r.closingStockKg < Number(minClosingKg)) return false;
      if (maxClosingKg !== '' && r.closingStockKg > Number(maxClosingKg)) return false;

      // Closing Bags filters
      if (minBags !== '' && r.noOfBagClosingStock < Number(minBags)) return false;
      if (maxBags !== '' && r.noOfBagClosingStock > Number(maxBags)) return false;

      // Closing MT filters
      if (minMt !== '' && r.closingStockMt < Number(minMt)) return false;
      if (maxMt !== '' && r.closingStockMt > Number(maxMt)) return false;

      return true;
    });
  }, [
    dailyLedgerRecords,
    inFilterMode,
    outFilterMode,
    closingFilterMode,
    minInKg,
    maxInKg,
    minOutKg,
    maxOutKg,
    minClosingKg,
    maxClosingKg,
    minBags,
    maxBags,
    minMt,
    maxMt,
  ]);

  // Search filtering
  const searchFilteredList = useMemo(() => {
    if (!searchQuery.trim()) return columnFilteredList;
    const query = searchQuery.trim().toLowerCase();
    return columnFilteredList.filter((r) => {
      return (
        r.date.toLowerCase().includes(query) ||
        r.stockInKg.toString().includes(query) ||
        r.stockOutKg.toString().includes(query) ||
        r.closingStockKg.toString().includes(query) ||
        r.noOfBagClosingStock.toString().includes(query) ||
        r.closingStockMt.toString().includes(query)
      );
    });
  }, [columnFilteredList, searchQuery]);

  // Sorting
  const sortedList = useMemo(() => {
    const list = [...searchFilteredList];
    list.sort((a: any, b: any) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [searchFilteredList, sortKey, sortDir]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    const totalInKg = sortedList.reduce((acc, row) => acc + row.stockInKg, 0);
    const totalOutKg = sortedList.reduce((acc, row) => acc + row.stockOutKg, 0);
    const lastRow = sortedList.length > 0 ? sortedList[sortedList.length - 1] : null;
    const latestClosingKg = lastRow ? lastRow.closingStockKg : 0;
    const latestClosingBags = lastRow ? lastRow.noOfBagClosingStock : 0;
    const latestClosingMt = lastRow ? lastRow.closingStockMt : 0;

    return {
      totalInKg,
      totalOutKg,
      latestClosingKg,
      latestClosingBags,
      latestClosingMt,
    };
  }, [sortedList]);

  // Paginated records
  const totalRecords = sortedList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedList : sortedList.slice(startIndex, endIndex);

  // Dynamic table density styles
  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      tfoot: 'py-1 text-[9.5px]',
      filterInput: 'py-0.5 text-[9px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      tfoot: 'py-1.2 text-[10px]',
      filterInput: 'py-1 text-[9.5px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      tfoot: 'py-1.5 text-[10.5px]',
      filterInput: 'py-1 text-[10px]',
    },
  }[density];

  // Excel Export matching exact 6 columns
  const handleExportExcel = () => {
    const exportData: any[] = sortedList.map((row) => ({
      date: formatDisplayDate(row.date),
      stockInKg: row.stockInKg,
      stockOutKg: row.stockOutKg,
      closingStockKg: row.closingStockKg,
      noOfBagClosingStock: row.noOfBagClosingStock,
      closingStockMt: row.closingStockMt,
    }));

    if (sortedList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        stockInKg: overallTotals.totalInKg,
        stockOutKg: overallTotals.totalOutKg,
        closingStockKg: overallTotals.latestClosingKg,
        noOfBagClosingStock: overallTotals.latestClosingBags,
        closingStockMt: overallTotals.latestClosingMt,
        isTotal: true,
      });
    }

    const columns: any[] = [
      { header: 'DATE', key: 'date', width: 16, align: 'center' },
      { header: 'STOCK IN (KG)', key: 'stockInKg', width: 18, isNumeric: true },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg', width: 18, isNumeric: true },
      { header: 'CLOSING STOCK (KG)', key: 'closingStockKg', width: 22, isNumeric: true },
      { header: 'NO OF BAG CLOSING STOCK', key: 'noOfBagClosingStock', width: 25, isNumeric: true },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', width: 20, isNumeric: true },
    ];

    exportToExcel(
      exportData,
      columns,
      `DAILY_IN_OUT_STOCK_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAILY IN, OUT & STOCK REPORT',
      companySettings
    );
    addToast?.('Daily In, Out & Stock report exported as Excel!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData: any[] = sortedList.map((row) => ({
      date: formatDisplayDate(row.date),
      stockInKg: row.stockInKg.toLocaleString(),
      stockOutKg: row.stockOutKg.toLocaleString(),
      closingStockKg: row.closingStockKg.toLocaleString(),
      noOfBagClosingStock: row.noOfBagClosingStock.toLocaleString(),
      closingStockMt: row.closingStockMt.toLocaleString(),
    }));

    if (sortedList.length > 0) {
      exportData.push({
        date: 'TOTAL / BALANCE',
        stockInKg: overallTotals.totalInKg.toLocaleString(),
        stockOutKg: overallTotals.totalOutKg.toLocaleString(),
        closingStockKg: overallTotals.latestClosingKg.toLocaleString(),
        noOfBagClosingStock: overallTotals.latestClosingBags.toLocaleString(),
        closingStockMt: overallTotals.latestClosingMt.toLocaleString(),
        isTotal: true,
      });
    }

    const columns: any[] = [
      { header: 'DATE', key: 'date' },
      { header: 'STOCK IN (KG)', key: 'stockInKg' },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg' },
      { header: 'CLOSING STOCK (KG)', key: 'closingStockKg' },
      { header: 'NO OF BAG CLOSING STOCK', key: 'noOfBagClosingStock' },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt' },
    ];

    exportToPdf(
      exportData,
      columns,
      `DAILY_IN_OUT_STOCK_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAILY IN, OUT & STOCK REPORT',
      companySettings,
      'l',
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Daily In, Out & Stock report exported as PDF!', 'success');
  };

  const getCategoryName = () => {
    if (!categoryValue) return '';
    const match = categoryOptions.find((o) => o.id === categoryValue);
    return match ? match.name : categoryValue;
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card strictly matching Stock In layout with Column Filter Toggle */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DAILY IN, OUT & STOCK REPORT
          </h2>
        </div>

        {/* Action Controls: Density & Column Filter Bar Toggle & Icon-Only Exports */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Column Filter Bar Toggle Button */}
          <button
            type="button"
            onClick={() => setShowColumnFilterBar((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border font-bold uppercase transition-all cursor-pointer shadow-2xs ${
              showColumnFilterBar
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Toggle Column-Specific Filter Bar"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">COLUMN FILTERS</span>
            {activeColumnFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-black">
                {activeColumnFilterCount}
              </span>
            )}
          </button>

          {/* Density Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setDensity('compact');
                addToast?.('Table density set to COMPACT', 'info');
              }}
              className={`px-2 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'compact'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('normal');
                addToast?.('Table density set to NORMAL', 'info');
              }}
              className={`px-2 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'normal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('comfortable');
                addToast?.('Table density set to COMFORTABLE', 'info');
              }}
              className={`px-2 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          {/* Export & Print */}
          <ReportButtonGroup
            iconOnly={true}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Primary Filter Section matching Stock In layout */}
      <div className="bg-slate-200/85 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100">
        {/* ROW 1: Search, Date Pickers, Quick Buttons, record counter & Icon-only Clear button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left grouping: Search + Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative w-40 sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label="Search records"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Pickers container strictly matching Stock In page design */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/90 dark:bg-slate-700/70 p-1 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold px-1 uppercase tracking-wider">
                <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Date:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset(null);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-slate-200/90 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                title="From Date"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset(null);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-slate-200/90 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                title="To Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setActiveDatePreset(null);
                    setCurrentPage(1);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right grouping: Quick Buttons + days counter + reset */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            {/* Quick Date Presets */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs text-xs font-semibold">
              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 px-1 tracking-wider">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                <span>QUICK:</span>
              </span>

              <button
                type="button"
                onClick={() => handleDatePreset('today')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'today'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Today's Date"
              >
                TODAY
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('7days')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === '7days'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Last 7 Days"
              >
                7 DAY
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('thisMonth')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'thisMonth'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by This Month"
              >
                THIS MONTH
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('season')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'season'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Season 2024"
              >
                SEASON
              </button>
            </div>

            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sortedList.length}</strong> days
            </span>

            {/* Clear All Filters button */}
            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
              title={`Clear all filters${totalActiveFilterCount > 0 ? ` (${totalActiveFilterCount} active)` : ''}`}
              aria-label="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ROW 2: 6 Dropdown Filters strictly matching Stock In page */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-300 dark:border-slate-700">
          <div>
            <select
              value={selectedStorage}
              onChange={(e) => {
                setSelectedStorage(e.target.value);
                if (categoryType === 'storage') setCategoryValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY COLD STORAGE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL STORAGES</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {cs.name.toUpperCase()} ({cs.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                if (categoryType === 'type') setCategoryValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY POTATO TYPE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL POTATO TYPES</option>
              {potatoTypes.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {t.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedVariety}
              onChange={(e) => {
                setSelectedVariety(e.target.value);
                if (categoryType === 'variety') setCategoryValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY VARIETY"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL VARIETIES</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id} className="text-slate-600 dark:text-slate-300 font-normal">
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
                if (categoryType === 'class') setCategoryValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY SEED CLASS"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL SEED CLASSES</option>
              {seedClasses.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-600 dark:text-slate-300 font-normal">
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
                if (categoryType === 'grade') setCategoryValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY GRADE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL GRADES</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id} className="text-slate-600 dark:text-slate-300 font-normal">
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
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY PRODUCTION BLOCK"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL BLOCKS</option>
              {productionBlocks.map((b) => (
                <option key={b.id} value={b.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {b.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DEDICATED ITEM CATEGORY & DATE RANGE FILTER BAR */}
      {showColumnFilterBar && (
        <div className="bg-gradient-to-r from-sky-950/20 via-slate-100 to-emerald-950/20 dark:from-sky-950/40 dark:via-slate-800/90 dark:to-emerald-950/40 border border-sky-300/60 dark:border-sky-700/50 rounded-xl p-2.5 shadow-2xs space-y-2 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>ITEM CATEGORY FILTER:</span>
              </div>

              {/* Category Type selector */}
              <div className="inline-flex items-center p-0.5 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs text-[10px] font-bold">
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'type', label: 'POTATO TYPE' },
                  { id: 'variety', label: 'VARIETY' },
                  { id: 'class', label: 'SEED CLASS' },
                  { id: 'grade', label: 'GRADE' },
                  { id: 'storage', label: 'STORAGE' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryTypeChange(cat.id as any)}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer uppercase ${
                      categoryType === cat.id
                        ? 'bg-sky-600 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Category Value Dropdown */}
              {categoryType !== 'all' && (
                <div className="relative min-w-[160px] sm:min-w-[200px]">
                  <select
                    value={categoryValue}
                    onChange={(e) => handleCategoryValueChange(e.target.value)}
                    className="w-full py-1 px-2 text-[10.5px] rounded-lg border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold uppercase shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  >
                    <option value="">SELECT {categoryType.toUpperCase()}...</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Reset Column Filters */}
            {activeColumnFilterCount > 0 && (
              <button
                type="button"
                onClick={resetColumnFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-bold uppercase transition-colors cursor-pointer shadow-2xs"
                title="Clear Column Filters"
              >
                <X className="w-3 h-3" />
                <span>RESET COLUMN FILTERS ({activeColumnFilterCount})</span>
              </button>
            )}
          </div>

          {/* Active Category Tag */}
          {categoryValue && (
            <div className="flex items-center gap-2 pt-1 text-[10.5px] text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-sky-700 dark:text-sky-300">Active Category:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 font-bold">
                <span>{categoryType.toUpperCase()}: {getCategoryName().toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => handleCategoryValueChange('')}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Table: Strictly matches column sequence and two-tier header from attached image */}
      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full border-collapse text-left select-text">
          <thead>
            {/* Top Tier Header with Popover Filter Triggers */}
            <tr className="border-b border-slate-300 dark:border-slate-700 text-[10.5px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {/* DATE: Rowspan 2 - Soft Steel/Blue tone #e2e8f0 */}
              <th
                rowSpan={2}
                className={`${densityStyles.th} px-3 select-none bg-[#e2e8f0] dark:bg-slate-700/90 border-r border-slate-300 dark:border-slate-600 transition-colors`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400"
                    title="Sort by Date"
                  >
                    <span>DATE</span>
                    {sortKey === 'date' && (
                      <span className="text-sky-600 dark:text-sky-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                  <ColumnHeaderFilter
                    columnTitle="DATE RANGE"
                    type="date-range"
                    startDate={startDate}
                    endDate={endDate}
                    onDateRangeChange={(s, e) => {
                      setStartDate(s);
                      setEndDate(e);
                      setActiveDatePreset(null);
                      setCurrentPage(1);
                    }}
                    isFiltered={Boolean(startDate || endDate)}
                    onClearFilter={() => {
                      setStartDate('');
                      setEndDate('');
                      setActiveDatePreset(null);
                      setCurrentPage(1);
                    }}
                    onClearAllFilters={resetFilters}
                  />
                </div>
              </th>

              {/* STOCK IN (KG): Rowspan 2 - Soft lavender/blue tone #e0e7ff */}
              <th
                rowSpan={2}
                className={`${densityStyles.th} px-3 select-none bg-[#e0e7ff] dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 border-r border-slate-300 dark:border-slate-600 transition-colors`}
              >
                <div className="flex items-center justify-between gap-1">
                  <ColumnHeaderFilter
                    columnTitle="STOCK IN (KG)"
                    type="number-range"
                    align="right"
                    minVal={minInKg}
                    maxVal={maxInKg}
                    onNumberRangeChange={(min, max) => {
                      setMinInKg(min);
                      setMaxInKg(max);
                      setCurrentPage(1);
                    }}
                    isFiltered={minInKg !== '' || maxInKg !== ''}
                    onClearFilter={() => {
                      setMinInKg('');
                      setMaxInKg('');
                      setCurrentPage(1);
                    }}
                    onClearAllFilters={resetFilters}
                  />
                  <div
                    onClick={() => handleSort('stockInKg')}
                    className="flex items-center gap-1 cursor-pointer hover:text-sky-600 dark:hover:text-sky-300"
                    title="Sort by Stock In"
                  >
                    <span>STOCK IN (KG)</span>
                    {sortKey === 'stockInKg' && (
                      <span className="text-sky-600 dark:text-sky-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
              </th>

              {/* STOCK OUT (KG): Rowspan 2 - Soft peach/orange tone #fed7aa */}
              <th
                rowSpan={2}
                className={`${densityStyles.th} px-3 select-none bg-[#fed7aa] dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-r border-slate-300 dark:border-slate-600 transition-colors`}
              >
                <div className="flex items-center justify-between gap-1">
                  <ColumnHeaderFilter
                    columnTitle="STOCK OUT (KG)"
                    type="number-range"
                    align="right"
                    minVal={minOutKg}
                    maxVal={maxOutKg}
                    onNumberRangeChange={(min, max) => {
                      setMinOutKg(min);
                      setMaxOutKg(max);
                      setCurrentPage(1);
                    }}
                    isFiltered={minOutKg !== '' || maxOutKg !== ''}
                    onClearFilter={() => {
                      setMinOutKg('');
                      setMaxOutKg('');
                      setCurrentPage(1);
                    }}
                    onClearAllFilters={resetFilters}
                  />
                  <div
                    onClick={() => handleSort('stockOutKg')}
                    className="flex items-center gap-1 cursor-pointer hover:text-amber-600 dark:hover:text-amber-300"
                    title="Sort by Stock Out"
                  >
                    <span>STOCK OUT (KG)</span>
                    {sortKey === 'stockOutKg' && (
                      <span className="text-amber-600 dark:text-amber-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
              </th>

              {/* CLOSING STOCK: Colspan 3 - Soft green banner #bbf7d0 / #a7f3d0 */}
              <th
                colSpan={3}
                className={`${densityStyles.th} px-3 text-center bg-[#bbf7d0] dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 border-b border-slate-300 dark:border-slate-600 tracking-wider`}
              >
                CLOSING STOCK
              </th>
            </tr>

            {/* Second Tier Header: Under CLOSING STOCK with Number Range Popovers */}
            <tr className="border-b border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
              {/* CLOSING STOCK (KG) */}
              <th className={`${densityStyles.th} px-3 select-none bg-[#dcfce7] dark:bg-emerald-950/50 border-r border-slate-300 dark:border-slate-600`}>
                <div className="flex items-center justify-between gap-1">
                  <ColumnHeaderFilter
                    columnTitle="CLOSING STOCK (KG)"
                    type="number-range"
                    align="right"
                    minVal={minClosingKg}
                    maxVal={maxClosingKg}
                    onNumberRangeChange={(min, max) => {
                      setMinClosingKg(min);
                      setMaxClosingKg(max);
                      setCurrentPage(1);
                    }}
                    isFiltered={minClosingKg !== '' || maxClosingKg !== ''}
                    onClearFilter={() => {
                      setMinClosingKg('');
                      setMaxClosingKg('');
                      setCurrentPage(1);
                    }}
                    onClearAllFilters={resetFilters}
                  />
                  <div
                    onClick={() => handleSort('closingStockKg')}
                    className="flex items-center gap-1 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300"
                    title="Sort by Closing Stock in KG"
                  >
                    <span>CLOSING STOCK (KG)</span>
                    {sortKey === 'closingStockKg' && (
                      <span className="text-emerald-600 dark:text-emerald-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
              </th>

              {/* NO OF BAG CLOSING STOCK */}
              <th className={`${densityStyles.th} px-3 select-none bg-[#dcfce7] dark:bg-emerald-950/50 border-r border-slate-300 dark:border-slate-600`}>
                <div className="flex items-center justify-between gap-1">
                  <ColumnHeaderFilter
                    columnTitle="CLOSING BAGS"
                    type="number-range"
                    align="right"
                    minVal={minBags}
                    maxVal={maxBags}
                    onNumberRangeChange={(min, max) => {
                      setMinBags(min);
                      setMaxBags(max);
                      setCurrentPage(1);
                    }}
                    isFiltered={minBags !== '' || maxBags !== ''}
                    onClearFilter={() => {
                      setMinBags('');
                      setMaxBags('');
                      setCurrentPage(1);
                    }}
                    onClearAllFilters={resetFilters}
                  />
                  <div
                    onClick={() => handleSort('noOfBagClosingStock')}
                    className="flex items-center gap-1 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300"
                    title="Sort by Closing Bags"
                  >
                    <span>NO OF BAG CLOSING STOCK</span>
                    {sortKey === 'noOfBagClosingStock' && (
                      <span className="text-emerald-600 dark:text-emerald-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
              </th>

              {/* CLOSING STOCK (MT) */}
              <th className={`${densityStyles.th} px-3 select-none bg-[#bbf7d0] dark:bg-emerald-900/60`}>
                <div className="flex items-center justify-between gap-1">
                  <ColumnHeaderFilter
                    columnTitle="CLOSING STOCK (MT)"
                    type="number-range"
                    align="right"
                    minVal={minMt}
                    maxVal={maxMt}
                    onNumberRangeChange={(min, max) => {
                      setMinMt(min);
                      setMaxMt(max);
                      setCurrentPage(1);
                    }}
                    isFiltered={minMt !== '' || maxMt !== ''}
                    onClearFilter={() => {
                      setMinMt('');
                      setMaxMt('');
                      setCurrentPage(1);
                    }}
                    onClearAllFilters={resetFilters}
                  />
                  <div
                    onClick={() => handleSort('closingStockMt')}
                    className="flex items-center gap-1 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300"
                    title="Sort by Closing Stock in MT"
                  >
                    <span>CLOSING STOCK (MT)</span>
                    {sortKey === 'closingStockMt' && (
                      <span className="text-emerald-700 dark:text-emerald-300">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
              </th>
            </tr>

            {/* INLINE COLUMN-SPECIFIC FILTER BAR ROW */}
            {showColumnFilterBar && (
              <tr className="bg-slate-100/90 dark:bg-slate-800/95 border-b-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                {/* Column 1: DATE Filter Input */}
                <th className="p-1 border-r border-slate-300 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={`w-full ${densityStyles.filterInput} px-1 text-[9.5px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs`}
                      title="Filter from Date"
                    />
                    {(startDate || endDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setCurrentPage(1);
                        }}
                        className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Clear Date"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>

                {/* Column 2: STOCK IN (KG) Filter Select */}
                <th className="p-1 border-r border-slate-300 dark:border-slate-700">
                  <select
                    value={inFilterMode}
                    onChange={(e) => {
                      setInFilterMode(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className={`w-full ${densityStyles.filterInput} px-1 text-[9.5px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-bold uppercase focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs cursor-pointer`}
                    title="Filter Stock In activity"
                  >
                    <option value="all">ALL IN (KG)</option>
                    <option value="has_in">INWARD ONLY (&gt;0)</option>
                    <option value="no_in">NO INWARD (0 KG)</option>
                  </select>
                </th>

                {/* Column 3: STOCK OUT (KG) Filter Select */}
                <th className="p-1 border-r border-slate-300 dark:border-slate-700">
                  <select
                    value={outFilterMode}
                    onChange={(e) => {
                      setOutFilterMode(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className={`w-full ${densityStyles.filterInput} px-1 text-[9.5px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 font-bold uppercase focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs cursor-pointer`}
                    title="Filter Stock Out activity"
                  >
                    <option value="all">ALL OUT (KG)</option>
                    <option value="has_out">OUTWARD ONLY (&gt;0)</option>
                    <option value="no_out">NO OUTWARD (0 KG)</option>
                  </select>
                </th>

                {/* Column 4: CLOSING STOCK (KG) Filter Select */}
                <th className="p-1 border-r border-slate-300 dark:border-slate-700">
                  <select
                    value={closingFilterMode}
                    onChange={(e) => {
                      setClosingFilterMode(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className={`w-full ${densityStyles.filterInput} px-1 text-[9.5px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer`}
                    title="Filter Closing Stock Balance"
                  >
                    <option value="all">ALL BALANCES</option>
                    <option value="positive">POSITIVE (&gt;0 KG)</option>
                    <option value="zero">ZERO (0 KG)</option>
                  </select>
                </th>

                {/* Column 5: NO OF BAG CLOSING STOCK Filter Input */}
                <th className="p-1 border-r border-slate-300 dark:border-slate-700">
                  <input
                    type="number"
                    value={minBags}
                    onChange={(e) => {
                      setMinBags(e.target.value === '' ? '' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`w-full ${densityStyles.filterInput} px-1 text-[9.5px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs`}
                    placeholder="Min Bags..."
                    title="Minimum closing bags"
                  />
                </th>

                {/* Column 6: CLOSING STOCK (MT) Filter Input */}
                <th className="p-1">
                  <input
                    type="number"
                    step="0.001"
                    value={minMt}
                    onChange={(e) => {
                      setMinMt(e.target.value === '' ? '' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`w-full ${densityStyles.filterInput} px-1 text-[9.5px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs`}
                    placeholder="Min MT..."
                    title="Minimum closing metric tons"
                  />
                </th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-medium">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                  <div className="space-y-1.5">
                    <p>No stock activity found matching your selected column filters.</p>
                    {activeColumnFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                      >
                        Reset all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.date}
                  className={`${densityStyles.row} hover:bg-sky-500/10 transition-colors duration-150`}
                >
                  {/* DATE: Neutral / white background */}
                  <td className={`${densityStyles.cell} px-3 text-center border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold tabular-nums whitespace-nowrap`}>
                    {formatDisplayDate(row.date)}
                  </td>

                  {/* STOCK IN (KG): Soft light blue/gray background tint */}
                  <td className={`${densityStyles.cell} px-3 text-right tabular-nums border-r border-slate-200 dark:border-slate-800 bg-[#f1f5f9]/70 dark:bg-slate-800/40 text-sky-800 dark:text-sky-300 font-bold`}>
                    {row.stockInKg > 0 ? row.stockInKg.toLocaleString() : '-'}
                  </td>

                  {/* STOCK OUT (KG): Soft peach/orange background tint */}
                  <td className={`${densityStyles.cell} px-3 text-right tabular-nums border-r border-slate-200 dark:border-slate-800 bg-[#fff7ed]/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold`}>
                    {row.stockOutKg > 0 ? row.stockOutKg.toLocaleString() : '-'}
                  </td>

                  {/* CLOSING STOCK (KG): Soft light green background tint with colored border and text border */}
                  <td className={`${densityStyles.cell} px-2.5 text-right tabular-nums border-r-2 border-emerald-500/70 dark:border-emerald-600/80 bg-emerald-50/70 dark:bg-emerald-950/30`}>
                    <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-emerald-600 dark:border-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-black shadow-2xs">
                      {row.closingStockKg.toLocaleString()}
                    </span>
                  </td>

                  {/* NO OF BAG CLOSING STOCK: White/neutral background with crisp badge */}
                  <td className={`${densityStyles.cell} px-2.5 text-right tabular-nums border-r border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/15`}>
                    <span className="inline-flex items-center justify-end px-1.5 py-0.5 rounded border border-emerald-500/60 dark:border-emerald-500/70 bg-white/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold shadow-2xs">
                      {row.noOfBagClosingStock.toLocaleString()}
                    </span>
                  </td>

                  {/* CLOSING STOCK (MT): Deeper soft green background tint with colored border and text border */}
                  <td className={`${densityStyles.cell} px-2.5 text-right tabular-nums border-r-2 border-teal-500/70 dark:border-teal-600/80 bg-teal-50/70 dark:bg-teal-950/30`}>
                    <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-teal-600 dark:border-teal-400 bg-teal-100/90 dark:bg-teal-950/80 text-teal-950 dark:text-teal-100 font-black shadow-2xs">
                      {row.closingStockMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer with Summary Totals matching exact 6 columns */}
          {sortedList.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white uppercase text-[10.5px]">
              <tr>
                <td className={`${densityStyles.tfoot} px-3 text-center border-r border-slate-300 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-700/80`}>
                  TOTAL
                </td>
                <td className={`${densityStyles.tfoot} px-3 text-right tabular-nums border-r border-slate-300 dark:border-slate-700 bg-sky-100/60 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300`}>
                  {overallTotals.totalInKg.toLocaleString()}
                </td>
                <td className={`${densityStyles.tfoot} px-3 text-right tabular-nums border-r border-slate-300 dark:border-slate-700 bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300`}>
                  {overallTotals.totalOutKg.toLocaleString()}
                </td>
                <td className={`${densityStyles.tfoot} px-2.5 text-right tabular-nums border-r-2 border-emerald-500/70 dark:border-emerald-600 bg-emerald-100/70 dark:bg-emerald-950/60`}>
                  <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-emerald-600 dark:border-emerald-400 bg-emerald-200/90 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 font-black shadow-2xs">
                    {overallTotals.latestClosingKg.toLocaleString()}
                  </span>
                </td>
                <td className={`${densityStyles.tfoot} px-2.5 text-right tabular-nums border-r border-slate-300 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/40`}>
                  <span className="inline-flex items-center justify-end px-1.5 py-0.5 rounded border border-emerald-500/60 dark:border-emerald-500 bg-white/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-black shadow-2xs">
                    {overallTotals.latestClosingBags.toLocaleString()}
                  </span>
                </td>
                <td className={`${densityStyles.tfoot} px-2.5 text-right tabular-nums border-r-2 border-teal-500/70 dark:border-teal-600 bg-teal-100/70 dark:bg-teal-950/60`}>
                  <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-teal-600 dark:border-teal-400 bg-teal-200/90 dark:bg-teal-900 text-teal-950 dark:text-teal-100 font-black shadow-2xs">
                    {overallTotals.latestClosingMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls strictly matching Stock In page */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All</option>
          </select>
          <span className="text-slate-500 dark:text-slate-400 ml-2">
            Showing {totalRecords === 0 ? 0 : startIndex + 1} - {endIndex} of {totalRecords} records
          </span>
        </div>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={effectivePage === 1}
              className="p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={effectivePage === 1}
              className="p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-1 font-bold text-slate-700 dark:text-slate-300 text-xs">
              Page {effectivePage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={effectivePage === totalPages}
              className="p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={effectivePage === totalPages}
              className="p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="DAILY IN, OUT & STOCK REPORT"
          subtitle={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}${categoryValue ? ` | Category: ${getCategoryName()}` : ''}`}
        >
          <div className="p-4 space-y-4 text-black bg-white">
            <div className="text-center pb-3 border-b border-black">
              <h1 className="text-lg font-black uppercase tracking-wide">
                {companySettings?.companyName || 'KISHAN BOTANIX LTD.'}
              </h1>
              <p className="text-xs uppercase tracking-wider font-semibold">DAILY IN, OUT & STOCK REPORT</p>
              <p className="text-[10px] text-gray-600">
                Period: {startDate || 'All Time'} to {endDate || 'Present'}
                {categoryValue && ` | Filter: ${categoryType.toUpperCase()}: ${getCategoryName()}`}
              </p>
            </div>

            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={2} className="border border-black p-1 text-center">DATE</th>
                  <th rowSpan={2} className="border border-black p-1 text-right">STOCK IN (KG)</th>
                  <th rowSpan={2} className="border border-black p-1 text-right">STOCK OUT (KG)</th>
                  <th colSpan={3} className="border border-black p-1 text-center">CLOSING STOCK</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-right">CLOSING STOCK (KG)</th>
                  <th className="border border-black p-1 text-right">NO OF BAG CLOSING STOCK</th>
                  <th className="border border-black p-1 text-right">CLOSING STOCK (MT)</th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((r) => (
                  <tr key={r.date}>
                    <td className="border border-black p-1 text-center font-bold whitespace-nowrap">{formatDisplayDate(r.date)}</td>
                    <td className="border border-black p-1 text-right">{r.stockInKg.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.stockOutKg.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.closingStockKg.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.noOfBagClosingStock.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.closingStockMt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold bg-gray-200">
                <tr>
                  <td className="border border-black p-1 text-center">TOTAL</td>
                  <td className="border border-black p-1 text-right">{overallTotals.totalInKg.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.totalOutKg.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.latestClosingKg.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.latestClosingBags.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.latestClosingMt.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
