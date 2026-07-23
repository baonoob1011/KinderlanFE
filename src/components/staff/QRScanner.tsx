import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  User,
  Award,
  Gift,
  TrendingUp,
  Calendar,
  Star,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberTier: 'Silver' | 'Gold' | 'Platinum';
  points: number;
  totalSpent: number;
  joinDate: string;
}

// Mock customer database
const mockCustomers: { [qrCode: string]: CustomerData } = {
  'KL001234': {
    id: 'CUST-001234',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@email.com',
    phone: '0901234567',
    memberTier: 'Gold',
    points: 1250,
    totalSpent: 12500000,
    joinDate: '15/03/2023',
  },
  'KL005678': {
    id: 'CUST-005678',
    name: 'Trần Thị Bình',
    email: 'tranbbb@email.com',
    phone: '0912345678',
    memberTier: 'Platinum',
    points: 3450,
    totalSpent: 34500000,
    joinDate: '02/01/2022',
  },
  'KL009999': {
    id: 'CUST-009999',
    name: 'Lê Hoàng Nam',
    email: 'lehnam@email.com',
    phone: '0923456789',
    memberTier: 'Silver',
    points: 450,
    totalSpent: 4500000,
    joinDate: '20/11/2024',
  },
};

export default function QRScanner() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [qrCode, setQrCode] = useState('');
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{ customer: string; points: number; time: string }>>([]);

  const handleScan = () => {
    setIsScanning(true);

    setTimeout(() => {
      const foundCustomer = mockCustomers[qrCode];
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        toast.success('Quét mã thành công!');
      } else {
        toast.error('Không tìm thấy thông tin khách hàng. Vui lòng kiểm tra lại mã QR.');
        setCustomer(null);
      }
      setIsScanning(false);
    }, 800);
  };

  const handleAddPoints = () => {
    if (!customer || !purchaseAmount) {
      toast.error('Vui lòng nhập số tiền mua hàng');
      return;
    }

    const amount = parseFloat(purchaseAmount.replace(/,/g, ''));
    const pointsEarned = Math.floor(amount / 1000); // 1 điểm cho mỗi 1000đ

    // Add to history
    const now = new Date();
    setScanHistory([
      {
        customer: customer.name,
        points: pointsEarned,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
      },
      ...scanHistory,
    ]);

    toast.success(
      `Đã tích thành công ${pointsEarned} điểm cho ${customer.name}!`,
      {
        duration: 3000,
      }
    );

    // Reset form
    setCustomer(null);
    setQrCode('');
    setPurchaseAmount('');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Silver':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return '💎';
      case 'Gold':
        return '🥇';
      case 'Silver':
        return '🥈';
      default:
        return '⭐';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button variant="ghost" size="icon" onClick={() => navigate('/staff/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-xl">Quét QR tích điểm</h1>
              <p className="text-xs text-gray-500">{adminUser?.storeName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Scanner */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Quét mã QR khách hàng
                </CardTitle>
                <CardDescription>
                  Nhập mã QR hoặc mã thẻ thành viên của khách hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="qrCode">Mã QR / Mã thẻ</Label>
                    <Input
                      id="qrCode"
                      placeholder="VD: KL001234"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleScan();
                      }}
                      className="text-lg font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleScan}
                      disabled={!qrCode || isScanning}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isScanning ? 'Đang quét...' : 'Quét'}
                    </Button>
                  </div>
                </div>

                {/* Demo codes hint */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-2">Mã demo để thử:</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(mockCustomers).map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="cursor-pointer bg-white hover:bg-blue-100"
                        onClick={() => setQrCode(code)}
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            {customer && (
              <Card className="border-2 border-blue-500">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Thông tin khách hàng
                    </span>
                    <Badge className={getTierColor(customer.memberTier)} variant="outline">
                      {getTierIcon(customer.memberTier)} {customer.memberTier}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Họ tên</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mã KH</p>
                      <p className="font-medium font-mono">{customer.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm">{customer.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Điện thoại</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-gray-500">Điểm hiện tại</p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{customer.points}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {(customer.totalSpent / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-gray-500">Ngày tham gia</p>
                      </div>
                      <p className="text-sm font-medium">{customer.joinDate}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label htmlFor="amount">Số tiền mua hàng</Label>
                    <div className="flex gap-4 mt-2">
                      <Input
                        id="amount"
                        type="text"
                        placeholder="500,000"
                        value={purchaseAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setPurchaseAmount(value ? parseInt(value).toLocaleString() : '');
                        }}
                        className="text-lg"
                      />
                      <Button
                        onClick={handleAddPoints}
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Tích điểm
                      </Button>
                    </div>
                    {purchaseAmount && (
                      <p className="text-xs text-gray-600 mt-2">
                        Điểm nhận được: <span className="font-bold text-green-600">
                          +{Math.floor(parseFloat(purchaseAmount.replace(/,/g, '')) / 1000)} điểm
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scan History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Lịch sử tích điểm
                </CardTitle>
                <CardDescription>Hôm nay</CardDescription>
              </CardHeader>
              <CardContent>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Chưa có giao dịch nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scanHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{item.customer}</p>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{item.time}</span>
                          <span className="font-bold text-green-600">+{item.points} điểm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Guide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Hướng dẫn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-600">
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <p>Yêu cầu khách hàng xuất mã QR từ app Kinderland</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <p>Quét mã QR hoặc nhập mã thẻ thành viên</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <p>Nhập tổng tiền mua hàng (chưa giảm giá)</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <p>Nhấn "Tích điểm" để hoàn tất</p>
                </div>
                <div className="mt-4 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="font-medium text-yellow-900">Chính sách tích điểm:</p>
                  <p className="mt-1">1 điểm = 1,000đ chi tiêu</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}