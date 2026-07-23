import React from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  User, 
  ShoppingBag, 
  Star, 
  Gift, 
  MapPin, 
  CreditCard,
  Heart,
  Bell,
  Settings
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useApp();

  // Mock data for customer stats
  const customerStats = {
    totalOrders: 12,
    pendingOrders: 2,
    completedOrders: 10,
    points: user?.points || 0,
    membershipTier: user?.membershipTier || 'bronze',
    wishlistCount: 8,
    savedAddresses: 3,
  };

  const getMembershipBadge = (tier: string) => {
    const badges: { [key: string]: { icon: string; color: string; label: string } } = {
      gold: { icon: '👑', color: 'bg-yellow-500', label: 'Thành viên Vàng' },
      silver: { icon: '🥈', color: 'bg-gray-400', label: 'Thành viên Bạc' },
      bronze: { icon: '🥉', color: 'bg-orange-600', label: 'Thành viên Đồng' },
    };
    return badges[tier] || badges.bronze;
  };

  const membershipBadge = getMembershipBadge(customerStats.membershipTier);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xin chào, {user?.name || 'Khách hàng'}! 👋
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin tài khoản và đơn hàng của bạn
          </p>
        </div>

        {/* Membership Card */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{membershipBadge.icon}</span>
                  <h3 className="text-xl font-bold">{membershipBadge.label}</h3>
                </div>
                <p className="text-blue-100 mb-4">ID: {user?.id || 'N/A'}</p>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                  <span className="text-2xl font-bold">{customerStats.points.toLocaleString('vi-VN')}</span>
                  <span className="text-blue-100">điểm</span>
                </div>
              </div>
              <div className="text-right">
                <Link to="/account/loyalty">
                  <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100">
                    <Gift className="w-4 h-4 mr-2" />
                    Đổi quà
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                  <p className="text-3xl font-bold text-gray-900">{customerStats.totalOrders}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đang xử lý</p>
                  <p className="text-3xl font-bold text-orange-600">{customerStats.pendingOrders}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã hoàn thành</p>
                  <p className="text-3xl font-bold text-green-600">{customerStats.completedOrders}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Yêu thích</p>
                  <p className="text-3xl font-bold text-pink-600">{customerStats.wishlistCount}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/account/profile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-indigo-600" />
                  Thông tin tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Cập nhật thông tin cá nhân, số điện thoại và địa chỉ
                </p>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Email:</strong> {user?.email}</p>
                  <p className="text-sm"><strong>SĐT:</strong> {user?.phone || 'Chưa cập nhật'}</p>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Order History */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/account/orders">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  Đơn hàng của tôi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Xem lịch sử và theo dõi tình trạng đơn hàng
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-orange-300 text-orange-600">
                    {customerStats.pendingOrders} đang xử lý
                  </Badge>
                  <Badge variant="outline" className="border-green-300 text-green-600">
                    {customerStats.completedOrders} hoàn thành
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Loyalty Points */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/account/loyalty">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Điểm tích lũy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Quản lý điểm thưởng và đổi quà tặng
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-indigo-600">
                    {customerStats.points.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-sm text-gray-500">điểm</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Addresses */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/account/addresses">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Địa chỉ giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Quản lý các địa chỉ giao hàng của bạn
                </p>
                <p className="text-sm">
                  <strong>{customerStats.savedAddresses}</strong> địa chỉ đã lưu
                </p>
              </CardContent>
            </Link>
          </Card>

          {/* Wishlist */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/account/wishlist">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-pink-600" />
                  Sản phẩm yêu thích
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Danh sách những sản phẩm bạn quan tâm
                </p>
                <p className="text-sm">
                  <strong>{customerStats.wishlistCount}</strong> sản phẩm
                </p>
              </CardContent>
            </Link>
          </Card>

          {/* Notifications */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/account/notifications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Thông báo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Cài đặt nhận thông báo khuyến mãi và đơn hàng
                </p>
                <Badge className="bg-red-500">3 thông báo mới</Badge>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}