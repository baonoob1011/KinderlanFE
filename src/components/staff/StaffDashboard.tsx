import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Package,
  QrCode,
  AlertTriangle,
  LogOut,
  Store,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Boxes,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { stores } from '../../data/stores';
import { products } from '../../data/products';

export default function StaffDashboard() {
  const { adminUser, logoutAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  // Get current store data
  const currentStore = stores.find((s) => s.id === adminUser?.storeId);

  // Calculate store statistics
  const getStoreStats = () => {
    if (!currentStore) return { total: 0, low: 0, outOfStock: 0, value: 0 };

    let total = 0;
    let low = 0;
    let outOfStock = 0;
    let value = 0;

    Object.entries(currentStore.inventory).forEach(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        total += qty;
        if (qty === 0) outOfStock++;
        else if (qty <= 5) low++;
        value += product.price * qty;
      }
    });

    return { total, low, outOfStock, value };
  };

  const stats = getStoreStats();

  // Get low stock items
  const getLowStockItems = () => {
    if (!currentStore) return [];
    
    const items: Array<{ name: string; qty: number; id: string }> = [];
    Object.entries(currentStore.inventory).forEach(([productId, qty]) => {
      if (qty <= 5 && qty > 0) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          items.push({ name: product.name, qty, id: productId });
        }
      }
    });
    return items.sort((a, b) => a.qty - b.qty);
  };

  const lowStockItems = getLowStockItems();

  // Mock recent activities
  const recentActivities = [
    { type: 'scan', customer: 'Nguyễn Văn A', points: 50, time: '5 phút trước' },
    { type: 'transfer', from: 'Kho chính', items: 15, time: '1 giờ trước' },
    { type: 'return', customer: 'Trần Thị B', status: 'approved', time: '2 giờ trước' },
    { type: 'inventory', items: 45, time: '3 giờ trước' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan':
        return <QrCode className="w-5 h-5 text-blue-600" />;
      case 'transfer':
        return <ArrowLeftRight className="w-5 h-5 text-green-600" />;
      case 'return':
        return <Archive className="w-5 h-5 text-orange-600" />;
      case 'inventory':
        return <Boxes className="w-5 h-5 text-purple-600" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'scan':
        return `Tích điểm cho ${activity.customer} (+${activity.points} điểm)`;
      case 'transfer':
        return `Nhận ${activity.items} sản phẩm từ ${activity.from}`;
      case 'return':
        return `Xử lý trả hàng của ${activity.customer}`;
      case 'inventory':
        return `Kiểm kho ${activity.items} sản phẩm`;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-blue-600">Kinderland Staff</h1>
                <p className="text-xs text-gray-500">{currentStore?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{adminUser?.name}</p>
                <p className="text-xs text-gray-500">Nhân viên cửa hàng</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Info */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">{currentStore?.name}</h2>
                <p className="text-sm text-gray-600 mb-1">{currentStore?.address}</p>
                <p className="text-sm text-gray-600">{currentStore?.district}, {currentStore?.city}</p>
                <p className="text-sm text-gray-600 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {currentStore?.openHours} | {currentStore?.phone}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Đang hoạt động
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Tổng tồn kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">sản phẩm</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Sắp hết hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.low}</div>
              <p className="text-xs text-gray-500 mt-1">sản phẩm ≤ 5 cái</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Hết hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
              <p className="text-xs text-gray-500 mt-1">sản phẩm</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Giá trị kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.value / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 mt-1">đồng</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <CardTitle>Cảnh báo sắp hết hàng</CardTitle>
                <Badge variant="destructive">{lowStockItems.length}</Badge>
              </div>
              <CardDescription>
                Các sản phẩm cần yêu cầu chuyển kho hoặc nhập thêm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <p className="font-medium text-sm">{item.name}</p>
                    <Badge variant="outline" className="bg-white text-orange-700 border-orange-300">
                      Còn {item.qty}
                    </Badge>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <Button
                    variant="link"
                    className="w-full text-orange-600"
                    onClick={() => navigate('/staff/inventory')}
                  >
                    Xem tất cả {lowStockItems.length} sản phẩm →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Chức năng nhanh</CardTitle>
              <CardDescription>Các tác vụ thường dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 border-2 hover:border-blue-500"
                  onClick={() => navigate('/staff/qr-scanner')}
                >
                  <QrCode className="w-8 h-8 text-blue-600" />
                  <span className="text-sm font-medium">Quét QR tích điểm</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 border-2 hover:border-green-500"
                  onClick={() => navigate('/staff/inventory')}
                >
                  <Boxes className="w-8 h-8 text-green-600" />
                  <span className="text-sm font-medium">Kiểm kho</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 border-2 hover:border-purple-500"
                  onClick={() => navigate('/staff/transfer')}
                >
                  <ArrowLeftRight className="w-8 h-8 text-purple-600" />
                  <span className="text-sm font-medium">Chuyển kho</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 border-2 hover:border-orange-500"
                  onClick={() => navigate('/staff/returns')}
                >
                  <Archive className="w-8 h-8 text-orange-600" />
                  <span className="text-sm font-medium">Trả hàng</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>Lịch sử làm việc của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{getActivityText(activity)}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/staff/defective')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Báo cáo hàng lỗi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Lập danh sách sản phẩm hư hỏng, hết hạn cần thanh lý
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/staff/stock-check')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-purple-600" />
                Ghi nhận số lượng thực tế
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Nhập số lượng thực tế khi kiểm kho định kỳ
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/staff/availability')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Kiểm tra tồn kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Xem sản phẩm có sẵn tại các chi nhánh khác
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}