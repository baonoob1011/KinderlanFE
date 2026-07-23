import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  ArrowLeft,
  Archive,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ReturnRequest {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  product: string;
  quantity: number;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refundMethod?: 'bank' | 'egift';
  refundAmount: number;
  note?: string;
}

// Mock return requests
const mockReturns: ReturnRequest[] = [
  {
    id: 'RET-101',
    orderId: 'ORD-1220',
    customer: 'Hoàng Văn E',
    phone: '0901234567',
    product: 'Robot Transformers Bumblebee',
    quantity: 1,
    reason: 'Sản phẩm bị lỗi, không hoạt động',
    requestDate: '2025-01-14 09:00',
    status: 'pending',
    refundAmount: 599000,
  },
  {
    id: 'RET-102',
    orderId: 'ORD-1215',
    customer: 'Vũ Thị F',
    phone: '0912345678',
    product: 'Búp bê Barbie Dreamhouse',
    quantity: 1,
    reason: 'Giao sai hàng, không đúng mô tả',
    requestDate: '2025-01-13 14:30',
    status: 'approved',
    refundMethod: 'bank',
    refundAmount: 890000,
  },
  {
    id: 'RET-103',
    orderId: 'ORD-1210',
    customer: 'Nguyễn Thị G',
    phone: '0923456789',
    product: 'LEGO City Police Station',
    quantity: 1,
    reason: 'Đổi ý, không muốn mua nữa',
    requestDate: '2025-01-12 11:00',
    status: 'refunded',
    refundMethod: 'egift',
    refundAmount: 1500000,
  },
];

export default function ReturnManagement() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [returns, setReturns] = useState<ReturnRequest[]>(mockReturns);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [processingReturn, setProcessingReturn] = useState<ReturnRequest | null>(null);
  const [refundMethod, setRefundMethod] = useState<'bank' | 'egift'>('bank');
  const [processNote, setProcessNote] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'refunded':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  const filteredReturns = returns.filter((ret) =>
    ret.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.phone.includes(searchQuery)
  );

  const handleApprove = (returnReq: ReturnRequest) => {
    setProcessingReturn(returnReq);
  };

  const handleReject = (id: string) => {
    if (confirm('Bạn có chắc muốn từ chối yêu cầu trả hàng này?')) {
      const note = prompt('Nhập lý do từ chối:');
      setReturns(
        returns.map((r) =>
          r.id === id ? { ...r, status: 'rejected' as const, note } : r
        )
      );
      toast.success('Đã từ chối yêu cầu trả hàng');
    }
  };

  const handleProcessRefund = () => {
    if (!processingReturn) return;

    setReturns(
      returns.map((r) =>
        r.id === processingReturn.id
          ? {
              ...r,
              status: 'refunded' as const,
              refundMethod,
              note: processNote,
            }
          : r
      )
    );

    toast.success(
      `Đã hoàn tiền ${processingReturn.refundAmount.toLocaleString()}đ qua ${
        refundMethod === 'bank' ? 'chuyển khoản' : 'E-Gift card'
      }`
    );

    setProcessingReturn(null);
    setProcessNote('');
  };

  const stats = {
    pending: returns.filter((r) => r.status === 'pending').length,
    approved: returns.filter((r) => r.status === 'approved').length,
    refunded: returns.filter((r) => r.status === 'refunded').length,
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
                <h1 className="font-bold text-xl">Xử lý trả hàng</h1>
                <p className="text-xs text-gray-500">Quản lý yêu cầu trả hàng/hoàn tiền</p>
              </div>
            </div>
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
                  <p className="text-sm text-gray-600">Chờ xử lý</p>
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
                  <p className="text-sm text-gray-600">Đã duyệt</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Đã hoàn tiền</p>
                  <p className="text-2xl font-bold text-green-600">{stats.refunded}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
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
                placeholder="Mã trả hàng, mã đơn, tên KH, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Danh sách yêu cầu trả hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã trả hàng</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Hoàn tiền</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="w-[150px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell>
                      <p className="font-medium font-mono">{ret.id}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">{ret.orderId}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ret.customer}</p>
                        <p className="text-xs text-gray-500">{ret.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{ret.product}</p>
                      <p className="text-xs text-gray-500">SL: {ret.quantity}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {ret.refundAmount.toLocaleString()}đ
                    </TableCell>
                    <TableCell className="text-sm">{ret.requestDate}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusColor(ret.status)}>
                        {getStatusText(ret.status)}
                      </Badge>
                      {ret.refundMethod && (
                        <p className="text-xs text-gray-500 mt-1">
                          {ret.refundMethod === 'bank' ? 'Chuyển khoản' : 'E-Gift card'}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReturn(ret)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {ret.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(ret)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(ret.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredReturns.length === 0 && (
              <div className="text-center py-12">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Không có yêu cầu trả hàng nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Detail Dialog */}
        <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết yêu cầu trả hàng</DialogTitle>
              <DialogDescription>{selectedReturn?.id}</DialogDescription>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mã đơn hàng</Label>
                    <p className="font-mono font-medium">{selectedReturn.orderId}</p>
                  </div>
                  <div>
                    <Label>Ngày yêu cầu</Label>
                    <p>{selectedReturn.requestDate}</p>
                  </div>
                  <div>
                    <Label>Khách hàng</Label>
                    <p className="font-medium">{selectedReturn.customer}</p>
                  </div>
                  <div>
                    <Label>Điện thoại</Label>
                    <p>{selectedReturn.phone}</p>
                  </div>
                </div>
                <div>
                  <Label>Sản phẩm</Label>
                  <p className="font-medium">{selectedReturn.product}</p>
                  <p className="text-sm text-gray-600">Số lượng: {selectedReturn.quantity}</p>
                </div>
                <div>
                  <Label>Lý do trả hàng</Label>
                  <div className="p-3 bg-orange-50 rounded border border-orange-200">
                    <p className="text-sm">{selectedReturn.reason}</p>
                  </div>
                </div>
                <div>
                  <Label>Số tiền hoàn lại</Label>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedReturn.refundAmount.toLocaleString()}đ
                  </p>
                </div>
                {selectedReturn.note && (
                  <div>
                    <Label>Ghi chú</Label>
                    <p className="text-sm text-gray-600">{selectedReturn.note}</p>
                  </div>
                )}
                <div>
                  <Label>Trạng thái</Label>
                  <Badge variant="outline" className={getStatusColor(selectedReturn.status)}>
                    {getStatusText(selectedReturn.status)}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setSelectedReturn(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Process Refund Dialog */}
        <Dialog open={!!processingReturn} onOpenChange={(open) => !open && setProcessingReturn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xử lý hoàn tiền</DialogTitle>
              <DialogDescription>
                {processingReturn?.id} - {processingReturn?.customer}
              </DialogDescription>
            </DialogHeader>
            {processingReturn && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium mb-2">Thông tin hoàn tiền:</p>
                  <p className="text-sm">Sản phẩm: {processingReturn.product}</p>
                  <p className="text-sm">Số lượng: {processingReturn.quantity}</p>
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    Số tiền: {processingReturn.refundAmount.toLocaleString()}đ
                  </p>
                </div>

                <div>
                  <Label htmlFor="refundMethod">Hình thức hoàn tiền *</Label>
                  <Select value={refundMethod} onValueChange={(value: 'bank' | 'egift') => setRefundMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Chuyển khoản ngân hàng</SelectItem>
                      <SelectItem value="egift">E-Gift card Kinderland</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {refundMethod === 'bank'
                      ? 'Tiền sẽ được chuyển về tài khoản ngân hàng của khách trong 3-5 ngày'
                      : 'E-Gift card có thể sử dụng ngay tại tất cả cửa hàng Kinderland'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="processNote">Ghi chú xử lý</Label>
                  <Textarea
                    id="processNote"
                    value={processNote}
                    onChange={(e) => setProcessNote(e.target.value)}
                    placeholder="Ghi chú về quá trình xử lý..."
                    rows={3}
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-900">⚠️ Lưu ý:</p>
                  <p className="text-xs text-yellow-800 mt-1">
                    Sau khi xác nhận, hệ thống sẽ tự động hoàn lại số tiền và cập nhật trạng thái đơn hàng.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setProcessingReturn(null)}>
                Hủy
              </Button>
              <Button onClick={handleProcessRefund} className="bg-green-600 hover:bg-green-700">
                <DollarSign className="w-4 h-4 mr-2" />
                Xác nhận hoàn tiền
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}