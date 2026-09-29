import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const {
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    addStockTransaction,
    addToast,
  } = useApp();

  const [importType, setImportType] = useState<'stock' | 'database'>('stock');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportLogs([]);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleHeaders = [
      {
        'Date (YYYY-MM-DD)': '2024-03-25',
        'KBL Challan No': 'KBL-2024-101',
        'SR No': 'SR-0501',
        'Cold Storage Code': coldStorages[0]?.code || 'CS-01',
        'Variety': varieties[0]?.name || 'ASTERIX',
        'Class': seedClasses[0]?.name || 'FOUNDATION (FS)',
        'Grade': grades[0]?.name || 'GRADE A (28-40 MM)',
        'Sack Quantity': 500,
        'KG Per Bag': 50,
        'Truck No': 'DHAKA-METRO-11-2233',
        'Grower / Farmer Name': 'Md. Rahim Mia',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleHeaders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Template');
    XLSX.writeFile(workbook, 'KBL_Stock_Import_Template.xlsx');
    addToast('Sample Excel template downloaded!', 'success');
  };

  const handleImport = async () => {
    if (!selectedFile) {
      addToast('Please select an Excel file to import', 'warning');
      return;
    }

    setIsProcessing(true);
    setImportLogs(['Reading spreadsheet file...']);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!jsonData || jsonData.length === 0) {
        setImportLogs((prev) => [...prev, 'Error: Excel file is empty or no valid rows found.']);
        setIsProcessing(false);
        return;
      }

      let importedCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        const date = row['Date (YYYY-MM-DD)'] || row['Date'] || row['date'] || new Date().toISOString().split('T')[0];
        const kblChallanNo = String(row['KBL Challan No'] || row['Challan'] || row['challanNo'] || '').trim();
        const srNo = String(row['SR No'] || row['SR'] || row['srNo'] || '').trim();
        const csCode = String(row['Cold Storage Code'] || row['Cold Storage'] || '').trim();
        const varName = String(row['Variety'] || row['variety'] || '').trim();
        const className = String(row['Class'] || row['class'] || '').trim();
        const gradeName = String(row['Grade'] || row['grade'] || '').trim();
        const sackQty = Number(row['Sack Quantity'] || row['Bags'] || row['quantity'] || 0);
        const kgPerBag = Number(row['KG Per Bag'] || row['kgPerBag'] || 50);

        if (!kblChallanNo || !srNo || sackQty <= 0) {
          errorCount++;
          continue;
        }

        // Match cold storage
        const matchedCs = coldStorages.find(
          (c) => c.code.toLowerCase() === csCode.toLowerCase() || c.name.toLowerCase().includes(csCode.toLowerCase())
        ) || coldStorages[0];

        // Match variety
        const matchedVar = varieties.find(
          (v) => v.name.toLowerCase() === varName.toLowerCase() || (v.code && v.code.toLowerCase() === varName.toLowerCase())
        ) || varieties[0];

        // Match class
        const matchedCls = seedClasses.find(
          (c) => c.name.toLowerCase().includes(className.toLowerCase()) || (c.code && c.code.toLowerCase() === className.toLowerCase())
        ) || seedClasses[0];

        // Match grade
        const matchedGrd = grades.find(
          (g) => g.name.toLowerCase().includes(gradeName.toLowerCase()) || (g.code && g.code.toLowerCase() === gradeName.toLowerCase())
        ) || grades[0];

        const totalKg = sackQty * kgPerBag;
        const totalMt = Number((totalKg / 1000).toFixed(3));

        const result = addStockTransaction({
          date: String(date),
          kblChallanNo,
          srNo,
          coldStorageId: matchedCs?.id || 'CS-01',
          varietyId: matchedVar?.id || 'var-1',
          classId: matchedCls?.id || 'cls-1',
          gradeId: matchedGrd?.id || 'grd-1',
          productionBlockId: productionBlocks[0]?.id || 'blk-1',
          potatoTypeId: potatoTypes[0]?.id || 'type-1',
          sackQuantity: sackQty,
          kgPerBag,
          totalKg,
          totalMt,
          truckNo: row['Truck No'] || '',
          growerFarmerName: row['Grower / Farmer Name'] || '',
          status: 'approved',
        });

        if (result.success) {
          importedCount++;
        } else {
          errorCount++;
        }
      }

      setImportLogs([
        `Completed import!`,
        `Successfully imported: ${importedCount} transactions.`,
        errorCount > 0 ? `Skipped/Failed rows: ${errorCount}.` : 'All rows parsed cleanly.',
      ]);
      addToast(`Imported ${importedCount} stock transactions successfully!`, 'success');
    } catch (err: any) {
      setImportLogs((prev) => [...prev, `Import failed: ${err.message || String(err)}`]);
      addToast('Failed to parse Excel file', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                EXCEL DATA IMPORT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Batch import stock receiving records from Excel spreadsheets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Download sample template banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80">
            <div className="text-xs text-sky-900 dark:text-sky-200">
              <strong className="block">Need the standardized template?</strong>
              <span>Download the sample Excel template with column formatting</span>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 border border-sky-300 dark:border-sky-700 shadow-2xs transition-colors cursor-pointer shrink-0 uppercase"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TEMPLATE</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
              {selectedFile ? selectedFile.name : 'CLICK TO SELECT EXCEL FILE (.XLSX, .XLS)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv formats
            </p>
          </div>

          {/* Logs */}
          {importLogs.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              {importLogs.map((log, i) => (
                <div key={i} className="text-slate-700 dark:text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer uppercase"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'PROCESSING...' : 'IMPORT RECORDS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
