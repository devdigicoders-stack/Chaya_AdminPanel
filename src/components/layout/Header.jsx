import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Calendar, Bell, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { getCurrentUser, getFullAvatarUrl, clearAuth } from '../../utils/api';
import { confirmLogoutAlert, showToast } from '../../utils/alerts';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = getCurrentUser() || { name: 'Administrator', role: 'ADMIN', email: 'admin@gmail.com' };
  const initials = (user.name || 'Admin')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const avatarUrl = user.avatar ? getFullAvatarUrl(user.avatar) : '';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Logout via SweetAlert2
  const handleLogout = async () => {
    setDropdownOpen(false);
    const confirmed = await confirmLogoutAlert();
    if (confirmed) {
      clearAuth();
      showToast('Logged out successfully');
      navigate('/login');
    }
  };

  return (
    <header className="h-[64px] sm:h-[72px] bg-white flex items-center justify-between px-3 sm:px-6 border-b border-gray-100 shrink-0 z-20 shadow-xs relative">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hamburger Toggle (Mobile/Tablet) */}
        <button 
          onClick={onToggleSidebar}
          className="text-gray-600 hover:text-gray-900 p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0 lg:hidden"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Date — Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex items-center gap-2 text-gray-600 text-[12.5px] font-medium bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })}</span>
        </div>

        {/* Notification Bell */}
        <button 
          className="relative text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
            5
          </span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-gray-100 hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0B1B3D] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs shrink-0 overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition-all">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[13px] font-bold text-gray-900 leading-none truncate max-w-[130px]">{user.name}</span>
              <span className="text-[10px] font-medium text-gray-500 mt-0.5">{user.role || 'Super Admin'}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-[13px] font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user.email || 'admin@gmail.com'}</p>
                <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700">
                  <Shield className="w-3 h-3" />
                  <span>{user.role || 'ADMIN'}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Admin Profile & Security</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
