import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  ArrowLeft,
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  MoreVertical,
  MapPin,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: string;
  date: string;
  storeId?: string;
}

// Mock orders
const mockOrders: Order[] = [
  {
    id: 'ORD-1234',
    customer: {
      name: 'Nguyễn Văn An',
      email: 'nguyenvanan@email.com',
      phone: '0901234567',
    },
    items: [
      { name: 'Robot Transformers Bumblebee', quantity: 1, price: 599000 },
      { name: 'LEGO City Police Station', quantity: 1, price: 1500000 },
    ],
    total: 2099000,
    status: 'shipping',
    paymentMethod: 'VNPAY',
    shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    date: '2025-01-14 10:30',
  },
  {
    id: 'ORD-1233',
    customer: {
      name: 'Trần Thị Bình',
      email: 'tranbbb@email.com',
      phone: '0912345678',
    },
    items: [
      { name: 'Búp bê Barbie Dreamhouse', quantity: 2, price: 890000 },
    ],
    total: 1780000,
    status: 'confirmed',
    paymentMethod: 'COD',
    shippingAddress: '45 Lê Lợi, Quận 1, TP.HCM',
    date: '2025-01-14 09:15',
  },
  {
    id: 'ORD-1232',
    customer: {
      name: 'Lê Hoàng Nam',
      email: 'lehnam@email.com',
      phone: '0923456789',
    },
    items: [
      { name: 'Xe điều khiển Ferrari', quantity: 1, price: 2100000 },
    ],
    total: 2100000,
    status: 'pending',
    paymentMethod: 'VNPAY',
    shippingAddress: '78 Hai Bà Trưng, Quận 3, TP.HCM',
    date: '2025-01-14 08:00',
  },
  {
    id: 'ORD-1231',
    customer: {
      name: 'Phạm Thị Diệu',
      email: 'phamdieu@email.com',
      phone: '0934567890',
    },
    items: [
      { name: 'Puzzle Disney 1000 mảnh', quantity: 1, price: 450000 },
    ],
    total: 450000,
    status: 'delivered',
    paymentMethod: 'COD',
    shippingAddress: '90 Võ Văn Tần, Quận 3, TP.HCM',
    date: '2025-01-13 15:20',
  },
  {
    id: 'ORD-1230',
    customer: {
      name: 'Hoàng Văn Tuấn',
      email: 'hoangvantuan@email.com',
      phone: '0945678901',
    },
    items: [
      { name: 'Board Game Monopoly', quantity: 1, price: 680000 },
    ],
    total: 680000,
    status: 'cancelled',
    paymentMethod: 'VNPAY',
    shippingAddress: '56 Lý Tự Trọng, Quận 1, TP.HCM',
    date: '2025-01-13 11:40',
  },
];

export default function OrderManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders] = useState<Order[]>(mockOrders);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFE5E3] text-[#AF140B] border-[#AF140B]/30';
      case 'confirmed':
        return 'bg-[#D91810]/20 text-[#8D0F08] border-[#D91810]/30';
      case 'shipping':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'delivered':
        return 'bg-[#8D0F08]/20 text-[#8D0F08] border-[#8D0F08]/30';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'shipping':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'shipping':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Package className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getOrdersByStatus = (status: string) => {
    return orders.filter((o) => o.status === status).length;
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    toast.success(`Đã cập nhật trạng thái đơn hàng ${orderId} thành "${getStatusText(newStatus)}"`);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm(`Bạn có chắc muốn hủy đơn hàng ${orderId}?`)) {
      toast.success('Đã hủy đơn hàng');
    }
  };

  const handleAssignToStore = (orderId: string, storeId: string) => {
    toast.success(`Đã giao đơn hàng ${orderId} cho cửa hàng để ship`);
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-xl">Quản lý đơn hàng</h1>
                <p className="text-xs text-gray-500">{filteredOrders.length} đơn hàng</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-[#AF140B]">{getOrdersByStatus('pending')}</p>
                </div>
                <Clock className="w-8 h-8 text-[#AF140B]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã xác nhận</p>
                  <p className="text-2xl font-bold text-[#D91810]">{getOrdersByStatus('confirmed')}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-[#D91810]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đang giao</p>
                  <p className="text-2xl font-bold text-purple-600">{getOrdersByStatus('shipping')}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold text-[#8D0F08]">{getOrdersByStatus('delivered')}</p>
                </div>
                <Package className="w-8 h-8 text-[#8D0F08]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã hủy</p>
                  <p className="text-2xl font-bold text-red-600">{getOrdersByStatus('cancelled')}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Mã đơn, tên KH, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filterStatus">Trạng thái</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="shipping">Đang giao</SelectItem>
                    <SelectItem value="delivered">Đã giao</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>Danh sách đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium font-mono">{order.id}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-xs text-gray-500">{order.customer.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.items.length} sản phẩm</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {order.total.toLocaleString()}đ
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{order.date}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmed')}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Xác nhận đơn
                            </DropdownMenuItem>
                          )}
                          {order.status === 'confirmed' && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipping')}>
                                <Truck className="w-4 h-4 mr-2" />
                                Chuyển sang giao hàng
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignToStore(order.id, 'store-1')}>
                                <MapPin className="w-4 h-4 mr-2" />
                                Giao cho cửa hàng ship
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === 'shipping' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                              <Package className="w-4 h-4 mr-2" />
                              Đánh dấu đã giao
                            </DropdownMenuItem>
                          )}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <DropdownMenuItem
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Hủy đơn hàng
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Chi tiết đơn hàng {selectedOrder?.id}</span>
                <Badge variant="outline" className={getStatusColor(selectedOrder?.status || '')}>
                  {getStatusText(selectedOrder?.status || '')}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Đặt lúc {selectedOrder?.date}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Thông tin khách hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">Họ tên</p>
                        <p className="font-medium">{selectedOrder.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p>{selectedOrder.customer.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Điện thoại</p>
                        <p className="font-medium">{selectedOrder.customer.phone}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Địa chỉ giao hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{selectedOrder.shippingAddress}</p>
                      <div className="pt-2 border-t">
                        <p className="text-gray-600">Thanh toán</p>
                        <Badge variant="outline" className="mt-1">
                          {selectedOrder.paymentMethod}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Sản phẩm ({selectedOrder.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                          </div>
                          <p className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 border-t-2">
                        <p className="font-bold">Tổng cộng</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {selectedOrder.total.toLocaleString()}đ
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}