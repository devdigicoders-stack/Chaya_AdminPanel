import React, { useState } from 'react';
import { Database, Download, Cloud, RefreshCw, CheckCircle2, Shield, HardDrive, Trash2 } from 'lucide-react';

const backupArchives = [
  { id: 1, filename: 'chhaya_backup_2024_10_19_0200.sql.gz', date: 'Today at 02:00 AM', size: '142.8 MB', type: 'Automated Daily', status: 'Verified' },
  { id: 2, filename: 'chhaya_backup_2024_10_18_0200.sql.gz', date: '18 Oct 2024, 02:00 AM', size: '141.2 MB', type: 'Automated Daily', status: 'Verified' },
  { id: 3, filename: 'chhaya_backup_2024_10_17_0200.sql.gz', date: '17 Oct 2024, 02:00 AM', size: '139.6 MB', type: 'Automated Daily', status: 'Verified' },
  { id: 4, filename: 'chhaya_manual_pre_migration.sql.gz', date: '15 Oct 2024, 04:30 PM', size: '138.4 MB', type: 'Manual Snapshot', status: 'Verified' },
];

const BackupTab = () => {
  const [backups, setBackups] = useState(backupArchives);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const triggerManualBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(10);
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          setBackupSuccess(true);
          const newArchive = {
            id: Date.now(),
            filename: `chhaya_manual_${new Date().toISOString().slice(0, 10)}.sql.gz`,
            date: 'Just now',
            size: '143.1 MB',
            type: 'Manual Snapshot',
            status: 'Verified',
          };
          setBackups([newArchive, ...backups]);
          setTimeout(() => setBackupSuccess(false), 4000);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Cloud Backup Health Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 text-[15px]">Automated Cloud Disaster Recovery</h4>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Healthy & Active
                </span>
              </div>
              <p className="text-[12px] text-gray-500">Nightly cryptographic snapshot stored in AWS S3 Mumbai with 256-bit AES encryption</p>
            </div>
          </div>

          <button
            onClick={triggerManualBackup}
            disabled={isBackingUp}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
            {isBackingUp ? 'Archiving Database...' : 'Take Manual Backup Now'}
          </button>
        </div>

        {/* Progress bar during manual backup */}
        {isBackingUp && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex justify-between text-[12px] font-medium text-blue-900 mb-1.5">
              <span>Generating SQL dump and compressing candidate dockets...</span>
              <span>{backupProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
          </div>
        )}

        {backupSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[12px] font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Manual database snapshot created and safely archived!
          </div>
        )}

        {/* Storage stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <div className="text-[11px] text-gray-500 font-medium">Backup Schedule</div>
            <div className="text-[14px] font-bold text-gray-900 mt-0.5">Every Night @ 02:00 AM IST</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Next in 7 hours 25 mins</div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <div className="text-[11px] text-gray-500 font-medium">Retention Window</div>
            <div className="text-[14px] font-bold text-gray-900 mt-0.5">30 Rolling Daily Copies</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Auto-purge after 30 days</div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
            <div className="text-[11px] text-gray-500 font-medium">Storage Location</div>
            <div className="text-[14px] font-bold text-gray-900 mt-0.5">AWS S3 (ap-south-1)</div>
            <div className="text-[11px] text-purple-600 font-mono mt-0.5">s3://chhaya-crm-backups/</div>
          </div>
        </div>
      </div>

      {/* Available Backup Archives List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Available Backup Archives</h4>
            <p className="text-[12px] text-gray-500">Downloadable encrypted SQL dumps for disaster recovery</p>
          </div>
          <span className="text-[12px] text-gray-500">{backups.length} Snapshots Available</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Archive Filename</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Integrity</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-gray-900 text-[12px]">
                    {b.filename}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 text-[12px]">
                    {b.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-700 text-[12px]">
                    {b.size}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      title="Download Archive"
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupTab;
