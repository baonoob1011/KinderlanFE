import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  LayoutDashboard, Package, Warehouse, DollarSign,
  MessageSquare, ChevronRight, Truck,
  ArrowLeftRight
} from 'lucide-react';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();

  // Statistics data — only features from use case diagram
  const stats = [
    { label: 'Tồn kho cần kiểm', value: '12', change: '-3 hôm nay', icon: Warehouse, bg: 'bg-blue-600' },
    { label: 'Đơn nhập hàng', value: '8', change: '+2 mới', icon: Package, bg: 'bg-[#D4AF37]' },
    { label: 'Yêu cầu hoàn trả', value: '5', change: 'Chờ xử lý', icon: ArrowLeftRight, bg: 'bg-orange-500' },
    { label: 'Đánh giá mới', value: '23', change: '+5 hôm nay', icon: MessageSquare, bg: 'bg-[#AF140B]' },
  ];

  return (
    <div className="p-6 bg-white min-h-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#AF140B] to-[#D91810] rounded-xl p-5 mb-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">
              Xin chào, {adminUser?.name || 'Manager'}! 👋
            </h2>
            <p className="text-white/85 text-sm">
              Chào mừng bạn trở lại. Quản lý chi nhánh hiệu quả hơn mỗi ngày.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

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

      {/* Quick Actions — only features from use case diagram */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Thao tác nhanh</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => navigate('/manager/inventory')}
          className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Kiểm tra tồn kho</span>
        </button>
        <button
          onClick={() => navigate('/manager/import-orders')}
          className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#D4AF37] hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-[#D4AF37]">Nhập hàng</span>
        </button>
        <button
          onClick={() => navigate('/manager/returns')}
          className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-orange-500">Xử lý hoàn trả</span>
        </button>
        <button
          onClick={() => navigate('/manager/financial')}
          className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Tài chính</span>
        </button>
      </div>

      {/* Info Section — only use case features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <Warehouse className="w-4 h-4 text-blue-600" />
              Quản lý kho hàng
            </CardTitle>
            <CardDescription className="text-xs">Quản lý danh mục, tồn kho và nhập hàng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Quản lý danh mục', desc: 'Quản lý danh mục và phân loại', path: '/manager/categories' },
              { label: 'Kiểm tra tồn kho', desc: 'Xem tình trạng tồn kho', path: '/manager/inventory' },
              { label: 'Cập nhật kho', desc: 'Cập nhật số lượng kho', path: '/manager/storage' },
              { label: 'Kiểm kê thực tế', desc: 'Ghi nhận số lượng thực tế', path: '/manager/physical-count' },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-sm transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <Truck className="w-4 h-4 text-[#D4AF37]" />
              Nhập hàng & Vận chuyển
            </CardTitle>
            <CardDescription className="text-xs">Nhập hàng, chuyển kho và báo cáo lỗi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              // { label: 'Nhập hàng từ kho chính', desc: 'Tạo đơn nhập mới', path: '/manager/import-orders' },
              { label: 'Quản lý chuyển kho', desc: 'Theo dõi đơn chuyển', path: '/manager/import-management' },
              { label: 'Báo cáo hàng lỗi', desc: 'Thanh lý sản phẩm lỗi', path: '/manager/defective-report' },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-amber-50 hover:shadow-sm transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-[#D4AF37]">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#D4AF37]" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}