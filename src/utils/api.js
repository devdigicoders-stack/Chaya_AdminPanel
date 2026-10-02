// Read API configuration dynamically from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

export const getAuthToken = () => {
  return localStorage.getItem('recruitcrm_admin_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('recruitcrm_admin_token', token);
  } else {
    localStorage.removeItem('recruitcrm_admin_token');
  }
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('recruitcrm_admin_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('recruitcrm_admin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('recruitcrm_admin_user');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('recruitcrm_admin_token');
  localStorage.removeItem('recruitcrm_admin_user');
};

// Handle unauthorized responses
const handleAuthError = (status) => {
  if (status === 401) {
    clearAuth();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
};

// 1. Admin / User Login
export const apiLogin = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  if (data.data?.token) {
    setAuthToken(data.data.token);
    setCurrentUser(data.data);
  }

  return data;
};

// 2. Register Staff / User (Admin Only, supports FormData or JSON)
export const apiRegisterUser = async (formDataOrObj) => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && formDataOrObj instanceof FormData;
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'User registration failed');
  }

  return data;
};

export const apiRegisterAdmin = apiRegisterUser;

// 3. Get Logged-in Profile
export const apiGetProfile = async () => {
  const token = getAuthToken();
  if (!token) {
    handleAuthError(401);
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    handleAuthError(401);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch profile');
  }

  if (data.data) {
    setCurrentUser({ ...getCurrentUser(), ...data.data });
  }

  return data.data;
};

// 4. Update Profile (Name, Phone, Department, Avatar)
export const apiUpdateProfile = async (formData) => {
  const token = getAuthToken();
  if (!token) {
    handleAuthError(401);
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData // multipart/form-data
  });

  if (response.status === 401) {
    handleAuthError(401);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }

  if (data.data) {
    const existing = getCurrentUser() || {};
    setCurrentUser({ ...existing, ...data.data });
  }

  return data.data;
};

// 5. Change Password
export const apiChangePassword = async (currentPassword, newPassword) => {
  const token = getAuthToken();
  if (!token) {
    handleAuthError(401);
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (response.status === 401) {
    handleAuthError(401);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to change password');
  }

  return data;
};

// Get Full Avatar Image URL
export const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  return `${BACKEND_URL}${avatarPath}`;
};

// ==========================================
// LEAD MANAGEMENT API SERVICES
// ==========================================

// Helper for authenticated fetch
const authFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    handleAuthError(401);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// 1. Get all leads with query parameters
export const apiGetLeads = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
      query.append(key, val);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return authFetch(`/leads${queryString}`);
};

// 2. Get single lead by ID with full history audit trail
export const apiGetLeadById = async (id) => {
  return authFetch(`/leads/${id}`);
};

// 3. Create a single lead or multiple leads
export const apiCreateLead = async (leadData) => {
  return authFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(leadData)
  });
};

// 4. Bulk import leads (Excel/WhatsApp/FB) with duplicate validation
export const apiBulkImportLeads = async (leads, source = 'EXCEL', skipDuplicates = true) => {
  return authFetch('/leads/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ leads, source, skipDuplicates })
  });
};

// 5. Update lead details and application form
export const apiUpdateLead = async (id, updateData) => {
  return authFetch(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
};

// 6. Delete a lead (Admin only)
export const apiDeleteLead = async (id) => {
  return authFetch(`/leads/${id}`, {
    method: 'DELETE'
  });
};

// 7. Toggle lead hold status
export const apiToggleLeadHold = async (id, isHold, reason = '') => {
  return authFetch(`/leads/${id}/hold`, {
    method: 'PUT',
    body: JSON.stringify({ isHold, reason })
  });
};

// 8. Categorize lead (Passport Holder / Non-Passport / Not Confirmed)
export const apiCategorizeLead = async (id, { isPassportHolder, phone, passportNumber }) => {
  return authFetch(`/leads/${id}/categorize`, {
    method: 'PUT',
    body: JSON.stringify({ isPassportHolder, phone, passportNumber })
  });
};

// 8b. Update Location Confirmation (Max 4 attempts rule, Step 13)
export const apiUpdateLocationConfirmation = async (id, locationData) => {
  return authFetch(`/leads/${id}/location-confirmation`, {
    method: 'PUT',
    body: JSON.stringify(locationData)
  });
};

// 8c. Submit Interview Result (Pass / Fail / Confirmed, FRD Section 10)
export const apiSubmitInterviewResult = async (id, resultData) => {
  return authFetch(`/leads/${id}/interview-result`, {
    method: 'PUT',
    body: JSON.stringify(resultData)
  });
};

// 9. Transfer lead to next stage with checklist
export const apiTransferLeadStage = async (id, transferData) => {
  return authFetch(`/leads/${id}/transfer`, {
    method: 'PUT',
    body: JSON.stringify(transferData)
  });
};

// 10. Assign leads to calling staff (selective with reassignment support)
export const apiAssignLeads = async (leadIds, callingStaffId, confirmReassign = false) => {
  return authFetch('/leads/assign-staff', {
    method: 'POST',
    body: JSON.stringify({ leadIds, callingStaffId, confirmReassign })
  });
};

// 11. Equal / Round-Robin Lead Distribution across Calling Staff (FRD Section 6)
export const apiDistributeRoundRobin = async (leadIds, callingStaffIds) => {
  return authFetch('/leads/distribute-round-robin', {
    method: 'POST',
    body: JSON.stringify({ leadIds, callingStaffIds })
  });
};

export const apiReassignCallingStaff = async (id, { newCallingStaffId, reason, newStage }) => {
  return authFetch(`/leads/${id}/reassign-staff`, {
    method: 'PUT',
    body: JSON.stringify({ newCallingStaffId, reason, newStage })
  });
};

// 12b. Bulk Swap / Reassign Calling Staff (FRD Section 12)
export const apiBulkReassignCallingStaff = async ({ leadIds, newCallingStaffId, reason }) => {
  return authFetch('/leads/bulk-reassign-staff', {
    method: 'POST',
    body: JSON.stringify({ leadIds, newCallingStaffId, reason })
  });
};

// 13. Get Admin Dashboard Summary metrics
export const apiGetDashboardSummary = async () => {
  return authFetch('/leads/admin/dashboard-summary');
};

// 14. Get system users (Calling Staff, Staff Heads, etc.)
export const apiGetUsers = async () => {
  return authFetch('/auth/users');
};
export const apiGetStaffMembers = apiGetUsers;

// 14b. Update user details (Admin only)
export const apiUpdateUser = async (id, formDataOrObj) => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && formDataOrObj instanceof FormData;
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
    method: 'PUT',
    headers,
    body: isFormData ? formDataOrObj : JSON.stringify(formDataOrObj)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'User update failed');
  }
  return data;
};

// 14c. Toggle user active/inactive status (Admin only)
export const apiToggleUserStatus = async (id) => {
  return authFetch(`/auth/users/${id}/toggle-status`, {
    method: 'PUT'
  });
};

// 14d. Delete user (Admin only)
export const apiDeleteUser = async (id) => {
  return authFetch(`/auth/users/${id}`, {
    method: 'DELETE'
  });
};

// 14e. Get calling staff team under a Staff Head
export const apiGetTeamStaff = async (staffHeadId) => {
  return authFetch(`/auth/team/${staffHeadId}`);
};


// 15. Schedule Medical Appointment (FRD Section 11)
export const apiScheduleMedical = async (id, scheduleData) => {
  return authFetch(`/leads/${id}/medical-schedule`, {
    method: 'PUT',
    body: JSON.stringify(scheduleData)
  });
};

// 16. Submit Medical Result (FIT / UNFIT, FRD Section 11 & 12)
export const apiSubmitMedicalResult = async (id, resultData) => {
  return authFetch(`/leads/${id}/medical-result`, {
    method: 'PUT',
    body: JSON.stringify(resultData)
  });
};

// 17. Record Payment Booking (Service Fee & Medical Fee, FRD Section 11 & 21)
export const apiRecordPaymentBooking = async (id, paymentData) => {
  return authFetch(`/leads/${id}/payment-booking`, {
    method: 'PUT',
    body: JSON.stringify(paymentData)
  });
};

// 17b. Record Final Payment / Settle Balance (FRD Section 17 & 23)
export const apiRecordFinalPayment = async (id, finalPaymentData) => {
  return authFetch(`/leads/${id}/final-payment`, {
    method: 'PUT',
    body: JSON.stringify(finalPaymentData)
  });
};

// 18. Get Lead Audit History
export const apiGetLeadHistory = async (leadId) => {
  return authFetch(`/history/lead/${leadId}`);
};

// 18b. Get Specific User Activity & Audit History
export const apiGetUserHistory = async (userId) => {
  return authFetch(`/history/user/${userId}`);
};

// 19. Verify Pre-Viva Candidate Documents (Passport, Trade Certification, Medical, PCC)
export const apiVerifyPreVivaDocs = async (id, data = {}) => {
  return authFetch(`/leads/${id}/pre-viva-verify`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// 20. Assign Visa Manager & Set Viva Examination Date (FRD Step 15)
export const apiAssignPreVivaVisa = async (id, assignData) => {
  return authFetch(`/leads/${id}/pre-viva-assign`, {
    method: 'PUT',
    body: JSON.stringify(assignData)
  });
};

// 21. Submit Pre-Viva Candidate Evaluation (Score 0-100 & Clearance)
export const apiEvaluatePreViva = async (id, evalData) => {
  return authFetch(`/leads/${id}/pre-viva-evaluate`, {
    method: 'PUT',
    body: JSON.stringify(evalData)
  });
};

// 22. Confirm Visa Delay / Date Change Request (Confirm Ready or Cancel)
export const apiConfirmVisaDelay = async (id, delayData) => {
  return authFetch(`/leads/${id}/pre-viva-delay`, {
    method: 'PUT',
    body: JSON.stringify(delayData)
  });
};

// 23. Submit / Lodge Visa Application (FRD Step 16)
export const apiApplyVisa = async (id, applyData) => {
  return authFetch(`/leads/${id}/visa-apply`, {
    method: 'PUT',
    body: JSON.stringify(applyData)
  });
};

// 24. Update Visa Stamping Status (Approved, Delayed, Rejected, Processing)
export const apiUpdateVisaStatus = async (id, statusData) => {
  return authFetch(`/leads/${id}/visa-status`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  });
};

// 25. Verify Candidate Visa Dossier Documents
export const apiVerifyVisaDocuments = async (id, docsData) => {
  return authFetch(`/leads/${id}/visa-documents`, {
    method: 'PUT',
    body: JSON.stringify(docsData)
  });
};

// 26. Update Visa Consular Tracking Stage & Milestones (Stages 1 - 5)
export const apiUpdateVisaTracking = async (id, trackingData) => {
  return authFetch(`/leads/${id}/visa-tracking`, {
    method: 'PUT',
    body: JSON.stringify(trackingData)
  });
};

// 27. Schedule Foreign Client Final Viva / Interview (FRD Step 17)
export const apiSchedulePlacementViva = async (id, vivaData) => {
  return authFetch(`/leads/${id}/placement-viva-schedule`, {
    method: 'PUT',
    body: JSON.stringify(vivaData)
  });
};

// 28. Submit Viva Result & Scorecard (Selected, On Hold, Not Selected)
export const apiSubmitPlacementVivaResult = async (id, resultData) => {
  return authFetch(`/leads/${id}/placement-viva-result`, {
    method: 'PUT',
    body: JSON.stringify(resultData)
  });
};

// 29. Issue / Update Foreign Offer Letter (FRD Step 18)
export const apiIssuePlacementOfferLetter = async (id, offerData) => {
  return authFetch(`/leads/${id}/placement-offer-letter`, {
    method: 'PUT',
    body: JSON.stringify(offerData)
  });
};

// 30. Update Flight Booking & Deployment / Joining (FRD Step 19 / 20)
export const apiUpdatePlacementDeployment = async (id, deployData) => {
  return authFetch(`/leads/${id}/placement-deployment`, {
    method: 'PUT',
    body: JSON.stringify(deployData)
  });
};

// 31. Admin Direct Lead Override (Stage, Status, Assignment, Reason)
export const apiAdminLeadOverride = async (id, overrideData) => {
  return authFetch(`/leads/${id}/admin-override`, {
    method: 'PUT',
    body: JSON.stringify(overrideData)
  });
};

// 32. Global Immutable Activity & Audit Trail (FRD Section 19)
export const apiGetAuditLogs = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.actionType && params.actionType !== 'ALL') query.append('actionType', params.actionType);
  if (params.role && params.role !== 'ALL') query.append('role', params.role);
  if (params.limit) query.append('limit', params.limit);
  if (params.page) query.append('page', params.page);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return authFetch(`/history${queryString}`);
};


// 34. Staff Login & Session Audit Ledger
export const apiGetLoginHistory = async () => {
  return authFetch('/auth/login-history');
};

// 35. Terminate Active Staff Session
export const apiTerminateSession = async (id) => {
  return authFetch(`/auth/login-history/${id}/terminate`, {
    method: 'PUT'
  });
};

// 36. Bulk Terminate Inactive/Stale Sessions
export const apiTerminateStaleSessions = async () => {
  return authFetch('/auth/login-history/terminate-stale', {
    method: 'POST'
  });
};

// 37. Two-Party File Transfer Protocol (FRD Section 1 & 7)
export const apiRequestTransfer = async (id, transferData) => {
  return authFetch(`/leads/${id}/request-transfer`, {
    method: 'POST',
    body: JSON.stringify(transferData)
  });
};

export const apiAcceptTransfer = async (id) => {
  return authFetch(`/leads/${id}/accept-transfer`, {
    method: 'POST'
  });
};

export const apiReturnTransfer = async (id, reason) => {
  return authFetch(`/leads/${id}/return-transfer`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};

export const apiGetTransferInbox = async () => {
  return authFetch('/leads/transfers/inbox');
};

export const apiGetTransferOutbox = async () => {
  return authFetch('/leads/transfers/outbox');
};

// 38. Step 8 Company Confirmation & Proposal/Agreement (FRD Section 4, Step 8)
export const apiUpdateCompanyConfirmation = async (id, companyData) => {
  return authFetch(`/leads/${id}/company-confirmation`, {
    method: 'PUT',
    body: JSON.stringify(companyData)
  });
};

// 39. Bill Book & Financial Ledger (FRD Section 9)
export const apiAddBillBookTransaction = async (id, txData) => {
  return authFetch(`/leads/${id}/billbook/transaction`, {
    method: 'POST',
    body: JSON.stringify(txData)
  });
};

export const apiVerifyBillBookTransaction = async (id, receiptNo) => {
  return authFetch(`/leads/${id}/billbook/transaction/${receiptNo}/verify`, {
    method: 'PUT'
  });
};

export const apiAddBillBookCharge = async (id, chargeData) => {
  return authFetch(`/leads/${id}/billbook/charge`, {
    method: 'POST',
    body: JSON.stringify(chargeData)
  });
};

// 40. 8 Mandatory Confirmations & Audio/Video Recordings (FRD Section 8)
export const apiSaveConfirmation = async (id, confData) => {
  return authFetch(`/leads/${id}/confirmations`, {
    method: 'POST',
    body: JSON.stringify(confData)
  });
};

// 40b. Upload confirmation document/recording file
export const apiUploadLeadMedia = async (leadId, file, docTitle = '', category = 'Confirmation') => {
  const formData = new FormData();
  formData.append('document', file);
  if (docTitle) formData.append('docTitle', docTitle);
  if (category) formData.append('category', category);

  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/upload-document`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'File upload failed');
  }
  return data;
};

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 41. File Closure & Refund Settlement (FRD Section 5)
export const apiCloseLeadFile = async (id, closeData) => {
  return authFetch(`/leads/${id}/close-file`, {
    method: 'PUT',
    body: JSON.stringify(closeData)
  });
};


