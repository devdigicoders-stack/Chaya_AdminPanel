import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, 
  RotateCcw, Check, 
  Download, Loader2, Sparkles, Copy, CheckCheck,
  CalendarDays, RefreshCw, X, ExternalLink, ShieldCheck,
  AlertCircle, AlertTriangle, Plus, Printer, Wallet,
  Banknote, ArrowRight, Clock, UserCheck, FileText,
  Building2, CreditCard
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
  const [showDrawer, setShowDrawer] = useState(false);

  // Ref for persistent details card below
  const detailsCardRef = useRef(null);

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
        } else if (res?.days?.length > 0) {
          // Default auto-select: Today's date, or first day with scheduled candidates, or day 1
          const todayKey = formatDateKey(new Date());
          const todayMatch = res.days.find(d => d.dateKey === todayKey);
          const firstScheduled = res.days.find(d => (d.candidatesCount || 0) > 0);
          setSelectedDay(todayMatch || firstScheduled || res.days[0]);
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

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    const todayKey = formatDateKey(now);
    if (calendarData?.days) {
      const todayMatch = calendarData.days.find(d => d.dateKey === todayKey);
      if (todayMatch) {
        setSelectedDay(todayMatch);
        setShowDrawer(true);
      }
    }
  };

  // Day offset for the 1st day of the month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOffset = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentYear, currentMonth]);

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

  // Click Handler for a Day Cell: Selects day and opens premium card
  const handleDaySelect = (dayObj) => {
    setSelectedDay(dayObj);
    setShowDrawer(true);
  };

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
      const res = await apiRescheduleRefund(candidate._id, formValues.newDate, formValues.reason);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Rescheduled Successfully!',
          text: `Refund for ${candidate.candidateName} moved to ${formValues.newDate}.`,
          confirmButtonColor: '#2563eb',
          timer: 2500
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
    <div className="w-full space-y-5">

      {/* ─── 1. Header & Month Navigator ─── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Month Title & Prev/Next */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {monthNames[currentMonth - 1]} {currentYear}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                Full Width Diary
              </span>
              {selectedDay && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Selected: {selectedDay.dateKey}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Standard Daily Limit: <b className="text-slate-800">₹{DAILY_REFUND_CAP.toLocaleString('en-IN')}/Day</b></span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Weekends & Gazetted Holidays Auto-Protected
              </span>
            </p>
          </div>
        </div>

        {/* Navigator Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
          >
            Today
          </button>
          
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-slate-800 font-mono tracking-wide">
              {String(currentMonth).padStart(2, '0')} / {currentYear}
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
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Refresh Calendar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>

          {selectedDay && (
            <button
              onClick={() => setShowDrawer(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              title="Open Day Inspector"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect {selectedDay.dateKey}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Month KPI Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Month Scheduled</span>
          <span className="text-xl font-black text-rose-700 mt-1 block tabular-nums">
            ₹{monthStats.totalScheduled.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-0.5 block">{monthStats.casesCount} candidates allocated</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Month Disbursed</span>
          <span className="text-xl font-black text-emerald-800 mt-1 block tabular-nums">
            ₹{monthStats.totalDisbursed.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 block">Successfully credited</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Working Payout Days</span>
          <span className="text-xl font-black text-slate-900 mt-1 block tabular-nums">
            {monthStats.workingDays} Days
          </span>
          <span className="text-xs text-slate-500 font-medium mt-0.5 block">Max capacity: ₹{(monthStats.workingDays * DAILY_REFUND_CAP).toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs bg-gradient-to-br from-white via-purple-50/20 to-purple-50/50">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Non-Working Days</span>
          <span className="text-xl font-black text-purple-900 mt-1 block tabular-nums">
            {monthStats.holidays} Days
          </span>
          <span className="text-xs text-purple-700 font-medium mt-0.5 block">Saturdays, Sundays & Festivals</span>
        </div>
      </div>

      {/* ─── 3. FULL-WIDTH CALENDAR CONTAINER ─── */}
      <div className="w-full bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        
        {/* Legend Strip across full width */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600 pb-4 mb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></span>
              <span>Available Slot (&lt;₹20k)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs"></span>
              <span>Near Cap (₹20k-₹25k)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></span>
              <span>Full (₹25,000 Quota)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs"></span>
              <span>Festival / Holiday</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 shadow-xs"></span>
              <span>Weekend (Sat / Sun Off)</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Tip: Click any date to view complete case breakdown & allocation details
          </div>
        </div>

        {/* 7 Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 md:gap-3 text-center font-black text-xs text-slate-500 uppercase tracking-wider mb-2">
          <div className="text-rose-500 py-1.5 rounded-lg bg-rose-50/60 border border-rose-100/80">Sun</div>
          <div className="py-1.5 rounded-lg bg-slate-50 border border-slate-100">Mon</div>
          <div className="py-1.5 rounded-lg bg-slate-50 border border-slate-100">Tue</div>
          <div className="py-1.5 rounded-lg bg-slate-50 border border-slate-100">Wed</div>
          <div className="py-1.5 rounded-lg bg-slate-50 border border-slate-100">Thu</div>
          <div className="py-1.5 rounded-lg bg-slate-50 border border-slate-100">Fri</div>
          <div className="text-rose-500 py-1.5 rounded-lg bg-rose-50/60 border border-rose-100/80">Sat</div>
        </div>

        {/* Full-Width Days Grid */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
            <span className="text-sm text-slate-500 font-semibold">Loading full refund calendar diary...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {/* Empty padding cells for first day offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="min-h-[125px] md:min-h-[135px] rounded-2xl bg-slate-50/50 border border-dashed border-slate-200/60"
              />
            ))}

            {/* Real month days */}
            {calendarData?.days?.map(d => {
              const isSelected = selectedDay?.dateKey === d.dateKey;
              const isTodayDate = formatDateKey(new Date()) === d.dateKey;
              const percentFull = Math.min(100, Math.round((d.totalScheduled / d.dailyCap) * 100));

              let cellBg = 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300';
              if (d.isWeekend) {
                cellBg = 'bg-slate-50/80 border-slate-200/70 text-slate-400 hover:bg-slate-100/80';
              } else if (d.isHoliday) {
                cellBg = 'bg-purple-50/60 border-purple-200 hover:bg-purple-50/90 hover:border-purple-300 text-purple-950';
              } else if (d.totalScheduled > 0) {
                cellBg = d.isFull 
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
                  : 'bg-white border-blue-200/90 hover:border-blue-300 shadow-2xs';
              }

              if (isSelected) {
                cellBg = 'bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 border-blue-500 ring-3 ring-blue-500/30 shadow-md scale-[1.01] z-10';
              }

              return (
                <div
                  key={d.dateKey}
                  onClick={() => handleDaySelect(d)}
                  className={`min-h-[135px] md:min-h-[148px] p-2.5 md:p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative group ${cellBg}`}
                >
                  {/* Top Row: Date Number & Badges */}
                  <div className="flex items-start justify-between gap-1.5">
                    <span className={`text-xs md:text-sm font-black inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-xl transition-transform group-hover:scale-105 ${
                      isTodayDate 
                        ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/30' 
                        : d.isWeekend 
                        ? 'text-slate-400 bg-slate-100' 
                        : d.isHoliday 
                        ? 'text-purple-800 bg-purple-100' 
                        : 'text-slate-800 bg-slate-100'
                    }`}>
                      {d.day}
                    </span>

                    {/* Pill Badges with exact fit - NO TRUNCATION */}
                    {d.isHoliday ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1 shadow-2xs">
                        <span>🎉</span>
                        <span>Holiday</span>
                      </span>
                    ) : d.isWeekend ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                        {d.weekendName === 'Sunday' ? 'Sun Off' : 'Sat Off'}
                      </span>
                    ) : d.totalScheduled > 0 ? (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs ${
                        d.isFull 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {d.candidatesCount} Case{d.candidatesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                        Open
                      </span>
                    )}
                  </div>

                  {/* Middle: Festival name or Working capacity status */}
                  <div className="my-1.5 flex-1 flex flex-col justify-center">
                    {d.isHoliday ? (
                      <div>
                        <p className="text-xs md:text-[13px] font-black text-purple-950 leading-snug break-words" title={d.holidayName}>
                          {d.holidayName}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9.5px] font-bold text-purple-800 bg-purple-100/90 px-1.5 py-0.5 rounded border border-purple-200/70 inline-block">
                            Banking Paused
                          </span>
                        </div>
                      </div>
                    ) : d.isWeekend ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Weekend Off
                        </p>
                        <span className="text-[10px] text-slate-400/80 block mt-0.5">
                          No Disbursements
                        </span>
                      </div>
                    ) : d.totalScheduled > 0 ? (
                      <div>
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-xs md:text-sm font-black text-slate-900 tabular-nums">
                            ₹{d.totalScheduled.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            / ₹25k
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-0.5">
                          <span className={d.isFull ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                            {d.isFull ? 'Cap Full' : `₹${Math.max(0, d.dailyCap - d.totalScheduled).toLocaleString('en-IN')} left`}
                          </span>
                          <span className="text-slate-400 tabular-nums font-mono">{percentFull}%</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-emerald-700 block flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Slot Available
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          ₹25,000 Quota Open
                        </span>
                      </div>
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

                  {/* Active Indicator on Selected */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. FULL-WIDTH PERSISTENT SELECTED DAY DIARY & DETAILS CARD (BELOW CALENDAR) ─── */}
      {selectedDay && (
        <div ref={detailsCardRef} className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-7 space-y-6">
          
          {/* Card Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                selectedDay.isHoliday 
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20' 
                  : selectedDay.isWeekend 
                  ? 'bg-gradient-to-tr from-slate-600 to-slate-500 shadow-slate-500/20' 
                  : 'bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-rose-500/20'
              }`}>
                <CalendarDays className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    Day Diary Details
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedDay.isWorkingDay 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : selectedDay.isHoliday 
                      ? 'bg-purple-50 text-purple-900 border border-purple-200' 
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {selectedDay.isWorkingDay ? 'Working Day' : selectedDay.isHoliday ? `Festival Holiday: ${selectedDay.holidayName}` : `Weekend: ${selectedDay.weekendName}`}
                  </span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                  {new Date(selectedDay.dateKey + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {onOpenPayoutModal && selectedDay.isWorkingDay && !selectedDay.isFull && (
                <button
                  onClick={() => onOpenPayoutModal({ scheduledDate: selectedDay.dateKey })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Allocate Candidate Here</span>
                </button>
              )}
              
              <button
                onClick={() => setShowDrawer(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Slide Inspector</span>
              </button>
            </div>
          </div>

          {/* Daily Quota Speedometer / Allocation Gauge */}
          <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Allocated Amount</span>
                <span className="text-lg md:text-xl font-black text-slate-900 mt-0.5 block tabular-nums">
                  ₹{(selectedDay.totalScheduled || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-medium">Of ₹{DAILY_REFUND_CAP.toLocaleString('en-IN')} Maximum Daily Cap</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Disbursed / Paid</span>
                <span className="text-lg md:text-xl font-black text-emerald-800 mt-0.5 block tabular-nums">
                  ₹{(selectedDay.totalDisbursed || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-700 font-medium">Successfully processed</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Available Headroom</span>
                <span className="text-lg md:text-xl font-black text-blue-800 mt-0.5 block tabular-nums">
                  ₹{Math.max(0, DAILY_REFUND_CAP - (selectedDay.totalScheduled || 0)).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-blue-700 font-medium">{selectedDay.candidatesCount || 0} candidate case(s) active</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  selectedDay.isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-blue-600'
                }`}
                style={{ width: `${Math.min(100, Math.round(((selectedDay.totalScheduled || 0) / DAILY_REFUND_CAP) * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Scheduled Candidates List Grid */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-600" />
                <span>Scheduled Candidates ({selectedDay.candidates?.length || 0})</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {selectedDay.isWorkingDay ? 'Eligible for same-day RTGS / NEFT / UPI settlement' : 'Banking processing paused on non-working dates'}
              </span>
            </div>

            {selectedDay.candidates?.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <h5 className="text-base font-bold text-slate-800">No Refund Cases Scheduled on this Date</h5>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  {selectedDay.isWorkingDay 
                    ? `This working day is completely open with ₹${DAILY_REFUND_CAP.toLocaleString('en-IN')} available capacity. You can safely allocate new refund requests here.` 
                    : `This date is designated as a ${selectedDay.isHoliday ? 'public festival holiday' : 'weekend off'}. The automated scheduler does not book payouts on non-working days.`}
                </p>
                {selectedDay.isWorkingDay && onOpenPayoutModal && (
                  <button
                    onClick={() => onOpenPayoutModal({ scheduledDate: selectedDay.dateKey })}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    Allocate Candidate to {selectedDay.dateKey}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedDay.candidates.map(candidate => {
                  const isSettled = candidate.isRefundMarked || candidate.closureStatus === 'FINAL_CLOSED';
                  const payable = candidate.refundBalance > 0 ? candidate.refundBalance : candidate.refundPayable;

                  return (
                    <div
                      key={candidate._id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                        isSettled 
                          ? 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Candidate Name & Amount */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-black text-slate-900 text-sm block leading-snug">
                              {candidate.candidateName}
                            </span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                              {candidate.phone} • {candidate.passportNumber || candidate.leadId}
                            </span>
                            {candidate.trade && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                                {candidate.trade}
                              </span>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-rose-700 text-base block tabular-nums">
                              ₹{(payable || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-1 ${
                              isSettled 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {isSettled ? 'REFUNDED' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Bank Details Box */}
                        {(candidate.bankDetails?.accountNumber || candidate.bankDetails?.upiId) && (
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-700 flex items-center justify-between gap-2">
                            <div className="truncate">
                              {candidate.bankDetails.accountNumber ? (
                                <>
                                  <span className="font-bold text-slate-500 block text-[10px]">BANK A/C ({candidate.bankDetails.bankName || 'BANK'}):</span>
                                  <span className="font-black text-slate-900">{candidate.bankDetails.accountNumber}</span>
                                  {candidate.bankDetails.ifsc && (
                                    <span className="text-slate-500 block text-[10px]">IFSC: {candidate.bankDetails.ifsc}</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-slate-500 block text-[10px]">UPI VIRTUAL ADDRESS:</span>
                                  <span className="font-black text-slate-900">{candidate.bankDetails.upiId}</span>
                                </>
                              )}
                            </div>

                            <button
                              onClick={() => copyText(candidate.bankDetails.accountNumber || candidate.bankDetails.upiId, candidate._id)}
                              className="text-slate-400 hover:text-slate-800 p-1.5 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                              title="Copy account details"
                            >
                              {copiedId === candidate._id ? (
                                <CheckCheck className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            Settled & Closed
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleQuickMarkRefunded(candidate)}
                              disabled={actionLoadingId === candidate._id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                              title="Mark as Paid / Settled"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Refunded</span>
                            </button>

                            <button
                              onClick={() => handleReschedule(candidate)}
                              disabled={actionLoadingId === candidate._id}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                              title="Move to another date"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reschedule</span>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => generateRefundPdf(candidate, { download: true })}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Download Official Statement PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 5. SLIDE-OVER PREMIUM DRAWER (OPENS ON CLICK ON ANY DATE) ─── */}
      {showDrawer && selectedDay && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setShowDrawer(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-xl md:max-w-2xl bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 md:p-6 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full">
                    Day Diary Log
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedDay.isWorkingDay ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedDay.isWorkingDay ? 'Working Day' : selectedDay.isHoliday ? 'Holiday' : 'Weekend'}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {new Date(selectedDay.dateKey + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {selectedDay.isHoliday ? `Public Holiday: ${selectedDay.holidayName}` : selectedDay.isWeekend ? 'Official Weekend Non-Working Day' : 'Banking Payout Working Day'}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowDrawer(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
              
              {/* Quota Speedometer Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between font-bold text-xs mb-2">
                  <span className="text-slate-600">Daily Quota Utilization:</span>
                  <span className="tabular-nums font-black text-slate-900">
                    ₹{(selectedDay.totalScheduled || 0).toLocaleString('en-IN')} / ₹{DAILY_REFUND_CAP.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedDay.isFull ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round(((selectedDay.totalScheduled || 0) / DAILY_REFUND_CAP) * 100))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{selectedDay.candidatesCount || 0} candidate(s) allocated</span>
                  <span className="font-bold text-emerald-700">
                    ₹{Math.max(0, DAILY_REFUND_CAP - (selectedDay.totalScheduled || 0)).toLocaleString('en-IN')} remaining
                  </span>
                </div>
              </div>

              {/* Candidate Cases List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">
                    Allocated Candidates ({selectedDay.candidates?.length || 0})
                  </h4>
                  {onOpenPayoutModal && selectedDay.isWorkingDay && !selectedDay.isFull && (
                    <button
                      onClick={() => onOpenPayoutModal({ scheduledDate: selectedDay.dateKey })}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Case</span>
                    </button>
                  )}
                </div>

                {selectedDay.candidates?.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No refunds scheduled</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedDay.isWorkingDay 
                        ? 'Full ₹25,000 capacity available for disbursement.' 
                        : 'Non-working day (No cancellations allocated).'}
                    </p>
                  </div>
                ) : (
                  selectedDay.candidates.map(candidate => {
                    const isSettled = candidate.isRefundMarked || candidate.closureStatus === 'FINAL_CLOSED';
                    const payable = candidate.refundBalance > 0 ? candidate.refundBalance : candidate.refundPayable;

                    return (
                      <div
                        key={candidate._id}
                        className={`p-3.5 rounded-2xl border text-xs transition ${
                          isSettled 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        {/* Candidate Name & Amount */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {candidate.candidateName}
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-500 mt-0.5 block">
                              {candidate.phone} • {candidate.passportNumber || candidate.leadId}
                            </span>
                            {candidate.trade && (
                              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                                {candidate.trade}
                              </span>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-rose-700 text-xs block tabular-nums">
                              ₹{(payable || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                              isSettled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isSettled ? 'REFUNDED' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Bank Details */}
                        {(candidate.bankDetails?.accountNumber || candidate.bankDetails?.upiId) && (
                          <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10.5px] font-mono flex items-center justify-between text-slate-700">
                            <span className="truncate">
                              {candidate.bankDetails.accountNumber 
                                ? `A/C: ${candidate.bankDetails.accountNumber} (${candidate.bankDetails.ifsc || 'IFSC'})` 
                                : `UPI: ${candidate.bankDetails.upiId}`}
                            </span>
                            <button
                              onClick={() => copyText(candidate.bankDetails.accountNumber || candidate.bankDetails.upiId, candidate._id)}
                              className="text-slate-400 hover:text-slate-800 p-1"
                              title="Copy details"
                            >
                              {copiedId === candidate._id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Settled & Closed
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleQuickMarkRefunded(candidate)}
                                disabled={actionLoadingId === candidate._id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark Refunded</span>
                              </button>

                              <button
                                onClick={() => handleReschedule(candidate)}
                                disabled={actionLoadingId === candidate._id}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reschedule</span>
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => generateRefundPdf(candidate, { download: true })}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition cursor-pointer"
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

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Max ₹25k limit per working day policy enforced</span>
              </span>

              <button
                onClick={() => setShowDrawer(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
