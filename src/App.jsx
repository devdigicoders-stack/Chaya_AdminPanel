import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Step 01: Leads Ingestion & Management
import Leads from './pages/Leads';
import AddNewLead from './pages/AddNewLead';
import ImportLeads from './pages/ImportLeads';
import LeadSources from './pages/LeadSources';

// Step 02 & Step 12: Staff Head Desk
import LeadAssignment from './pages/staff-head/LeadAssignment';
import StaffHeadHandling from './pages/staff-head/StaffHeadHandling';
import TransferInboxPage from './pages/transfers/TransferInboxPage';

// Steps 03-05 & Steps 13-14: Calling & Screening
import CallingQueue from './pages/calling/CallingQueue';
import VisaLocationConfirmation from './pages/calling/VisaLocationConfirmation';

// Steps 07-09 & Image 2 Step 6: Interview Management
import InitialInterview from './pages/interview/InitialInterview';
import FinalInterview from './pages/interview/FinalInterview';

// Step 10: Medical Management
import AllMedicals from './pages/medical/AllMedicals';
import ScheduleMedical from './pages/medical/ScheduleMedical';

// Step 11, Image 2 Step 7 & Step 18: Bill Book & Accounts
import AllInvoices from './pages/billing/AllInvoices';
import AdvanceCollection from './pages/billing/AdvanceCollection';
import FinalPayments from './pages/billing/FinalPayments';

// Step 15 & Delay Loop: Pre-Viva Management
import SchedulePreViva from './pages/pre-viva/SchedulePreViva';
import AllPreVivas from './pages/pre-viva/AllPreVivas';
import VisaDelayConfirmations from './pages/pre-viva/VisaDelayConfirmations';

// Step 16: Visa Management
import ApplyVisa from './pages/visa/ApplyVisa';
import AllVisas from './pages/visa/AllVisas';
import DocumentVerification from './pages/visa/DocumentVerification';
import VisaTracking from './pages/visa/VisaTracking';
import AppointmentBooking from './pages/visa/AppointmentBooking';

// Step 17 & Step 19: Viva & Final Placement
import ScheduleViva from './pages/placement/ScheduleViva';
import VivaResults from './pages/placement/VivaResults';
import OfferLetter from './pages/placement/OfferLetter';
import JoiningUpdate from './pages/placement/JoiningUpdate';
import PlacementManagement from './pages/placement/PlacementManagement';
import CompanyManagement from './pages/placement/CompanyManagement';

// Rejection & Registry
import AllCandidatesPage from './pages/candidates/AllCandidatesPage';
import CancelledCandidates from './pages/candidates/CancelledCandidates';
import BlacklistedCandidates from './pages/candidates/BlacklistedCandidates';
import CandidateRegistrationForm from './pages/candidates/CandidateRegistrationForm';

// Reports & Analytics
import ReportsOverview from './pages/reports/ReportsOverview';
import CandidateReports from './pages/reports/CandidateReports';
import VisaReports from './pages/reports/VisaReports';
import PlacementReportsPage from './pages/reports/PlacementReportsPage';
import FinancialReports from './pages/reports/FinancialReports';
import CustomReports from './pages/reports/CustomReports';

// User & Role Management
import UserManagement from './pages/users/UserManagement';
import RolesPermissions from './pages/users/RolesPermissions';
import DepartmentManagement from './pages/users/DepartmentManagement';
import ActivityLog from './pages/users/ActivityLog';
import LoginHistory from './pages/users/LoginHistory';

// Settings Page
import Settings from './pages/settings/Settings';

// Profile Page
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes using Layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
          
          {/* Step 01: Leads Ingestion & Management */}
          <Route path="leads" element={<Leads />} />
          <Route path="leads/add" element={<AddNewLead />} />
          <Route path="leads/import" element={<ImportLeads />} />
          <Route path="leads/sources" element={<LeadSources />} />

          {/* Step 02 & Step 12: Staff Head Desk */}
          <Route path="staff-head/assign" element={<LeadAssignment />} />
          <Route path="staff-head/handling" element={<StaffHeadHandling />} />
          <Route path="transfers" element={<TransferInboxPage />} />

          {/* Steps 03-05 & Steps 13-14: Calling & Screening */}
          <Route path="calling/queue" element={<CallingQueue />} />
          <Route path="calling/location-confirm" element={<VisaLocationConfirmation />} />

          {/* Steps 07-09 & Final Interview: Interview Management */}
          <Route path="interview/initial" element={<InitialInterview />} />
          <Route path="interview/final" element={<FinalInterview />} />

          {/* Step 10: Medical Management */}
          <Route path="medical/all" element={<AllMedicals />} />
          <Route path="medical/schedule" element={<ScheduleMedical />} />

          {/* Step 11 & Step 18: Bill Book & Accounts */}
          <Route path="billing/all" element={<AllInvoices />} />
          <Route path="billing/advance" element={<AdvanceCollection />} />
          <Route path="billing/final" element={<FinalPayments />} />

          {/* Step 15: Pre-Viva Management */}
          <Route path="pre-viva/schedule" element={<SchedulePreViva />} />
          <Route path="pre-viva/all" element={<AllPreVivas />} />
          <Route path="pre-viva/delay-confirmations" element={<VisaDelayConfirmations />} />

          {/* Step 16: Visa Management */}
          <Route path="visa/apply" element={<ApplyVisa />} />
          <Route path="visa/all" element={<AllVisas />} />
          <Route path="visa/verification" element={<DocumentVerification />} />
          <Route path="visa/tracking" element={<VisaTracking />} />
          <Route path="visa/booking" element={<AppointmentBooking />} />

          {/* Step 17 & Step 19: Viva & Final Placement */}
          <Route path="placement/schedule" element={<ScheduleViva />} />
          <Route path="viva/schedule" element={<ScheduleViva />} />
          <Route path="placement/results" element={<VivaResults />} />
          <Route path="viva/results" element={<VivaResults />} />
          <Route path="placement/offer" element={<OfferLetter />} />
          <Route path="placement/joining" element={<JoiningUpdate />} />
          <Route path="placement/management" element={<PlacementManagement />} />
          <Route path="placement/companies" element={<CompanyManagement />} />

          {/* Candidates & Registry */}
          <Route path="candidates/all" element={<AllCandidatesPage />} />
          <Route path="candidates/add" element={<CandidateRegistrationForm />} />
          <Route path="candidates/registration" element={<CandidateRegistrationForm />} />
          <Route path="candidates/cancelled" element={<CancelledCandidates />} />
          <Route path="candidates/blacklisted" element={<BlacklistedCandidates />} />
          <Route path="candidates/unfit" element={<BlacklistedCandidates />} />

          {/* Activity & Audit Logs */}
          <Route path="audit-logs" element={<ActivityLog />} />
          <Route path="audit-logs/candidates" element={<ActivityLog />} />
          <Route path="audit-logs/staff" element={<ActivityLog />} />

          {/* Reports & Analytics */}
          <Route path="reports" element={<ReportsOverview />} />
          <Route path="reports/overview" element={<ReportsOverview />} />
          <Route path="reports/candidates" element={<CandidateReports />} />
          <Route path="reports/visa" element={<VisaReports />} />
          <Route path="reports/placement" element={<PlacementReportsPage />} />
          <Route path="reports/financial" element={<FinancialReports />} />
          <Route path="reports/custom" element={<CustomReports />} />

          {/* User & Role Management */}
          <Route path="users" element={<UserManagement />} />
          <Route path="users/all" element={<UserManagement />} />
          <Route path="users/roles" element={<RolesPermissions />} />
          <Route path="users/departments" element={<DepartmentManagement />} />
          <Route path="users/activity" element={<ActivityLog />} />
          <Route path="users/history" element={<LoginHistory />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />

          {/* Profile */}
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
