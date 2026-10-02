import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, PhoneCall, UserCheck, HeartPulse, 
  FileText, ClipboardCheck, Plane, GraduationCap, User, 
  BarChart3, LogOut, ChevronDown, ChevronRight,
  Sparkles, X, Settings, ShieldCheck, History, ArrowLeftRight, Inbox } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, getFullAvatarUrl, clearAuth } from '../../utils/api';
import { confirmLogoutAlert, showToast } from '../../utils/alerts';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentUser = getCurrentUser() || { name: 'Admin Desk', role: 'Super Administrator' };
  const userInitials = (currentUser.name || 'AD')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const avatarUrl = currentUser.avatar ? getFullAvatarUrl(currentUser.avatar) : '';
  
  // State to track expanded menus
  const [expandedMenus, setExpandedMenus] = useState({});

  // Auto-close drawer on location change on mobile
  useEffect(() => {
    if (onClose) onClose();
  }, [currentPath]);

  useEffect(() => {
    // Auto-expand menu if current path matches
    if (currentPath.startsWith('/leads')) {
      setExpandedMenus(prev => ({ ...prev, '01. Leads Management': true }));
    }
    if (currentPath.startsWith('/staff-head')) {
      setExpandedMenus(prev => ({ ...prev, '02. Staff Head Desk': true }));
    }
    if (currentPath.startsWith('/calling')) {
      setExpandedMenus(prev => ({ ...prev, '03. Calling & Screening': true }));
    }
    if (currentPath.startsWith('/interview')) {
      setExpandedMenus(prev => ({ ...prev, '04. Interview Panel': true }));
    }
    if (currentPath.startsWith('/medical')) {
      setExpandedMenus(prev => ({ ...prev, '05. Medical & GAMCA Desk': true }));
    }
    if (currentPath.startsWith('/billing')) {
      setExpandedMenus(prev => ({ ...prev, '06. Bill Book & Accounts': true }));
    }
    if (currentPath.startsWith('/pre-viva')) {
      setExpandedMenus(prev => ({ ...prev, '07. Pre-Viva Management': true }));
    }
    if (currentPath.startsWith('/visa')) {
      setExpandedMenus(prev => ({ ...prev, '08. Visa Processing': true }));
    }
    if (currentPath.startsWith('/placement') || currentPath.startsWith('/viva')) {
      setExpandedMenus(prev => ({ ...prev, '09. Viva & Placement': true }));
    }
    if (currentPath.startsWith('/candidates')) {
      setExpandedMenus(prev => ({ ...prev, '10. Candidates & Registry': true }));
    }
    if (currentPath.startsWith('/reports')) {
      setExpandedMenus(prev => ({ ...prev, '11. Reports & Analytics': true }));
    }
    if (currentPath.startsWith('/users')) {
      setExpandedMenus(prev => ({ ...prev, '12. Users & Staff': true }));
    }
    if (currentPath.startsWith('/audit-logs')) {
      setExpandedMenus(prev => ({ ...prev, '13. History & Audit Logs': true }));
    }
  }, [currentPath]);

  const toggleMenu = (name, e) => {
    e.preventDefault();
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'File Transfer Desk (Inbox/Outbox)', icon: ArrowLeftRight, path: '/transfers' },
    { 
      name: '01. Leads Management', 
      icon: Users, 
      path: '/leads',
      subItems: [
        { name: 'All Leads Pool', path: '/leads' },
        { name: 'Add New Lead', path: '/leads/add' },
        { name: 'Upload Excel / CSV', path: '/leads/import' },
        { name: 'Lead Sources (WhatsApp/FB)', path: '/leads/sources' },
      ]
    },
    { 
      name: '02. Staff Head Desk', 
      icon: Sparkles, 
      path: '/staff-head/assign',
      subItems: [
        { name: 'Distribute Leads to Staff', path: '/staff-head/assign' },
        { name: 'Change Calling Staff', path: '/staff-head/handling' },
        { name: 'Transfer Handover Desk', path: '/transfers' },
      ]
    },
    { 
      name: '03. Calling & Screening', 
      icon: PhoneCall, 
      path: '/calling/queue',
      subItems: [
        { name: 'Calling List & Passport Check', path: '/calling/queue' },
        { name: 'Interested Country', path: '/calling/location-confirm' },
      ]
    },
    { 
      name: '04. Interview Panel', 
      icon: UserCheck, 
      path: '/interview/initial',
      subItems: [
        { name: 'Interview List (Pass / Fail)', path: '/interview/initial' },
        { name: 'Final Confirmations', path: '/interview/final' },
      ]
    },
    { 
      name: '05. Medical & GAMCA Desk', 
      icon: HeartPulse, 
      path: '/medical/all',
      subItems: [
        { name: 'Medical List (Fit / Unfit)', path: '/medical/all' },
        { name: 'Schedule Medical Center', path: '/medical/schedule' },
      ]
    },
    { 
      name: '06. Bill Book & Accounts', 
      icon: FileText, 
      path: '/billing/all',
      subItems: [
        { name: 'All Bills & Invoices', path: '/billing/all' },
        { name: 'Advance Payment Collection', path: '/billing/advance' },
        { name: 'Final Payment Collection', path: '/billing/final' },
        { name: 'Refund & Settlement Desk', path: '/billing/refunds' },
      ]
    },
    { 
      name: '07. Pre-Viva Management', 
      icon: ClipboardCheck, 
      path: '/pre-viva/schedule',
      subItems: [
        { name: 'Check Files & Send to Visa', path: '/pre-viva/schedule' },
        { name: 'All Pre-Viva Files', path: '/pre-viva/all' },
        { name: 'Visa Date Change Requests', path: '/pre-viva/delay-confirmations' },
      ]
    },
    { 
      name: '08. Visa Processing', 
      icon: Plane, 
      path: '/visa/apply',
      subItems: [
        { name: 'Apply for Visa', path: '/visa/apply' },
        { name: 'All Visas & Status', path: '/visa/all' },
        { name: 'Check Documents', path: '/visa/verification' },
        { name: 'Visa Tracking', path: '/visa/tracking' },
      ]
    },
    { 
      name: '09. Viva & Placement', 
      icon: GraduationCap, 
      path: '/placement/schedule',
      subItems: [
        { name: 'Schedule Viva Date', path: '/placement/schedule' },
        { name: 'Viva Results & Scorecards', path: '/placement/results' },
        { name: 'Offer Letters & Company', path: '/placement/offer' },
        { name: 'Flight & Joining Deployment', path: '/placement/joining' },
      ]
    },
    { 
      name: '10. Candidates & Registry', 
      icon: User, 
      path: '/candidates/all',
      subItems: [
        { name: 'All Registered Candidates', path: '/candidates/all' },
        { name: 'Register Candidate (Official Form)', path: '/candidates/add' },
        { name: 'Cancelled Candidates', path: '/candidates/cancelled' },
        { name: 'Unfit & Rejected Closures', path: '/candidates/blacklisted' },
      ]
    },
    { 
      name: '11. Reports & Analytics', 
      icon: BarChart3, 
      path: '/reports',
      subItems: [
        { name: 'Overall Summary', path: '/reports' },
        { name: 'Candidate Reports', path: '/reports/candidates' },
        { name: 'Visa Reports', path: '/reports/visa' },
        { name: 'Placement Reports', path: '/reports/placement' },
        { name: 'Fee & Payment Reports', path: '/reports/financial' },
        { name: 'Custom Reports', path: '/reports/custom' },
      ]
    },
    { 
      name: '12. Users & Staff', 
      icon: ShieldCheck, 
      path: '/users',
      subItems: [
        { name: 'All Staff Members', path: '/users' },
        { name: 'Staff Roles & Permissions', path: '/users/roles' },
        { name: 'Department List', path: '/users/departments' },
      ]
    },
    { 
      name: '13. History & Audit Logs', 
      icon: History, 
      path: '/audit-logs',
      subItems: [
        { name: 'Global Activity & Audit Trail', path: '/audit-logs' },
        { name: 'Staff Login History', path: '/users/history' },
      ]
    },
  ];

  return (
    <>
      {/* Backdrop Overlay for Mobile / Tablet */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 cursor-pointer"
          aria-hidden="true"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] h-full bg-[#0B1B3D] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-full shrink-0 select-none ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        {/* Logo Area */}
        <div className="h-[64px] sm:h-[72px] flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0">
          <img src="/logo.png" alt="RecruitCRM Logo" className="h-9 sm:h-10 w-auto" />
          {/* Mobile Drawer Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden cursor-pointer transition-colors"
            aria-label="Close sidebar drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExactActive = currentPath === item.path;
              const isSubItemActive = hasSubItems && item.subItems.some(sub => currentPath === sub.path);
              const isParentActive = isExactActive || isSubItemActive;
              const isExpanded = expandedMenus[item.name];
              const Icon = item.icon;
              
              return (
                <div key={item.name}>
                  <Link
                    to={item.path}
                    onClick={(e) => {
                      if (hasSubItems) {
                        toggleMenu(item.name, e);
                      } else if (onClose) {
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      isParentActive 
                        ? 'bg-[#0066FF] text-white shadow-md' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={isParentActive ? 2 : 1.5} />
                      <span className="text-[13.5px] font-medium tracking-wide">{item.name}</span>
                    </div>
                    {hasSubItems && (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </Link>

                  {/* Sub Items */}
                  {hasSubItems && isExpanded && (
                    <div className="mt-1 mb-2 pl-4 space-y-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = currentPath === subItem.path;
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.path}
                            onClick={() => { if (onClose) onClose(); }}
                            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                              isSubActive
                                ? 'bg-[#1D4ED8] text-white'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                          >
                            {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                            {!isSubActive && <div className="w-1 h-1 rounded-full bg-gray-500 shrink-0" />}
                            <span className="truncate">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Profile + Logout */}
        <div className="p-4 mt-auto border-t border-white/5 space-y-1">
          {/* Admin Profile Row */}
          <Link
            to="/profile"
            onClick={() => { if (onClose) onClose(); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              currentPath === '/profile'
                ? 'bg-[#1D4ED8] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{currentUser.role || 'Super Admin'}</div>
            </div>
            <User className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </Link>

          <button
            onClick={async () => {
              const confirmed = await confirmLogoutAlert();
              if (confirmed) {
                clearAuth();
                if (onClose) onClose();
                showToast('Logged out successfully');
                navigate('/login');
              }
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-400 hover:bg-white/5 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            <span className="text-[14px] font-medium tracking-wide">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
