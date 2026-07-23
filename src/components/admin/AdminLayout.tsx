import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../ui/button';
import {
  BarChart3, Package, ShoppingCart, Users, DollarSign, LogOut,
  Settings, Bell, Store, FileText, Shield, Megaphone, MessageSquare,
  ClipboardList, LockKeyhole, UserPlus, Activity,
  Menu, X, Home
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logoutAdmin } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      section: 'Tổng quan',
      items: [
        { title: 'Dashboard', icon: Activity, path: '/admin/dashboard' },
      ]
    },
    {
      section: 'Sản phẩm & Danh mục',
      items: [
        { title: 'Quản lý Sản phẩm', icon: Package, path: '/admin/products' },
        { title: 'Quản lý Danh mục', icon: Package, path: '/admin/categories' },
        { title: 'Quản lý Thương hiệu', icon: Package, path: '/admin/brands' },
      ]
    },
    {
      section: 'Marketing',
      items: [
        { title: 'Quản lý Khuyến mãi', icon: Megaphone, path: '/admin/promotions' },
        { title: 'Quản lý Blog', icon: FileText, path: '/admin/blog' },
        { title: 'Quản lý Đánh giá', icon: MessageSquare, path: '/admin/reviews' },
      ]
    },
    {
      section: 'Tài khoản',
      items: [
        { title: 'Quản lý Tài khoản', icon: Users, path: '/admin/users' },
      ]
    },
    {
      section: 'Tài chính',
      items: [
        { title: 'Quản lý Tài chính', icon: DollarSign, path: '/admin/financial' },
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
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Kinderland Admin</h1>
              <p className="text-[11px] text-white/80 leading-tight">Quản trị hệ thống</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-md hover:bg-white/20 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{adminUser?.name}</p>
              <p className="text-[11px] text-white/80 leading-tight">Administrator</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 border border-white/30 h-8 text-sm px-3"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Trang chủ
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
            {sidebarItems.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-1">
                <h3 className="px-4 py-2 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  {group.section}
                </h3>
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors group border-l-3 ${isActive
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
            ))}
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
