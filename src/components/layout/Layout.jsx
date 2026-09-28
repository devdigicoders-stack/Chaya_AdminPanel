import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);

  // Force reset any window scrolling and main content scroll on mount / route change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 flex w-full h-full overflow-hidden bg-[#F8FAFC]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <main 
          ref={mainRef}
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6 flex flex-col min-w-0 w-full overflow-x-hidden"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
