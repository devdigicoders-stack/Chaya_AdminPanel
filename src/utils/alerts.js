import Swal from 'sweetalert2';

/**
 * Enterprise SweetAlert2 Logout Confirmation Modal
 */
export const confirmLogoutAlert = async () => {
  const result = await Swal.fire({
    title: 'Sign Out Session?',
    text: 'Are you sure you want to log out of the Admin Control Panel?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Sign Out',
    cancelButtonText: 'Stay Logged In',
    confirmButtonColor: '#DC2626', // Red-600
    cancelButtonColor: '#4B5563',  // Gray-600
    reverseButtons: true,
    focusCancel: true,
    background: '#FFFFFF',
    color: '#111827',
    iconColor: '#DC2626',
    customClass: {
      popup: 'rounded-[24px] p-6 shadow-2xl border border-gray-100 font-sans',
      title: 'text-[20px] font-bold text-gray-900 tracking-tight mb-1',
      htmlContainer: 'text-[13.5px] text-gray-600 leading-relaxed',
      confirmButton: 'px-6 py-2.5 rounded-[12px] text-[13.5px] font-bold shadow-md cursor-pointer transition-transform hover:scale-[1.02]',
      cancelButton: 'px-6 py-2.5 rounded-[12px] text-[13.5px] font-medium cursor-pointer transition-transform hover:scale-[1.02]',
      actions: 'gap-3 mt-4'
    }
  });

  return result.isConfirmed;
};

/**
 * Toast Notification Helper
 */
export const showToast = (message, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon,
    title: message
  });
};

/**
 * Success Alert Modal
 */
export const showSuccessAlert = (message, title = 'Success') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonColor: '#2563eb',
    timer: 2500
  });
};

/**
 * Error Alert Modal
 */
export const showErrorAlert = (message, title = 'Error') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#dc2626'
  });
};

export default {
  confirmLogoutAlert,
  showToast,
  showSuccessAlert,
  showErrorAlert
};
