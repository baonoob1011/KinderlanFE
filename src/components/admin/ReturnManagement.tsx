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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  ArrowLeft, Archive, Search, Clock, CheckCircle2, XCircle,
  Eye, DollarSign, CreditCard, AlertTriangle, Upload, Package,
  RefreshCw, Award, Image as ImageIcon, FileText, History
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Types
type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'exchanged';
type ReturnReason = 'defect' | 'wrong_item' | 'change_mind' | 'damaged' | 'missing_parts';
type ResolutionMethod = 'refund' | 'exchange';
type RefundMethod = 'original' | 'store_credit';
type InventoryAction = 'restock' | 'damaged';

interface ReturnRequest {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  email: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: ReturnReason;
  reasonDetails: string;
  requestDate: Date;
  deliveredDate: Date;
  status: ReturnStatus;
  resolutionMethod?: ResolutionMethod;
  refundMethod?: RefundMethod;
  refundAmount?: number;
  shippingFee?: number;
  processingFee?: number;
  inventoryAction?: InventoryAction;
  proofImages?: string[];
  staffNote?: string;
  processedBy?: string;
  processedDate?: Date;
  isHighValue: boolean;
  isHygieneSensitive: boolean;
  sealBroken: boolean;
  bundleInfo?: {
    isBundleItem: boolean;
    originalBundleDiscount?: number;
  };
}

// Mock data
const mockReturns: ReturnRequest[] = [
  {
    id: 'RET-001',
    orderId: 'ORD-1220',
    customer: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'nguyenvana@email.com',
    productName: 'Robot Transformers Bumblebee',
    productSku: 'TRANS-001',
    quantity: 1,
    unitPrice: 1250000,
    totalPrice: 1250000,
    reason: 'defect',
    reasonDetails: 'Sản phẩm bị hỏng chi tiết cánh tay khi mở hộp',
    requestDate: new Date('2026-02-18'),
    deliveredDate: new Date('2026-02-15'),
    status: 'pending',
    isHighValue: false,
    isHygieneSensitive: false,
    sealBroken: true,
    proofImages: ['image1.jpg', 'image2.jpg'],
  },
  {
    id: 'RET-002',
    orderId: 'ORD-1215',
    customer: 'Trần Thị B',
    phone: '0912345678',
    email: 'tranthib@email.com',
    productName: 'Gấu bông Teddy Bear lớn',
    productSku: 'PLUSH-045',
    quantity: 1,
    unitPrice: 450000,
    totalPrice: 450000,
    reason: 'wrong_item',
    reasonDetails: 'Giao nhầm màu, đặt màu hồng nhưng nhận màu xanh',
    requestDate: new Date('2026-02-17'),
    deliveredDate: new Date('2026-02-14'),
    status: 'pending',
    isHighValue: false,
    isHygieneSensitive: true,
    sealBroken: false,
  },
  {
    id: 'RET-003',
    orderId: 'ORD-1200',
    customer: 'Lê Văn C',
    phone: '0923456789',
    email: 'levanc@email.com',
    productName: 'LEGO Creator Expert 10272',
    productSku: 'LEGO-272',
    quantity: 1,
    unitPrice: 6500000,
    totalPrice: 6500000,
    reason: 'missing_parts',
    reasonDetails: 'Thiếu 3 chi tiết nhỏ trong hộp',
    requestDate: new Date('2026-02-16'),
    deliveredDate: new Date('2026-02-10'),
    status: 'approved',
    resolutionMethod: 'refund',
    refundMethod: 'original',
    refundAmount: 6500000,
    isHighValue: true,
    isHygieneSensitive: false,
    sealBroken: true,
    processedBy: 'admin@kinderland.vn',
    processedDate: new Date('2026-02-17'),
  },
];

export default function ReturnManagement() {
  const navigate = useNavigate();
  const { adminUser } = useAdmin();
  const [returns, setReturns] = useState<ReturnRequest[]>(mockReturns);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ReturnStatus>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  
  // Process form state
  const [resolutionMethod, setResolutionMethod] = useState<ResolutionMethod>('refund');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('original');
  const [inventoryAction, setInventoryAction] = useState<InventoryAction>('restock');
  const [refundAmount, setRefundAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [staffNote, setStaffNote] = useState('');

  const handleBack = () => {
    if (adminUser?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (adminUser?.role === 'manager') {
      navigate('/manager/dashboard');
    } else {
      navigate('/staff/dashboard');
    }
  };

  const handleViewDetails = (returnReq: ReturnRequest) => {
    setSelectedReturn(returnReq);
    setRefundAmount(returnReq.totalPrice);
    setShippingFee(0);
    setProcessingFee(0);
    setStaffNote('');
    setShowProcessDialog(true);
  };

  const validateReturn = (): boolean => {
    if (!selectedReturn) return false;

    // Check return period (7 days)
    const daysSinceDelivery = Math.floor((new Date().getTime() - selectedReturn.deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 7) {
      toast.error('Đã quá thời hạn 7 ngày để trả hàng');
      return false;
    }

    // BR-62: Hygiene-sensitive items with broken seal
    if (selectedReturn.isHygieneSensitive && selectedReturn.sealBroken) {
      toast.error('BR-62: Sản phẩm vệ sinh nhạy cảm (gấu bông, đồ chơi nhai) không thể trả sau khi mở seal');
      return false;
    }

    // BR-65: High-value items need senior manager approval
    if (selectedReturn.isHighValue && adminUser?.role !== 'admin') {
      toast.error('BR-65: Sản phẩm giá trị cao (>5,000,000đ) cần chữ ký điện tử của Senior Manager');
      return false;
    }

    return true;
  };

  const calculateRefund = () => {
    if (!selectedReturn) return 0;

    let finalAmount = selectedReturn.totalPrice;

    // Deduct shipping fee if customer's fault
    if (['change_mind'].includes(selectedReturn.reason)) {
      finalAmount -= shippingFee;
    }

    // Apply depreciation fee if seal broken on non-defect items
    if (selectedReturn.sealBroken && !['defect', 'wrong_item', 'damaged'].includes(selectedReturn.reason)) {
      finalAmount -= processingFee;
    }

    // BR-63: Handle bundle items
    if (selectedReturn.bundleInfo?.isBundleItem && selectedReturn.bundleInfo.originalBundleDiscount) {
      // Recalculate based on prorated price
      const prorated = selectedReturn.totalPrice + selectedReturn.bundleInfo.originalBundleDiscount;
      finalAmount = prorated - shippingFee - processingFee;
    }

    return Math.max(finalAmount, 0);
  };

  const handleApproveReturn = () => {
    if (!selectedReturn || !validateReturn()) return;

    const finalRefundAmount = calculateRefund();

    // Update return status
    const updatedReturn: ReturnRequest = {
      ...selectedReturn,
      status: resolutionMethod === 'refund' ? 'approved' : 'exchanged',
      resolutionMethod,
      refundMethod,
      refundAmount: finalRefundAmount,
      shippingFee,
      processingFee,
      inventoryAction,
      staffNote,
      processedBy: adminUser?.email,
      processedDate: new Date(),
    };

    setReturns(returns.map(r => r.id === selectedReturn.id ? updatedReturn : r));

    // Log audit trail
    console.log('Audit Trail:', {
      action: 'APPROVE_RETURN',
      returnId: selectedReturn.id,
      orderId: selectedReturn.orderId,
      resolutionMethod,
      refundAmount: finalRefundAmount,
      inventoryAction,
      processedBy: adminUser?.email,
      timestamp: new Date(),
      proofImages: selectedReturn.proofImages,
    });

    // BR-64: Deduct loyalty points
    if (resolutionMethod === 'refund') {
      console.log('Deducting loyalty points earned from purchase');
    }

    toast.success(
      resolutionMethod === 'refund' 
        ? `Đã duyệt yêu cầu hoàn tiền ${finalRefundAmount.toLocaleString()}đ` 
        : 'Đã duyệt yêu cầu đổi hàng'
    );
    setShowProcessDialog(false);
  };

  const handleRejectReturn = () => {
    if (!selectedReturn) return;

    if (confirm('Bạn có chắc chắn muốn từ chối yêu cầu trả hàng này?')) {
      setReturns(returns.map(r => 
        r.id === selectedReturn.id 
          ? { ...r, status: 'rejected' as ReturnStatus, processedBy: adminUser?.email, processedDate: new Date(), staffNote }
          : r
      ));

      console.log('Audit Trail:', {
        action: 'REJECT_RETURN',
        returnId: selectedReturn.id,
        reason: staffNote,
        processedBy: adminUser?.email,
        timestamp: new Date(),
      });

      toast.success('Đã từ chối yêu cầu trả hàng');
      setShowProcessDialog(false);
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || ret.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ReturnStatus) => {
    const styles = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Chờ duyệt' },
      approved: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle2, label: 'Đã duyệt' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Từ chối' },
      refunded: { bg: 'bg-green-50', text: 'text-green-700', icon: DollarSign, label: 'Đã hoàn tiền' },
      exchanged: { bg: 'bg-purple-50', text: 'text-purple-700', icon: RefreshCw, label: 'Đã đổi hàng' },
    };
    const style = styles[status];
    const Icon = style.icon;
    return (
      <Badge className={`${style.bg} ${style.text} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {style.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: ReturnReason) => {
    const labels = {
      defect: 'Lỗi sản xuất',
      wrong_item: 'Giao sai hàng',
      change_mind: 'Đổi ý',
      damaged: 'Hư hỏng trong vận chuyển',
      missing_parts: 'Thiếu chi tiết',
    };
    return labels[reason];
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Xử lý Hoàn trả</h1>
                <p className="text-sm text-gray-600">UC-24: Process Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chờ duyệt</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {returns.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã duyệt</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {returns.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã hoàn tiền</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {returns.filter(r => r.status === 'refunded').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Từ chối</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {returns.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo mã đơn, tên khách hàng hoặc SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full md:w-48 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  <SelectItem value="exchanged">Đã đổi hàng</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Returns List */}
        <div className="space-y-4">
          {filteredReturns.map((ret) => (
            <Card key={ret.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Archive className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{ret.id}</h3>
                        {getStatusBadge(ret.status)}
                        {ret.isHighValue && (
                          <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Giá trị cao
                          </Badge>
                        )}
                        {ret.isHygieneSensitive && (
                          <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">
                            Vệ sinh nhạy cảm
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Đơn hàng: <span className="font-medium text-gray-900">{ret.orderId}</span></p>
                          <p className="text-gray-600">Khách hàng: <span className="font-medium text-gray-900">{ret.customer}</span></p>
                          <p className="text-gray-600">SĐT: <span className="font-medium text-gray-900">{ret.phone}</span></p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sản phẩm: <span className="font-medium text-gray-900">{ret.productName}</span></p>
                          <p className="text-gray-600">SKU: <span className="font-mono text-gray-900">{ret.productSku}</span></p>
                          <p className="text-gray-600">Số lượng: <span className="font-medium text-gray-900">{ret.quantity}</span></p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-1">Lý do: {getReasonLabel(ret.reason)}</p>
                        <p className="text-sm text-gray-700">{ret.reasonDetails}</p>
                      </div>
                      {ret.proofImages && ret.proofImages.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <ImageIcon className="w-4 h-4" />
                          <span>{ret.proofImages.length} ảnh bằng chứng</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-gray-900 mb-2">{ret.totalPrice.toLocaleString()}đ</p>
                    {ret.status === 'pending' && (
                      <Button 
                        onClick={() => handleViewDetails(ret)}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xử lý
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Business Rules */}
        <Card className="mt-8 border border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Business Rules - Quy tắc nghiệp vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-gray-900 font-semibold">BR-62:</span>
                  <p>Sản phẩm vệ sinh nhạy cảm không trả sau khi mở seal</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-gray-900 font-semibold">BR-63:</span>
                  <p>Trả từng món trong combo sẽ tính lại giá prorated</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-gray-900 font-semibold">BR-64:</span>
                  <p>Điểm thưởng sẽ bị trừ khi hoàn tiền</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-gray-900 font-semibold">BR-65:</span>
                  <p>Sản phẩm {'>'}5 triệu cần chữ ký Senior Manager</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Return Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Xử lý yêu cầu hoàn trả {selectedReturn?.id}</DialogTitle>
            <DialogDescription className="text-gray-600">
              Kiểm tra tình trạng sản phẩm và quyết định phương thức xử lý
            </DialogDescription>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4">
              {/* Customer & Product Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Khách hàng</p>
                  <p className="font-semibold text-gray-900">{selectedReturn.customer}</p>
                  <p className="text-sm text-gray-600">{selectedReturn.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sản phẩm</p>
                  <p className="font-semibold text-gray-900">{selectedReturn.productName}</p>
                  <p className="text-sm font-mono text-gray-600">{selectedReturn.productSku}</p>
                </div>
              </div>

              {/* Resolution Method */}
              <div className="space-y-2">
                <Label className="text-gray-900">Phương thức xử lý *</Label>
                <RadioGroup value={resolutionMethod} onValueChange={(value: ResolutionMethod) => setResolutionMethod(value)}>
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                    <RadioGroupItem value="refund" id="refund" />
                    <Label htmlFor="refund" className="flex-1 cursor-pointer text-gray-900">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Hoàn tiền (Refund)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Trả lại tiền cho khách hàng</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                    <RadioGroupItem value="exchange" id="exchange" />
                    <Label htmlFor="exchange" className="flex-1 cursor-pointer text-gray-900">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>Đổi hàng (Exchange)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Đổi sản phẩm mới cùng loại</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {resolutionMethod === 'refund' && (
                <>
                  {/* Refund Method */}
                  <div className="space-y-2">
                    <Label className="text-gray-900">Hình thức hoàn tiền *</Label>
                    <RadioGroup value={refundMethod} onValueChange={(value: RefundMethod) => setRefundMethod(value)}>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <RadioGroupItem value="original" id="original" />
                        <Label htmlFor="original" className="flex-1 cursor-pointer text-gray-900">
                          Hoàn về phương thức thanh toán gốc
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                        <RadioGroupItem value="store_credit" id="store_credit" />
                        <Label htmlFor="store_credit" className="flex-1 cursor-pointer text-gray-900">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            <span>Chuyển thành điểm thưởng (Store Credit)</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Alternative Flow 4.1</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Refund Calculation */}
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Giá sản phẩm:</span>
                      <span className="font-semibold text-gray-900">{selectedReturn.totalPrice.toLocaleString()}đ</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">Phí vận chuyển:</span>
                        <Input
                          type="number"
                          value={shippingFee}
                          onChange={(e) => setShippingFee(Number(e.target.value))}
                          className="w-32 h-8 text-sm border-gray-300"
                        />
                      </div>
                      <span className="text-red-600">-{shippingFee.toLocaleString()}đ</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">Phí xử lý/giảm giá:</span>
                        <Input
                          type="number"
                          value={processingFee}
                          onChange={(e) => setProcessingFee(Number(e.target.value))}
                          className="w-32 h-8 text-sm border-gray-300"
                        />
                      </div>
                      <span className="text-red-600">-{processingFee.toLocaleString()}đ</span>
                    </div>
                    <div className="pt-3 border-t border-blue-300 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Số tiền hoàn lại:</span>
                      <span className="text-2xl font-bold text-gray-900">{calculateRefund().toLocaleString()}đ</span>
                    </div>
                  </div>
                </>
              )}

              {/* Inventory Action */}
              <div className="space-y-2">
                <Label className="text-gray-900">Xử lý hàng tồn kho *</Label>
                <RadioGroup value={inventoryAction} onValueChange={(value: InventoryAction) => setInventoryAction(value)}>
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                    <RadioGroupItem value="restock" id="restock" />
                    <Label htmlFor="restock" className="flex-1 cursor-pointer text-gray-900">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>Nhập lại kho (Restock)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Sản phẩm còn bán được</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                    <RadioGroupItem value="damaged" id="damaged" />
                    <Label htmlFor="damaged" className="flex-1 cursor-pointer text-gray-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Thanh lý (Damaged/Discard)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Sản phẩm lỗi, không bán được</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Staff Note */}
              <div className="space-y-2">
                <Label className="text-gray-900">Ghi chú của nhân viên</Label>
                <Textarea
                  placeholder="Nhập ghi chú về tình trạng sản phẩm, lý do phê duyệt/từ chối..."
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  rows={3}
                  className="border-gray-300"
                />
              </div>

              {/* Warnings */}
              {selectedReturn.sealBroken && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Seal đã bị mở</p>
                    <p>Có thể áp dụng phí giảm giá nếu không phải lỗi từ shop</p>
                  </div>
                </div>
              )}
              
              {selectedReturn.isHighValue && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">BR-65: Sản phẩm giá trị cao</p>
                    <p>Yêu cầu chữ ký điện tử của Senior Manager để hoàn tiền</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleRejectReturn} className="border-gray-300">
              <XCircle className="w-4 h-4 mr-2" />
              Từ chối
            </Button>
            <Button onClick={handleApproveReturn} className="bg-gray-900 hover:bg-gray-800 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
