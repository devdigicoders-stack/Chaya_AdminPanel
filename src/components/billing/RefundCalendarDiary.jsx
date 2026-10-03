import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, 
  RotateCcw, Check, 
  Download, Loader2, Sparkles, Copy, CheckCheck,
  CalendarDays, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  apiGetRefundCalendar, 
  apiRescheduleRefund, 
  apiMarkRefunded 
} from '../../utils/api';
import { generateRefundPdf } from '../../utils/refundPdfGenerator';
import { DAILY_REFUND_CAP, formatDateKey } from '../../utils/holidayCalendar';

export default function RefundCalendarDiary({ onOpenPayoutModal, onUpdated }) {
  // Current displayed Month & Year
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Calendar Data from backend
  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await apiGetRefundCalendar(currentYear, currentMonth);
      if (res?.success) {
        setCalendarData(res);
        // If a day was selected, refresh its details
        if (selectedDay) {
          const updated = res.days.find(d => d.dateKey === selectedDay.dateKey);
          if (updated) setSelectedDay(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load refund calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentYear, currentMonth]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  // Month KPI stats
  const monthStats = useMemo(() => {
    if (!calendarData?.days) return { totalScheduled: 0, totalDisbursed: 0, workingDays: 0, holidays: 0, casesCount: 0 };
    let totalScheduled = 0;
    let totalDisbursed = 0;
    let workingDays = 0;
    let holidays = 0;
    let casesCount = 0;

    calendarData.days.forEach(d => {
      totalScheduled += d.totalScheduled || 0;
      totalDisbursed += d.totalDisbursed || 0;
      if (d.isWorkingDay) workingDays++;
      if (d.isHoliday || d.isWeekend) holidays++;
      casesCount += d.candidatesCount || 0;
    });

    return { totalScheduled, totalDisbursed, workingDays, holidays, casesCount };
  }, [calendarData]);

  // Day offset for the 1st day of the month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOffset = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentYear, currentMonth]);

  // Copy helper
  const copyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Quick Mark as Refunded from Diary
  const handleQuickMarkRefunded = async (candidate) => {
    const payable = candidate.refundBalance > 0 ? candidate.refundBalance : candidate.refundPayable;

    const { value: formValues } = await Swal.fire({
      title: 'Mark as Refunded?',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5;">
          <p>You are recording refund settlement for <b>${candidate.candidateName}</b>.</p>
          <div style="margin: 10px 0; padding: 10px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46;">
            <b>Disbursement Amount: ₹${payable.toLocaleString('en-IN')}</b>
          </div>
          <div style="margin-bottom: 8px;">
            <label style="display: block; font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px;">Payment Mode</label>
            <select id="swal-pay-mode" class="swal2-select" style="width: 100%; margin: 0; font-size: 12px; height: 36px;">
              <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CHEQUE">Bank Cheque</option>
              <option value="CASH">Cash Voucher</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px;">Bank Ref / UTR / Cheque No. *</label>
            <input id="swal-ref-no" class="swal2-input" style="width: 100%; margin: 0; font-size: 12px; height: 36px;" placeholder="e.g. UTR-98347102948" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm & Mark Refunded',
      confirmButtonColor: '#059669',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const paymentMode = document.getElementById('swal-pay-mode')?.value;
        const referenceNo = document.getElementById('swal-ref-no')?.value?.trim();
        if (!referenceNo && paymentMode !== 'CASH') {
          Swal.showValidationMessage('Bank Reference / UTR Number is required');
          return false;
        }
        return { paymentMode, referenceNo };
      }
    });

    if (!formValues) return;

    setActionLoadingId(candidate._id);
    try {
      const res = await apiMarkRefunded(candidate._id, {
        paymentMode: formValues.paymentMode,
        referenceNo: formValues.referenceNo,
        remarks: `Disbursed and settled via Diary for scheduled date ${selectedDay?.dateKey}`
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Refund Marked as Settled!',
          text: `Candidate ${candidate.candidateName} has been marked REFUNDED and file is FINAL_CLOSED.`,
          confirmButtonColor: '#059669',
          timer: 2500
        });
        fetchCalendar();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      Swal.fire('Action Failed', err.message || 'Could not mark as refunded', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reschedule Candidate to a new Working Date
  const handleReschedule = async (candidate) => {
    const { value: formValues } = await Swal.fire({
      title: 'Reschedule Refund Date?',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5;">
          <p>Current Scheduled Date: <b>${selectedDay?.dateKey}</b></p>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Select an alternate working day (excluding weekends & festivals) for <b>${candidate.candidateName}</b>:</p>
          <div style="margin: 12px 0;">
            <label style="display: block; font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px;">New Target Date *</label>
            <input type="date" id="swal-new-date" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; height: 38px;" value="${selectedDay?.dateKey || ''}" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px;">Reschedule Reason</label>
            <input id="swal-reason" class="swal2-input" style="width: 100%; margin: 0; font-size: 12px; height: 36px;" placeholder="e.g. Candidate requested later date / Bank holiday adjustment" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Reschedule',
      confirmButtonColor: '#2563eb',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const newDate = document.getElementById('swal-new-date')?.value;
        const reason = document.getElementById('swal-reason')?.value?.trim();
        if (!newDate) {
          Swal.showValidationMessage('Please select a valid new date');
          return false;
        }
        return { newDate, reason };
      }
    });

    if (!formValues) return;

    setActionLoadingId(candidate._id);
    try {
      const res = await apiRescheduleRefund(candidate._id, formValues);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Rescheduled!',
          text: `Refund has been rescheduled to ${formValues.newDate}.`,
          confirmButtonColor: '#2563eb',
          timer: 2000
        });
        fetchCalendar();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      Swal.fire('Reschedule Failed', err.message || 'Could not reschedule date', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* ─── 1. Header & Month Navigator ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Month Title & Prev/Next */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {monthNames[currentMonth - 1]} {currentYear}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Diary View
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>Dynamic Cap: <b>₹{DAILY_REFUND_CAP.toLocaleString('en-IN')}/Day</b></span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Excludes Weekends & Public Holidays</span>
            </p>
          </div>
        </div>

        {/* Navigator Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-700 font-mono">
              {String(currentMonth).padStart(2, '0')}/{currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={fetchCalendar}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="Refresh Calendar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. Month KPI Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Month Scheduled</span>
          <span className="text-lg font-black text-rose-700 mt-0.5 block tabular-nums">
            ₹{monthStats.totalScheduled.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">{monthStats.casesCount} candidates queued</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block">Month Disbursed</span>
          <span className="text-lg font-black text-emerald-800 mt-0.5 block tabular-nums">
            ₹{monthStats.totalDisbursed.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Successfully credited</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Disbursement Days</span>
          <span className="text-lg font-black text-slate-900 mt-0.5 block tabular-nums">
            {monthStats.workingDays} Days
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Open for refund payouts</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs bg-gradient-to-br from-white to-purple-50/30">
          <span className="text-[10.5px] font-bold text-purple-700 uppercase tracking-wider block">Non-Working Days</span>
          <span className="text-lg font-black text-purple-900 mt-0.5 block tabular-nums">
            {monthStats.holidays} Days
          </span>
          <span className="text-[11px] text-purple-700 font-medium">Saturdays, Sundays & Festivals</span>
        </div>
      </div>

      {/* ─── 3. Calendar Grid & Diary Side-by-Side ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left: Monthly Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          
          {/* Legend Strip */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 pb-3 mb-3 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Available Slot (&lt;₹20k)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Near Cap (₹20k-₹25k)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Full (₹25,000 Quota)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Festival / Holiday</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span>Sat / Sun (Off)</span>
            </span>
          </div>

          {/* 7 Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
            <div className="text-rose-500">Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-rose-500">Sat</div>
          </div>

          {/* Days Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Loading refund diary...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty padding cells for first day offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[92px] rounded-xl bg-slate-50/40 border border-transparent"></div>
              ))}

              {/* Real month days */}
              {calendarData?.days?.map(d => {
                const isSelected = selectedDay?.dateKey === d.dateKey;
                const isTodayDate = formatDateKey(new Date()) === d.dateKey;
                const percentFull = Math.min(100, Math.round((d.totalScheduled / d.dailyCap) * 100));

                let cellBg = 'bg-white hover:bg-slate-50 border-slate-200';
                if (d.isWeekend) {
                  cellBg = 'bg-slate-50/70 border-slate-200/70 text-slate-400';
                } else if (d.isHoliday) {
                  cellBg = 'bg-purple-50/50 border-purple-200/80 text-purple-900';
                } else if (d.totalScheduled > 0) {
                  cellBg = d.isFull ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-blue-200 shadow-2xs';
                }

                if (isSelected) {
                  cellBg = 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs';
                }

                return (
                  <div
                    key={d.dateKey}
                    onClick={() => setSelectedDay(d)}
                    className={`min-h-[92px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${cellBg}`}
                  >
                    {/* Top Row: Date Number & Badge */}
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-xs font-black inline-flex items-center justify-center w-5 h-5 rounded-md ${
                        isTodayDate 
                          ? 'bg-rose-600 text-white shadow-xs' 
                          : d.isWeekend 
                          ? 'text-slate-400' 
                          : d.isHoliday 
                          ? 'text-purple-700' 
                          : 'text-slate-800'
                      }`}>
                        {d.day}
                      </span>

                      {/* Pill Badge */}
                      {d.isHoliday ? (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 truncate max-w-[55px]" title={d.holidayName}>
                          🎉 {d.holidayName}
                        </span>
                      ) : d.isWeekend ? (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                          {d.weekendName === 'Sunday' ? 'Sun' : 'Sat'}
                        </span>
                      ) : d.totalScheduled > 0 ? (
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                          d.isFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {d.candidatesCount} Case{d.candidatesCount > 1 ? 's' : ''}
                        </span>
                      ) : null}
                    </div>

                    {/* Middle: Festival name or Working capacity */}
                    <div className="my-1">
                      {d.isHoliday ? (
                        <p className="text-[9.5px] font-bold text-purple-800 line-clamp-1 leading-tight" title={d.holidayName}>
                          {d.holidayName}
                        </p>
                      ) : d.isWeekend ? (
                        <p className="text-[9.5px] font-semibold text-slate-400">
                          Weekend Off
                        </p>
                      ) : d.totalScheduled > 0 ? (
                        <div>
                          <span className="text-[10.5px] font-extrabold text-slate-900 block tabular-nums leading-tight">
                            ₹{d.totalScheduled.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            of ₹25k cap
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9.5px] font-medium text-emerald-600 block">
                          Slot Open
                        </span>
                      )}
                    </div>

                    {/* Bottom: Capacity Progress Bar for Working Days */}
                    {d.isWorkingDay && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            d.isFull ? 'bg-rose-500' : percentFull > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentFull}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Daily Refund Diary Drawer / Selected Day Card (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            {/* Selected Date Header */}
            <div className="border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Day Diary Log
                </span>
                {selectedDay && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedDay.isWorkingDay 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedDay.isWorkingDay ? 'Working Day' : selectedDay.isHoliday ? 'Festival Holiday' : 'Weekend'}
                  </span>
                )}
              </div>

              <h3 className="text-base font-black text-slate-900 mt-1.5">
                {selectedDay ? (
                  new Date(selectedDay.dateKey + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                ) : (
                  'Select a Date from Calendar'
                )}
              </h3>

              {selectedDay && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-600">Daily Quota:</span>
                    <span className="tabular-nums font-black text-slate-900">
                      ₹{(selectedDay.totalScheduled || 0).toLocaleString('en-IN')} / ₹{DAILY_REFUND_CAP.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedDay.isFull ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round(((selectedDay.totalScheduled || 0) / DAILY_REFUND_CAP) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1">
                    <span>{selectedDay.candidatesCount || 0} candidate(s) scheduled</span>
                    <span className="font-semibold text-emerald-700">
                      ₹{Math.max(0, DAILY_REFUND_CAP - (selectedDay.totalScheduled || 0)).toLocaleString('en-IN')} slot remaining
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Candidates Scheduled on this Date */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {!selectedDay ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Click on any date to inspect scheduled refund cases.</p>
                </div>
              ) : selectedDay.candidates?.length === 0 ? (
                <div className="text-center py-14 text-slate-400 text-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-700">No refunds scheduled</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedDay.isWorkingDay ? 'This working day has full capacity available (₹25,000).' : 'Non-working day (No cancellations allocated).'}
                  </p>
                </div>
              ) : (
                selectedDay.candidates.map(candidate => {
                  const isSettled = candidate.isRefundMarked || candidate.closureStatus === 'FINAL_CLOSED';

                  return (
                    <div
                      key={candidate._id}
                      className={`p-3 rounded-xl border text-xs transition ${
                        isSettled 
                          ? 'bg-emerald-50/50 border-emerald-200' 
                          : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      {/* Candidate Name & Amount Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight text-xs">
                            {candidate.candidateName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                            {candidate.phone} • {candidate.passportNumber || candidate.leadId}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-rose-700 text-xs block tabular-nums">
                            ₹{(candidate.refundPayable || 0).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                            isSettled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isSettled ? 'REFUNDED' : 'PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* Bank / UPI pill */}
                      {candidate.bankDetails?.accountNumber || candidate.bankDetails?.upiId ? (
                        <div className="mt-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10.5px] font-mono flex items-center justify-between text-slate-600">
                          <span>
                            {candidate.bankDetails.accountNumber ? `A/C: ${candidate.bankDetails.accountNumber}` : `UPI: ${candidate.bankDetails.upiId}`}
                          </span>
                          <button
                            onClick={() => copyText(candidate.bankDetails.accountNumber || candidate.bankDetails.upiId, candidate._id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title="Copy details"
                          >
                            {copiedId === candidate._id ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : null}

                      {/* Diary Action Buttons */}
                      <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Settled & Closed
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* Quick Mark Refunded */}
                            <button
                              onClick={() => handleQuickMarkRefunded(candidate)}
                              disabled={actionLoadingId === candidate._id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                              title="Mark as Paid / Settled"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Refunded</span>
                            </button>

                            {/* Reschedule Date */}
                            <button
                              onClick={() => handleReschedule(candidate)}
                              disabled={actionLoadingId === candidate._id}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Move to another date"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reschedule</span>
                            </button>
                          </div>
                        )}

                        {/* Statement PDF */}
                        <button
                          onClick={() => generateRefundPdf(candidate, { download: true })}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition cursor-pointer"
                          title="Download Statement"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Notice footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Automatic policy ensures max ₹25k limit per working day.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
