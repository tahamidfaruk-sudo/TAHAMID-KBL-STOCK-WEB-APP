import React, { useState, useEffect } from 'react';
import { X, Save, Boxes, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockTransaction } from '../../types';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: StockTransaction | null;
}

export const StockEntryModal: React.FC<StockEntryModalProps> = ({
  isOpen,
  onClose,
  editRecord,
}) => {
  const {
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    potatoTypes,
    kgPerBagOptions,
    addStockTransaction,
    updateStockTransaction,
    showSuccessDialog,
    addToast,
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [kblChallanNo, setKblChallanNo] = useState('');
  const [srNo, setSrNo] = useState('');
  const [coldStorageId, setColdStorageId] = useState('');
  const [varietyId, setVarietyId] = useState('');
  const [classId, setClassId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [productionBlockId, setProductionBlockId] = useState('');
  const [potatoTypeId, setPotatoTypeId] = useState('');
  const [sackQuantity, setSackQuantity] = useState<number | ''>('');
  const [kgPerBag, setKgPerBag] = useState<number | ''>('');
  const [truckNo, setTruckNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [growerFarmerName, setGrowerFarmerName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setKblChallanNo('');
    setSrNo('');
    setColdStorageId('');
    setVarietyId('');
    setClassId('');
    setGradeId('');
    setProductionBlockId('');
    setPotatoTypeId('');
    setSackQuantity('');
    setKgPerBag('');
    setTruckNo('');
    setDriverName('');
    setGrowerFarmerName('');
    setRemarks('');
    setStatus('approved');
  };

  useEffect(() => {
    if (editRecord) {
      setDate(editRecord.date || new Date().toISOString().split('T')[0]);
      setKblChallanNo(editRecord.kblChallanNo || '');
      setSrNo(editRecord.srNo || '');
      setColdStorageId(editRecord.coldStorageId || '');
      setVarietyId(editRecord.varietyId || '');
      setClassId(editRecord.classId || '');
      setGradeId(editRecord.gradeId || '');
      setProductionBlockId(editRecord.productionBlockId || '');
      setPotatoTypeId(editRecord.potatoTypeId || '');
      setSackQuantity(editRecord.sackQuantity || '');
      setKgPerBag(editRecord.kgPerBag || 50);
      setTruckNo(editRecord.truckNo || '');
      setDriverName(editRecord.driverName || '');
      setGrowerFarmerName(editRecord.growerFarmerName || '');
      setRemarks(editRecord.remarks || '');
      setStatus(editRecord.status || 'approved');
    } else {
      resetForm();
    }
  }, [editRecord, isOpen]);

  if (!isOpen) return null;

  const totalKg = (Number(sackQuantity) || 0) * (Number(kgPerBag) || 0);
  const totalMt = Number((totalKg / 1000).toFixed(3));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!kblChallanNo.trim() || !srNo.trim()) {
      addToast('Challan No and SR No are required', 'warning');
      return;
    }

    if (!coldStorageId) {
      addToast('Please select a Cold Storage facility', 'warning');
      return;
    }

    if (!varietyId) {
      addToast('Please select a Potato Variety', 'warning');
      return;
    }

    if (!classId) {
      addToast('Please select a Seed Class', 'warning');
      return;
    }

    if (!gradeId) {
      addToast('Please select a Grade', 'warning');
      return;
    }

    if (!sackQuantity || Number(sackQuantity) <= 0) {
      addToast('Please enter a valid sack quantity', 'warning');
      return;
    }

    if (!kgPerBag || Number(kgPerBag) <= 0) {
      addToast('Please select KG per bag', 'warning');
      return;
    }

    const payload = {
      date,
      kblChallanNo: kblChallanNo.trim().toUpperCase(),
      srNo: srNo.trim().toUpperCase(),
      coldStorageId,
      varietyId,
      classId,
      gradeId,
      productionBlockId: productionBlockId || undefined,
      potatoTypeId: potatoTypeId || undefined,
      sackQuantity: Number(sackQuantity),
      kgPerBag: Number(kgPerBag),
      totalKg,
      totalMt,
      truckNo: truckNo.trim(),
      driverName: driverName.trim(),
      growerFarmerName: growerFarmerName.trim(),
      remarks: remarks.trim(),
      status,
    };

    if (editRecord) {
      updateStockTransaction(editRecord.id, payload);
      showSuccessDialog(
        'STOCK RECORD UPDATED',
        `Stock In entry "${payload.kblChallanNo}" (SR: ${payload.srNo}) has been updated successfully.`
      );
    } else {
      const res = addStockTransaction(payload);
      if (!res.success) {
        addToast(res.message, 'error');
        return;
      }
      resetForm();
      showSuccessDialog(
        'STOCK ENTRY RECORDED',
        `Stock In entry "${payload.kblChallanNo}" (${payload.sackQuantity.toLocaleString()} Bags • ${payload.totalMt} MT) was successfully recorded and added to inventory.`
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                {editRecord ? 'EDIT STOCK RECEIVING RECORD' : 'NEW STOCK RECEIVING (STOCK IN)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log inbound seed potato batches into cold storage
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                DATE *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-100/90 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                KBL CHALLAN NO *
              </label>
              <input
                type="text"
                value={kblChallanNo}
                onChange={(e) => setKblChallanNo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                SR NUMBER *
              </label>
              <input
                type="text"
                value={srNo}
                onChange={(e) => setSrNo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                COLD STORAGE FACILITY *
              </label>
              <select
                value={coldStorageId}
                onChange={(e) => setColdStorageId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT STORAGE FACILITY --</option>
                {coldStorages.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name} ({cs.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                POTATO VARIETY *
              </label>
              <select
                value={varietyId}
                onChange={(e) => setVarietyId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT POTATO VARIETY --</option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                SEED CLASS *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT SEED CLASS --</option>
                {seedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                GRADE *
              </label>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT GRADE --</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                PRODUCTION BLOCK
              </label>
              <select
                value={productionBlockId}
                onChange={(e) => setProductionBlockId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT BLOCK (OPTIONAL) --</option>
                {productionBlocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                POTATO TYPE
              </label>
              <select
                value={potatoTypeId}
                onChange={(e) => setPotatoTypeId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT TYPE (OPTIONAL) --</option>
                {potatoTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity and Calculations Card */}
          <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            <div>
              <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                SACK QUANTITY (BAGS) *
              </label>
              <input
                type="number"
                min="1"
                value={sackQuantity}
                onChange={(e) => setSackQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                KG PER BAG *
              </label>
              <select
                value={kgPerBag}
                onChange={(e) => setKgPerBag(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- SELECT KG / BAG --</option>
                {kgPerBagOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} KG / BAG
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                TOTAL WEIGHT (KG)
              </span>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200">
                {totalKg.toLocaleString()} KG
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                METRIC TONS (MT)
              </span>
              <div className="px-3 py-2 bg-sky-100/80 dark:bg-sky-900/60 rounded-xl text-xs font-black text-sky-800 dark:text-sky-300">
                {totalMt.toFixed(3)} MT
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                TRUCK / VEHICLE NO
              </label>
              <input
                type="text"
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                DRIVER NAME
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                GROWER / FARMER NAME
              </label>
              <input
                type="text"
                value={growerFarmerName}
                onChange={(e) => setGrowerFarmerName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              REMARKS & NOTES
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer uppercase"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editRecord ? 'UPDATE RECORD' : 'SAVE STOCK RECEIPT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
