import React, { useState, useRef } from 'react';
import { ShieldCheck, Save, Download, RotateCcw, Building2, CheckCircle2, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    exportDatabaseJson,
    importDatabaseJson,
    resetToDemoData,
    addToast,
  } = useApp();

  const [companyName, setCompanyName] = useState(companySettings?.companyName || 'KISHAN BOTANIX LTD.');
  const [companyTagline, setCompanyTagline] = useState(companySettings?.companyTagline || companySettings?.tagline || 'INVENTORY MANAGEMENT APP');
  const [address, setAddress] = useState(companySettings?.legalAddress || companySettings?.address || 'House-12, Road-04, Block-F, Banani, Dhaka-1213, Bangladesh');
  const [contactEmail, setContactEmail] = useState(companySettings?.email || 'info@kisanbotanix.com');
  const [contactPhone, setContactPhone] = useState(companySettings?.phone || '+880 1711-234567');
  const [logoUrl, setLogoUrl] = useState(companySettings?.logoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (companySettings) {
      if (companySettings.companyName) setCompanyName(companySettings.companyName);
      if (companySettings.companyTagline || companySettings.tagline) {
        setCompanyTagline(companySettings.companyTagline || companySettings.tagline || '');
      }
      if (companySettings.legalAddress || companySettings.address) {
        setAddress(companySettings.legalAddress || companySettings.address || '');
      }
      if (companySettings.email) setContactEmail(companySettings.email);
      if (companySettings.phone) setContactPhone(companySettings.phone);
      if (companySettings.logoUrl !== undefined) setLogoUrl(companySettings.logoUrl);
    }
  }, [companySettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast?.('Please upload a valid image file (PNG, JPG, SVG, WebP)', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast?.('Logo file size should be less than 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      updateCompanySettings({ logoUrl: result });
      addToast?.('Company logo uploaded and updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    updateCompanySettings({ logoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast?.('Company logo removed successfully', 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      companyName,
      tagline: companyTagline,
      companyTagline: companyTagline,
      address,
      legalAddress: address,
      email: contactEmail,
      phone: contactPhone,
      logoUrl,
    });
    addToast?.('Updated organization settings & legal address successfully', 'success');
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `potato_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast?.('Exported full database backup', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              System Settings & Company Profile
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Company branding, report header configurations, database backup & restore
          </p>
        </div>

        <button
          onClick={handleExportBackup}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT BACKUP JSON</span>
        </button>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-3xl">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          {/* Company Logo Add & Remove Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                Company Brand Logo
              </label>
              {logoUrl ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Logo Active
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">
                  Using Default Icon
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview */}
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 p-1.5 shadow-2xs overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company Logo Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-7 h-7 stroke-[1.5]" />
                    <span className="text-[9px] font-semibold mt-1">No Logo</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? 'Change Logo Image' : 'Upload Company Logo'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recommended: Square or transparent PNG/SVG (max 2MB). This logo will appear on the sidebar, header, and official print reports.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              System Tagline / Subtitle
            </label>
            <input
              type="text"
              value={companyTagline}
              onChange={(e) => setCompanyTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              KBL Legal Registered Office Address (Official Report & Print Header) *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              This official address is dynamically populated across all Print Previews, PDF Reports, and Excel exports.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset entire system to factory demo dataset?')) {
                  resetToDemoData();
                  addToast?.('Restored factory demo dataset', 'info');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Demo Data</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>SAVE SETTINGS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
