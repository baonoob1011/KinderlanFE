import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { loyaltyApi } from '../../services/loyaltyApi';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Star,
  Gift,
  TrendingUp,
  Award,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Crown,
  Trophy,
  Loader2,
  AlertCircle,
} from 'lucide-react';



interface PointHistory {
  id: string;
  description: string;
  points: number;
  type: 'earn';
}

export default function LoyaltyPoints() {
  const { user } = useApp();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Real API state
  const [realPoints, setRealPoints] = useState<number | null>(null);
  const [realLifetimePoints, setRealLifetimePoints] = useState<number | null>(null);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // Order-derived point history
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      setPointsLoading(true);
      setPointsError(null);
      try {
        const data = await loyaltyApi.getMyPoints();
        setRealPoints(data.totalPoints ?? 0);
        setRealLifetimePoints(data.lifetimePoints ?? 0);
      } catch (err: unknown) {
        setPointsError(err instanceof Error ? err.message : 'Không thể tải điểm tích lũy.');
        // Fall back to user context points
        setRealPoints(user?.points ?? 0);
      } finally {
        setPointsLoading(false);
      }
    };
    fetchPoints();
  }, [user?.points]);

  // Use real points if available, fallback to context
  const currentPoints = realPoints ?? user?.points ?? 0;

  // Mock/derived data
  const customerPoints = {
    current: currentPoints,
    lifetime: realLifetimePoints ?? currentPoints,
    expiringSoon: 200,
    expiryDate: '2026-03-31',
    tier: user?.membershipTier || 'bronze',
    nextTier: user?.membershipTier === 'gold' ? 'platinum' : user?.membershipTier === 'silver' ? 'gold' : 'silver',
    pointsToNextTier: 500,
  };

  const tierBenefits = {
    bronze: {
      name: 'Đồng',
      icon: '🥉',
      color: '#CD7F32',
      benefits: ['Tích 1 điểm cho 10,000₫', 'Sinh nhật giảm 5%'],
    },
    silver: {
      name: 'Bạc',
      icon: '🥈',
      color: '#C0C0C0',
      benefits: ['Tích 1.5 điểm cho 10,000₫', 'Sinh nhật giảm 10%', 'Miễn phí ship đơn >500k'],
    },
    gold: {
      name: 'Vàng',
      icon: '👑',
      color: '#D4AF37',
      benefits: [
        'Tích 2 điểm cho 10,000₫',
        'Sinh nhật giảm 15%',
        'Miễn phí ship mọi đơn',
        'Ưu tiên hỗ trợ',
      ],
    },
    platinum: {
      name: 'Bạch kim',
      icon: '💎',
      color: '#E5E4E2',
      benefits: [
        'Tích 3 điểm cho 10,000₫',
        'Sinh nhật giảm 20%',
        'Miễn phí ship + đóng gói VIP',
        'Hỗ trợ 24/7',
        'Truy cập sớm sản phẩm mới',
      ],
    },
  };



  // Fetch orders and derive point history
  useEffect(() => {
    const fetchOrderHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await api.getMyOrders();
        let orders: any[] = [];
        if (response?.data && Array.isArray(response.data)) {
          orders = response.data;
        } else if (Array.isArray(response)) {
          orders = response;
        }

        // Only DELIVERED / COMPLETED orders earn points
        const earnedOrders = orders
          .filter((o: any) => o.orderStatus === 'DELIVERED' || o.orderStatus === 'COMPLETED')
          .sort((a: any, b: any) => b.orderId - a.orderId);

        const history: PointHistory[] = earnedOrders.map((order: any) => {
          const amount = order.totalAmount || 0;
          const earned = Math.floor(amount); // 1 point per 1₫
          return {
            id: `order-${order.orderId}`,
            description: `Đơn hàng #${order.orderId}`,
            points: earned,
            type: 'earn' as const,
          };
        });

        setPointHistory(history);
      } catch (err) {
        console.error('Failed to fetch order history for loyalty:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchOrderHistory();
  }, []);


  const tierProgress = (customerPoints.current / (customerPoints.current + customerPoints.pointsToNextTier)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/account">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại tài khoản
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Điểm tích lũy & Phần thưởng
          </h1>
          <p className="text-gray-600">
            Quản lý điểm thưởng và đổi quà hấp dẫn
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="history">Lịch sử điểm</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Current Points Card */}
            <Card className="bg-gradient-to-br from-[#AF140B] via-[#D91810] to-[#AF140B] text-white shadow-2xl border-2 border-[#D4AF37]/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/90 mb-2">Điểm hiện tại</p>
                    {pointsLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-white/70" />
                        <span className="text-white/70 text-lg">Đang tải...</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">
                          {customerPoints.current.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-2xl text-white/90">điểm</span>
                      </div>
                    )}
                  </div>
                  <Star className="w-16 h-16 text-[#FFD700] fill-[#FFD700] drop-shadow-lg" />
                </div>
                {pointsError && (
                  <div className="flex items-center gap-2 text-yellow-200 text-xs mb-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Dùng dữ liệu dự phòng — {pointsError}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90">
                    Tổng điểm tích lũy: {customerPoints.lifetime.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[#FFD700] flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {customerPoints.expiringSoon} điểm hết hạn {customerPoints.expiryDate}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Membership Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#D4AF37]" />
                  Hạng thành viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {tierBenefits[customerPoints.tier as keyof typeof tierBenefits].icon}
                      </span>
                      <span className="font-bold text-lg">
                        {tierBenefits[customerPoints.tier as keyof typeof tierBenefits].name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cần thêm</p>
                      <p className="font-bold text-[#AF140B]">
                        {customerPoints.pointsToNextTier} điểm
                      </p>
                    </div>
                  </div>
                  <Progress value={tierProgress} className="h-3" />
                  <p className="text-sm text-gray-600 mt-2">
                    để lên hạng{' '}
                    <span className="font-bold">
                      {tierBenefits[customerPoints.nextTier as keyof typeof tierBenefits].name}
                    </span>
                  </p>
                </div>

                {/* Current Tier Benefits */}
                <div className="bg-[#FFF9E6] p-4 rounded-lg border border-[#D4AF37]/20">
                  <p className="font-medium mb-2 text-[#B8860B]">Quyền lợi hiện tại:</p>
                  <ul className="space-y-2">
                    {tierBenefits[customerPoints.tier as keyof typeof tierBenefits].benefits.map(
                      (benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-[#D4AF37]" />
                          {benefit}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* All Tiers */}
            <Card>
              <CardHeader>
                <CardTitle>Các hạng thành viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(tierBenefits).map(([key, tier]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 transition-all ${key === customerPoints.tier
                        ? key === 'gold'
                          ? 'border-[#D4AF37] bg-gradient-to-br from-[#FFF9E6] to-[#FFFDF7] shadow-lg shadow-[#D4AF37]/20'
                          : 'border-[#AF140B] bg-[#FFE5E3]'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-center mb-3">
                        <span className="text-4xl">{tier.icon}</span>
                        <p className="font-bold mt-2">{tier.name}</p>
                      </div>
                      <ul className="space-y-1">
                        {tier.benefits.slice(0, 2).map((benefit, index) => (
                          <li key={index} className="text-xs text-gray-600">
                            • {benefit}
                          </li>
                        ))}
                        {tier.benefits.length > 2 && (
                          <li className="text-xs text-gray-500">
                            +{tier.benefits.length - 2} quyền lợi khác
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* How to Earn Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Cách tích điểm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium">Mua hàng</p>
                      <p className="text-sm text-gray-600">
                        Tích 2 điểm cho mỗi 10,000₫ (Hạng Vàng)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <Gift className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium">Sinh nhật</p>
                      <p className="text-sm text-gray-600">
                        Nhận 200 điểm vào ngày sinh nhật
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <Star className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium">Đánh giá sản phẩm</p>
                      <p className="text-sm text-gray-600">
                        Nhận 10 điểm cho mỗi đánh giá
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                    <Trophy className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="font-medium">Giới thiệu bạn bè</p>
                      <p className="text-sm text-gray-600">
                        Nhận 100 điểm khi bạn bè đăng ký
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử giao dịch điểm</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#AF140B] mb-3" />
                    <p className="text-gray-500">Đang tải lịch sử...</p>
                  </div>
                ) : pointHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Chưa có lịch sử tích điểm</p>
                    <p className="text-gray-400 text-sm mt-1">Điểm sẽ được tích khi đơn hàng được giao thành công</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pointHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-xs text-gray-400">Tích điểm từ đơn hàng</p>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          +{item.points.toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}