import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, FileText,
  Warehouse, DollarSign, LogOut, Settings, Shield, UserCog, BarChart3,
  Megaphone, MessageSquare, Star, ClipboardList, LockKeyhole,
  UserPlus, Eye, Activity, Menu, X, Home, ChevronRight, Bell
} from 'lucide-react';

export default function EnhancedAdminDashboard() {
  const navigate = useNavigate();
  const { adminUser, logoutAdmin } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  // Statistics data
  const stats = [
    { label: 'Tổng đơn hàng', value: '1,245', change: '+18.2%', icon: ShoppingCart, bg: 'bg-[#AF140B]' },
    { label: 'Doanh thu tháng này', value: '₫842M', change: '+23.5%', icon: DollarSign, bg: 'bg-[#D4AF37]' },
    { label: 'Khách hàng mới', value: '356', change: '+12.3%', icon: Users, bg: 'bg-blue-600' },
    { label: 'Tỷ lệ chuyển đổi', value: '3.8%', change: '+0.4%', icon: TrendingUp, bg: 'bg-green-600' },
  ];

  // Sidebar navigation items
  const sidebarItems = [
    {
      section: 'Sản phẩm & Danh mục',
      items: [
        { title: 'Quản lý Sản phẩm', icon: Package, path: '/admin/products' },
        { title: 'Quản lý Danh mục', icon: LayoutDashboard, path: '/admin/categories' },
      ]
    },
    {
      section: 'Đơn hàng',
      items: [
        { title: 'Quản lý Đơn hàng', icon: ShoppingCart, path: '/admin/orders' },
        { title: 'Xử lý Hoàn trả', icon: ClipboardList, path: '/admin/returns' },
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
      section: 'Người dùng & Phân quyền',
      items: [
        { title: 'Quản lý Người dùng', icon: Users, path: '/admin/users' },
        { title: 'Quản lý Phân quyền', icon: Shield, path: '/admin/permissions' },
        { title: 'Thêm Quyền cho Role', icon: UserPlus, path: '/admin/role-permissions' },
      ]
    },
    {
      section: 'Báo cáo & Tài chính',
      items: [
        { title: 'Dashboard Tổng quan', icon: Activity, path: '/admin/overview' },
        { title: 'Quản lý Tài chính', icon: DollarSign, path: '/admin/financial' },
      ]
    },
    {
      section: 'Cài đặt',
      items: [
        { title: 'Đổi Mật khẩu', icon: LockKeyhole, path: '/admin/change-password' },
        { title: 'Cài đặt Hệ thống', icon: Settings, path: '/admin/settings' },
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
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Administrator Dashboard</h1>
              <p className="text-[11px] text-white/80 leading-tight">Toàn quyền quản trị</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
          className={`bg-[#AF140B] overflow-y-auto transition-all duration-300 flex-shrink-0 ${
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
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
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white/90 hover:bg-white/15 hover:text-white transition-colors group border-l-3 border-transparent hover:border-white"
                    >
                      <Icon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-white" style={{ height: 'calc(100vh - 56px)' }}>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                        <p className="text-xs text-green-600 font-medium">{stat.change}</p>
                      </div>
                      <div className={`${stat.bg} p-2.5 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#AF140B] to-[#D91810] rounded-xl p-5 mb-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Chào mừng trở lại, {adminUser?.name}! 👋</h2>
                <p className="text-white/85 text-sm">
                  Bạn có toàn quyền quản trị hệ thống Kinderland. Quản lý sản phẩm, đơn hàng, khuyến mãi và nhiều hơn nữa.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Thêm sản phẩm', icon: Package, path: '/admin/products', color: 'bg-[#AF140B]', hover: 'hover:border-[#AF140B]', textHover: 'group-hover:text-[#AF140B]' },
              { label: 'Tạo khuyến mãi', icon: Megaphone, path: '/admin/promotions', color: 'bg-[#D4AF37]', hover: 'hover:border-[#D4AF37]', textHover: 'group-hover:text-[#D4AF37]' },
              { label: 'Quản lý user', icon: Users, path: '/admin/users', color: 'bg-indigo-600', hover: 'hover:border-indigo-500', textHover: 'group-hover:text-indigo-600' },
              { label: 'Xem báo cáo', icon: BarChart3, path: '/admin/reports', color: 'bg-green-600', hover: 'hover:border-green-500', textHover: 'group-hover:text-green-600' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl ${item.hover} hover:shadow-md transition-all group`}
                >
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium text-gray-700 ${item.textHover}`}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                title: 'Quản lý Sản phẩm & Danh mục',
                icon: Package,
                iconColor: 'text-[#AF140B]',
                items: [
                  { label: 'Quản lý Sản phẩm', desc: 'Thêm, sửa, xóa sản phẩm', path: '/admin/products' },
                  { label: 'Quản lý Danh mục', desc: 'Tạo và quản lý danh mục', path: '/admin/categories' },
                ],
              },
              {
                title: 'Quản lý Đơn hàng',
                icon: ShoppingCart,
                iconColor: 'text-[#D4AF37]',
                items: [
                  { label: 'Quản lý Đơn hàng', desc: 'Xem và xử lý tất cả đơn hàng', path: '/admin/orders' },
                  { label: 'Xử lý Hoàn trả', desc: 'Duyệt yêu cầu trả hàng', path: '/admin/returns' },
                ],
              },
              {
                title: 'Marketing & Khuyến mãi',
                icon: Megaphone,
                iconColor: 'text-purple-600',
                items: [
                  { label: 'Quản lý Khuyến mãi', desc: 'Tạo mã giảm giá', path: '/admin/promotions' },
                  { label: 'Quản lý Blog', desc: 'Tạo và chỉnh sửa bài viết', path: '/admin/blog' },
                  { label: 'Quản lý Đánh giá', desc: 'Duyệt và phản hồi đánh giá', path: '/admin/reviews' },
                ],
              },
              {
                title: 'Người dùng & Phân quyền',
                icon: Users,
                iconColor: 'text-indigo-600',
                items: [
                  { label: 'Quản lý Người dùng', desc: 'Quản lý tài khoản khách hàng', path: '/admin/users' },
                  { label: 'Quản lý Phân quyền', desc: 'Thiết lập quyền truy cập', path: '/admin/permissions' },
                  { label: 'Thêm Quyền cho Role', desc: 'Gán quyền cho vai trò', path: '/admin/role-permissions' },
                ],
              },
            ].map((group, groupIdx) => {
              const GroupIcon = group.icon;
              return (
                <Card key={groupIdx} className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                      <GroupIcon className={`w-4 h-4 ${group.iconColor}`} />
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-[#AF140B]/5 hover:shadow-sm transition-all group"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-[#AF140B]">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#AF140B]" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
