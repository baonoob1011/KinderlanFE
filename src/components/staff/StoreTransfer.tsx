import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  ArrowLeft,
  ArrowLeftRight,
  Plus,
  Store,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { stores } from '../../data/stores';
import { products } from '../../data/products';

interface TransferRequest {
  id: string;
  product: string;
  productId: string;
  fromStore: string;
  toStore: string;
  quantity: number;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected';
  requestDate: string;
  reason: string;
}

// Mock transfer history
const mockTransfers: TransferRequest[] = [
  {
    id: 'TRF-001',
    product: 'Robot Transformers Bumblebee',
    productId: '1',
    fromStore: 'Kinderland Crescent Mall',
    toStore: 'Kinderland Vincom Center Đồng Khởi',
    quantity: 5,
    status: 'in_transit',
    requestDate: '2025-01-13 14:30',
    reason: 'Hết hàng tại chi nhánh',
  },
  {
    id: 'TRF-002',
    product: 'LEGO City Police Station',
    productId: '8',
    fromStore: 'Kho trung tâm',
    toStore: 'Kinderland Vincom Center Đồng Khởi',
    quantity: 10,
    status: 'completed',
    requestDate: '2025-01-12 10:00',
    reason: 'Bổ sung tồn kho',
  },
];

export default function StoreTransfer() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transfers, setTransfers] = useState<TransferRequest[]>(mockTransfers);
  
  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    fromStoreId: '',
    quantity: '',
    reason: '',
  });

  const currentStore = stores.find((s) => s.id === adminUser?.storeId);

  // Check which stores have this product in stock
  const getStoresWithStock = (productId: string) => {
    return stores.filter((store) => {
      const stock = store.inventory[productId];
      return stock && stock > 5; // Only show stores with more than 5 items
    });
  };

  const handleRequestTransfer = () => {
    if (!formData.productId || !formData.fromStoreId || !formData.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const product = products.find((p) => p.id === formData.productId);
    const fromStore = stores.find((s) => s.id === formData.fromStoreId);

    if (!product || !fromStore) return;

    const newTransfer: TransferRequest = {
      id: `TRF-${String(transfers.length + 1).padStart(3, '0')}`,
      product: product.name,
      productId: formData.productId,
      fromStore: fromStore.name,
      toStore: currentStore?.name || '',
      quantity: parseInt(formData.quantity),
      status: 'pending',
      requestDate: new Date().toLocaleString('vi-VN'),
      reason: formData.reason,
    };

    setTransfers([newTransfer, ...transfers]);
    toast.success('Đã gửi yêu cầu chuyển kho thành công!');
    setIsRequestDialogOpen(false);
    setFormData({ productId: '', fromStoreId: '', quantity: '', reason: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'in_transit':
        return 'Đang vận chuyển';
      case 'completed':
        return 'Hoàn thành';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'completed':
        return <Package className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredTransfers = transfers.filter((transfer) =>
    transfer.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transfer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transfer.fromStore.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: transfers.filter((t) => t.status === 'pending').length,
    inTransit: transfers.filter((t) => t.status === 'in_transit').length,
    completed: transfers.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/staff/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-xl">Chuyển kho giữa chi nhánh</h1>
                <p className="text-xs text-gray-500">{currentStore?.name}</p>
              </div>
            </div>
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yêu cầu chuyển kho
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đang vận chuyển</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label htmlFor="search">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Mã yêu cầu, sản phẩm, chi nhánh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Lịch sử chuyển kho
            </CardTitle>
            <CardDescription>
              Các yêu cầu chuyển hàng giữa chi nhánh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã YC</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Từ</TableHead>
                  <TableHead>Đến</TableHead>
                  <TableHead className="text-center">SL</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <p className="font-medium font-mono">{transfer.id}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{transfer.product}</p>
                      <p className="text-xs text-gray-500">Lý do: {transfer.reason}</p>
                    </TableCell>
                    <TableCell className="text-sm">{transfer.fromStore}</TableCell>
                    <TableCell className="text-sm">{transfer.toStore}</TableCell>
                    <TableCell className="text-center font-medium">{transfer.quantity}</TableCell>
                    <TableCell className="text-sm">{transfer.requestDate}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusColor(transfer.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(transfer.status)}
                          {getStatusText(transfer.status)}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTransfers.length === 0 && (
              <div className="text-center py-12">
                <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Chưa có yêu cầu chuyển kho nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yêu cầu chuyển kho</DialogTitle>
              <DialogDescription>
                Tạo yêu cầu chuyển hàng từ chi nhánh khác về {currentStore?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="product">Sản phẩm cần chuyển *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value, fromStoreId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.slice(0, 20).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (ID: {product.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.productId && (
                <div>
                  <Label htmlFor="fromStore">Chuyển từ chi nhánh *</Label>
                  <Select
                    value={formData.fromStoreId}
                    onValueChange={(value) => setFormData({ ...formData, fromStoreId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chi nhánh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">Kho trung tâm (Không giới hạn)</SelectItem>
                      {getStoresWithStock(formData.productId)
                        .filter((s) => s.id !== adminUser?.storeId)
                        .map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} (Còn {store.inventory[formData.productId]} sản phẩm)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {getStoresWithStock(formData.productId).filter((s) => s.id !== adminUser?.storeId).length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Không có chi nhánh nào có đủ hàng. Chọn "Kho trung tâm"
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Số lượng *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Chi nhánh nhận</Label>
                  <Input value={currentStore?.name || ''} disabled />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Lý do chuyển kho *</Label>
                <Textarea
                  id="reason"
                  placeholder="VD: Hết hàng tại chi nhánh, có khách yêu cầu..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Lưu ý:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Yêu cầu sẽ được gửi đến quản lý để phê duyệt</li>
                  <li>• Thời gian vận chuyển giữa các chi nhánh: 1-2 ngày làm việc</li>
                  <li>• Chỉ chuyển từ chi nhánh có tồn kho {'>'} 5 sản phẩm</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleRequestTransfer} className="bg-purple-600 hover:bg-purple-700">
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}