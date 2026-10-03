/**
 * Indian Public Holidays & Festival Utility for Frontend Calendar
 * Chhaya International Compliance Standards
 */

export const DAILY_REFUND_CAP = 25000;

export const HOLIDAYS = {
  // ─── 2025 Holidays ───
  '2025-01-01': 'New Year\'s Day',
  '2025-01-14': 'Makar Sankranti / Pongal',
  '2025-01-26': 'Republic Day',
  '2025-02-26': 'Maha Shivratri',
  '2025-03-14': 'Holi',
  '2025-03-31': 'Eid-ul-Fitr',
  '2025-04-06': 'Ram Navami',
  '2025-04-10': 'Mahavir Jayanti',
  '2025-04-14': 'Dr. B.R. Ambedkar Jayanti',
  '2025-04-18': 'Good Friday',
  '2025-05-01': 'May Day / Labour Day',
  '2025-05-12': 'Buddha Purnima',
  '2025-06-07': 'Bakrid / Eid-ul-Adha',
  '2025-07-06': 'Muharram',
  '2025-08-15': 'Independence Day',
  '2025-08-16': 'Janmashtami',
  '2025-09-05': 'Milad-un-Nabi',
  '2025-10-02': 'Mahatma Gandhi Jayanti',
  '2025-10-02': 'Dussehra / Vijayadashami',
  '2025-10-20': 'Diwali / Deepavali',
  '2025-10-21': 'Govardhan Puja',
  '2025-10-22': 'Bhai Dooj',
  '2025-11-05': 'Guru Nanak Jayanti',
  '2025-12-25': 'Christmas Day',

  // ─── 2026 Holidays ───
  '2026-01-01': 'New Year\'s Day',
  '2026-01-14': 'Makar Sankranti / Pongal',
  '2026-01-26': 'Republic Day',
  '2026-02-15': 'Maha Shivratri',
  '2026-03-03': 'Holika Dahan',
  '2026-03-04': 'Holi',
  '2026-03-20': 'Eid-ul-Fitr',
  '2026-03-27': 'Ram Navami',
  '2026-03-31': 'Mahavir Jayanti',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. B.R. Ambedkar Jayanti',
  '2026-05-01': 'May Day / Labour Day',
  '2026-05-02': 'Buddha Purnima',
  '2026-05-27': 'Bakrid / Eid-ul-Adha',
  '2026-06-26': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-09-04': 'Janmashtami',
  '2026-09-15': 'Milad-un-Nabi',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra / Vijayadashami',
  '2026-11-08': 'Diwali / Deepavali',
  '2026-11-09': 'Govardhan Puja',
  '2026-11-10': 'Bhai Dooj',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas Day',

  // ─── 2027 Holidays ───
  '2027-01-01': 'New Year\'s Day',
  '2027-01-14': 'Makar Sankranti',
  '2027-01-26': 'Republic Day',
  '2027-03-06': 'Maha Shivratri',
  '2027-03-22': 'Holi',
  '2027-03-10': 'Eid-ul-Fitr',
  '2027-03-26': 'Good Friday',
  '2027-04-14': 'Ambedkar Jayanti',
  '2027-04-15': 'Ram Navami',
  '2027-05-17': 'Bakrid / Eid-ul-Adha',
  '2027-08-15': 'Independence Day',
  '2027-08-25': 'Janmashtami',
  '2027-10-02': 'Mahatma Gandhi Jayanti',
  '2027-10-09': 'Dussehra',
  '2027-10-29': 'Diwali',
  '2027-11-14': 'Guru Nanak Jayanti',
  '2027-12-25': 'Christmas Day'
};

export const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getHolidayName = (date) => {
  const key = formatDateKey(date);
  return HOLIDAYS[key] || null;
};

export const getDayDetails = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendName = dayOfWeek === 0 ? 'Sunday' : dayOfWeek === 6 ? 'Saturday' : null;
  const holidayName = getHolidayName(date);
  const isWorking = !isWeekend && !holidayName;

  return {
    dateKey: formatDateKey(date),
    dayOfWeek,
    isWeekend,
    weekendName,
    isHoliday: !!holidayName,
    holidayName,
    isWorkingDay: isWorking
  };
};
