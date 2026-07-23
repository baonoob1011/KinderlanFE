import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../ui/button';
import {
  LayoutDashboard, Warehouse, DollarSign, LogOut,
  ArrowLeftRight, ClipboardList, MessageSquare, AlertTriangle,
  Menu, X, Home, ChevronDown, ChevronRight, ShoppingBag
} from 'lucide-react';

export default function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logoutAdmin } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Danh mục & Kho hàng': true,
    'Nhập hàng & Vận chuyển': true,
    'Đơn hàng': true,
    'Xử lý hoàn trả': true,
    'Đánh giá & Tài chính': true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  // Sidebar navigation items — matches Manager use case diagram
  const sidebarSections = [
    {
      section: 'Kho hàng',
      items: [
        { title: 'Kiểm tra tồn kho', icon: Warehouse, path: '/manager/inventory' },
      ]
    },
    {
      section: 'Nhập hàng & Vận chuyển',
      items: [
        // { title: 'Nhập hàng từ kho chính', icon: Package, path: '/manager/import-orders' },
        { title: 'Quản lý chuyển kho', icon: ClipboardList, path: '/manager/import-management' },
        { title: 'Báo cáo hàng lỗi', icon: AlertTriangle, path: '/manager/defective-report' },
        { title: 'Kiểm kê thực tế', icon: ClipboardList, path: '/manager/physical-count' },
      ]
    },
    {
      section: 'Đơn hàng',
      items: [
        { title: 'Quản lý đơn hàng', icon: ShoppingBag, path: '/manager/orders' },
      ]
    },
    {
      section: 'Xử lý hoàn trả',
      items: [
        { title: 'Xử lý hoàn trả', icon: ArrowLeftRight, path: '/manager/returns' },
      ]
    },
    {
      section: 'Đánh giá & Tài chính',
      items: [
        { title: 'Quản lý đánh giá', icon: MessageSquare, path: '/manager/reviews' },
        { title: 'Quản lý tài chính', icon: DollarSign, path: '/manager/financial' },
      ]
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header Bar */}
      <header className="bg-[#AF140B] text-white sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Manager Dashboard</h1>
              <p className="text-[11px] text-white/80 leading-tight">
                {adminUser?.storeName || 'Tất cả chi nhánh'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 border border-white/30 h-8 text-sm px-3"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Về trang chủ
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 border border-white/30 h-8 text-sm px-3"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-[#AF140B] overflow-y-auto transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
            }`}
          style={{ height: 'calc(100vh - 56px)' }}
        >
          <nav className="py-3">
            {/* Dashboard — standalone, bigger */}
            {/* <button
              onClick={() => navigate('/manager/dashboard')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-base font-bold transition-colors border-l-4 ${
                location.pathname === '/manager/dashboard'
                  ? 'bg-white/20 text-white border-white'
                  : 'text-white hover:bg-white/15 border-transparent hover:border-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button> */}

            <div className="my-2 border-t border-white/20" />

            {/* Collapsible sections */}
            {sidebarSections.map((group, groupIndex) => {
              const isExpanded = expandedSections[group.section] ?? true;

              return (
                <div key={groupIndex}>
                  {/* Section header — clickable dropdown */}
                  <button
                    onClick={() => toggleSection(group.section)}
                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[12px] font-bold text-white uppercase tracking-wider">
                      {group.section}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </button>

                  {/* Items — only rendered when expanded */}
                  {isExpanded && group.items.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-2.5 pl-12 pr-5 py-2.5 text-sm transition-colors group border-l-4 ${isActive
                          ? 'bg-white/20 text-white border-white font-semibold'
                          : 'text-white/90 hover:bg-white/15 hover:text-white border-transparent hover:border-white'
                          }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                          }`} />
                        <span className="truncate">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content - Outlet renders the child route */}
        <main className="flex-1 overflow-y-auto bg-white" style={{ height: 'calc(100vh - 56px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
