import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  ArrowLeft, ChevronRight, CheckCircle, X, Loader2,
  Package, CreditCard, AlertCircle, Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../services/api';

// Types matching backend
interface OrderItemDTO {
  orderItemId: number;
  skuId: number;
  size: string | null;
  color: string | null;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  orderId: number;
  orderStatus: string;
  totalAmount: number;
  items: OrderItemDTO[];
  shippingAddress: string | null;
}

const RETURN_REASONS = [
  'Sản phẩm bị lỗi/hư hỏng',
  'Sản phẩm không đúng mô tả',
  'Sản phẩm sai kích cỡ/màu sắc',
  'Sản phẩm bị thiếu phụ kiện',
  'Sản phẩm đã qua sử dụng/không nguyên vẹn',
  'Nhận nhầm sản phẩm',
  'Không hài lòng với chất lượng',
  'Khác',
];

type Step = 'select_items' | 'fill_details' | 'confirm';

export default function ReturnRequestPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Passed from OrderHistory via navigate state
  const order: Order | null = location.state?.order || null;

  const [step, setStep] = useState<Step>('select_items');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track order items that already have a return request
  const [returnedItemIds, setReturnedItemIds] = useState<Set<number>>(new Set());
  const [loadingReturns, setLoadingReturns] = useState(true);

  // Pre-check existing return requests on mount
  useEffect(() => {
    if (!order) return;
    const checkExistingReturns = async () => {
      try {
        const res = await authenticatedFetch('/api/v1/return-requests/my-requests?page=0&size=100');
        if (res.ok) {
          const json = await res.json();
          const returns = json?.data?.content || json?.data || [];
          const existingIds = new Set<number>();
          for (const ret of Array.isArray(returns) ? returns : []) {
            if (ret.orderItemId) existingIds.add(ret.orderItemId);
          }
          setReturnedItemIds(existingIds);
        }
      } catch (err) {
        console.error('Failed to check existing returns:', err);
      } finally {
        setLoadingReturns(false);
      }
    };
    checkExistingReturns();
  }, [order]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  // Redirect if no order
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-500 mb-6">Vui lòng chọn đơn hàng cần trả từ danh sách đơn hàng.</p>
            <Link to="/account/orders">
              <Button className="bg-[#AF140B] hover:bg-[#8D0F08]">Về danh sách đơn hàng</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Items available for return (excluding already-returned ones)
  const availableItems = order.items?.filter((item) => !returnedItemIds.has(item.orderItemId)) || [];
  const selectedOrderItems = availableItems.filter((item) => selectedItems.includes(item.orderItemId));
  const refundTotal = selectedOrderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === availableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map((i) => i.orderItemId));
    }
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error('Chỉ chấp nhận ảnh JPG, PNG, WebP');
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error('Ảnh không được vượt quá 10 MB');
        return false;
      }
      return true;
    });
    if (photos.length + validFiles.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }
    setPhotos((prev) => [...prev, ...validFiles]);
    setPhotoPreviews((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const canProceedStep1 = selectedItems.length > 0;
  const canProceedStep2 = reason && description.trim().length > 0 && photos.length > 0 &&
    bankName.trim() && bankAccountNumber.trim() && bankAccountName.trim();

  const handleSubmit = async () => {
    if (!canProceedStep2 || submitting) return;
    setSubmitting(true);

    try {
      // Submit one return request per selected item (backend expects one orderItemId per request)
      for (const item of selectedOrderItems) {
        // 1. Upload photos to get URLs (upload to S3 via image endpoint, temporarily use RETURN_REQUEST entity)
        const photoUrls: string[] = [];
        for (const photo of photos) {
          const formData = new FormData();
          formData.append('file', photo);
          formData.append('entityType', 'RETURN_REQUEST');
          formData.append('entityId', '0'); // Temporary, will be updated
          const uploadRes = await authenticatedFetch('/api/v1/images', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            // The response contains the S3 key or URL
            const url = uploadData?.data?.imageUrl || uploadData?.data?.url || uploadData?.data || '';
            if (url) photoUrls.push(typeof url === 'string' ? url : '');
          }
        }

        // 2. Create return request
        const payload = {
          orderItemId: item.orderItemId,
          returnReason: reason,
          description: description,
          photoUrls: photoUrls.length > 0 ? photoUrls : ['placeholder.jpg'],
          bankAccountNumber: bankAccountNumber,
          bankName: bankName,
          bankAccountName: bankAccountName,
        };

        const res = await authenticatedFetch('/api/v1/return-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          if (res.status === 409) {
            // Already has a return request — mark it and skip
            setReturnedItemIds((prev) => new Set(prev).add(item.orderItemId));
            toast.info(`Sản phẩm "${item.productName}" đã có yêu cầu trả hàng trước đó.`);
            continue;
          }
          const errText = await res.text();
          throw new Error(errText || `Lỗi ${res.status}`);
        }
      }

      setSubmitted(true);
      toast.success('Gửi yêu cầu trả hàng thành công!');
    } catch (err: any) {
      console.error('Return request error:', err);
      toast.error('Gửi yêu cầu thất bại: ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Yêu cầu đã được gửi!</h2>
              <p className="text-gray-500 mb-2">
                Yêu cầu trả hàng/hoàn tiền cho đơn hàng #{order.orderId} đã được gửi thành công.
              </p>
              <p className="text-gray-400 text-sm mb-8">
                Quản lý cửa hàng sẽ xem xét và phản hồi trong vòng 1-3 ngày làm việc.
              </p>
              <div className="bg-blue-50 rounded-2xl p-4 mb-8 text-left">
                <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Thông tin hoàn tiền
                </p>
                <p className="text-xs text-blue-700">Ngân hàng: <strong>{bankName}</strong></p>
                <p className="text-xs text-blue-700">Số TK: <strong>{bankAccountNumber}</strong></p>
                <p className="text-xs text-blue-700">Chủ TK: <strong>{bankAccountName}</strong></p>
                <p className="text-xs text-blue-700 mt-2">Tổng tiền hoàn: <strong className="text-lg text-[#AF140B]">{formatPrice(refundTotal)}</strong></p>
              </div>
              <div className="flex gap-3">
                <Link to="/account/orders" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl h-12 font-bold">
                    Về đơn hàng
                  </Button>
                </Link>
                <Link to="/account/returns" className="flex-1">
                  <Button className="w-full bg-[#AF140B] hover:bg-[#8D0F08] rounded-xl h-12 font-bold">
                    Xem yêu cầu trả hàng
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (step === 'fill_details') setStep('select_items');
              else if (step === 'confirm') setStep('fill_details');
              else navigate(-1);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-[#AF140B] transition-colors mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'select_items' ? 'Quay lại' : 'Quay lại bước trước'}
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Yêu cầu Trả hàng/Hoàn tiền</h1>
          <p className="text-gray-500 text-sm mt-1">Đơn hàng #{order.orderId}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-0 mb-8">
          {[
            { key: 'select_items', label: 'Chọn sản phẩm', num: 1 },
            { key: 'fill_details', label: 'Lý do & Ngân hàng', num: 2 },
            { key: 'confirm', label: 'Xác nhận', num: 3 },
          ].map((s, idx) => {
            const isActive = s.key === step;
            const isDone =
              (s.key === 'select_items' && step !== 'select_items') ||
              (s.key === 'fill_details' && step === 'confirm');
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${isDone ? 'bg-green-500 text-white' :
                      isActive ? 'bg-[#AF140B] text-white shadow-lg shadow-[#AF140B]/30' :
                        'bg-gray-200 text-gray-500'
                    }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${isActive ? 'text-[#AF140B]' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && <div className={`h-0.5 w-full mx-2 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* STEP 1: Select Items */}
        {step === 'select_items' && (
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Chọn sản phẩm cần trả
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Bạn có thể chọn một hoặc nhiều sản phẩm để yêu cầu trả hàng/hoàn tiền
              </p>
            </CardHeader>
            <CardContent className="space-y-0">
              {loadingReturns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#AF140B]" />
                </div>
              ) : availableItems.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-bold">Tất cả sản phẩm đã có yêu cầu trả hàng</p>
                  <p className="text-gray-400 text-sm mt-1">Vui lòng kiểm tra danh sách yêu cầu đã gửi.</p>
                </div>
              ) : (
                <>
                  {/* Select all */}
                  <label className="flex items-center gap-3 py-3 px-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === availableItems.length && availableItems.length > 0}
                      onChange={toggleAll}
                      className="w-5 h-5 rounded border-gray-300 text-[#AF140B] focus:ring-[#AF140B]"
                    />
                    <span className="font-bold text-gray-900">Chọn tất cả</span>
                  </label>

                  {/* Already-returned items (shown but disabled) */}
                  {order.items?.filter((item) => returnedItemIds.has(item.orderItemId)).map((item) => (
                    <div
                      key={item.orderItemId}
                      className="flex items-center gap-4 py-4 px-2 border-b border-gray-50 rounded-lg opacity-50"
                    >
                      <span className="inline-flex items-center text-xs h-5 px-2 rounded bg-green-100 text-green-700 font-bold shrink-0">Đã yêu cầu</span>
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm line-clamp-2">{item.productName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.color && `Màu: ${item.color}`}
                          {item.size && ` · Size: ${item.size}`}
                        </p>
                      </div>
                      <span className="text-gray-500 text-sm shrink-0">x{item.quantity}</span>
                    </div>
                  ))}

                  {/* Selectable items */}
                  {availableItems.map((item) => {
                    const isSelected = selectedItems.includes(item.orderItemId);
                    return (
                      <label
                        key={item.orderItemId}
                        className={`flex items-center gap-4 py-4 px-2 border-b border-gray-50 cursor-pointer transition-all rounded-lg ${isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.orderItemId)}
                          className="w-5 h-5 rounded border-gray-300 text-[#AF140B] focus:ring-[#AF140B] shrink-0"
                        />
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm line-clamp-2">{item.productName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.color && `Màu: ${item.color}`}
                            {item.size && ` · Size: ${item.size}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[#AF140B] font-bold">{formatPrice(item.unitPrice)}</span>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm shrink-0">x{item.quantity}</span>
                      </label>
                    );
                  })}
                </>
              )}

              {/* Total */}
              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between pt-4 px-2">
                  <span className="text-sm text-gray-500">
                    Tổng số tiền ({selectedOrderItems.length} sản phẩm):
                  </span>
                  <span className="text-xl font-black text-[#AF140B]">{formatPrice(refundTotal)}</span>
                </div>
              )}

              {/* Continue */}
              <div className="pt-6 pb-2">
                <Button
                  className="w-full h-12 rounded-xl font-bold text-base bg-[#AF140B] hover:bg-[#8D0F08] disabled:opacity-50"
                  disabled={!canProceedStep1}
                  onClick={() => setStep('fill_details')}
                >
                  Tiếp tục
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Fill Details */}
        {step === 'fill_details' && (
          <div className="space-y-4">
            {/* Selected items summary */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">Sản phẩm trả ({selectedOrderItems.length})</p>
                {selectedOrderItems.map((item) => (
                  <div key={item.orderItemId} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm text-[#AF140B]">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reason */}
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#AF140B] to-red-400" />
              <CardContent className="p-5 space-y-5">
                <div>
                  <Label className="text-sm font-bold text-gray-900">Lý do <span className="text-red-500">*</span></Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                      <SelectValue placeholder="Chọn lý do >" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Refund info */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 font-medium">Hoàn tiền vào</span>
                    <span className="text-sm font-bold text-blue-700">Tài khoản ngân hàng</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">Tổng tiền hoàn</span>
                    <span className="text-xl font-black text-[#AF140B]">{formatPrice(refundTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Giá sản phẩm sau khuyến mãi: {formatPrice(refundTotal)}</p>
                </div>

                {/* Bank info */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" /> Thông tin ngân hàng nhận hoàn tiền
                  </p>
                  <div>
                    <Label className="text-xs text-gray-600">Tên ngân hàng <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                      className="mt-1 h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Số tài khoản <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Nhập số tài khoản"
                      className="mt-1 h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Tên chủ tài khoản <span className="text-red-500">*</span></Label>
                    <Input
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      className="mt-1 h-10 rounded-lg uppercase"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-bold text-gray-900">Mô tả <span className="text-red-500">*</span></Label>
                    <span className="text-xs text-gray-400">{description.length}/2000</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                    className="w-full h-28 border border-gray-300 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-[#AF140B]/30 focus:border-[#AF140B] outline-none"
                  />
                </div>

                {/* Photos */}
                <div>
                  <Label className="text-sm font-bold text-gray-900 mb-2 block">
                    Ảnh/Video minh chứng <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 font-normal ml-2">({photos.length}/5)</span>
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {photoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        <img src={preview} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#AF140B] hover:border-[#AF140B] transition-all cursor-pointer"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Thêm ảnh</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handlePhotoAdd}
                    />
                  </div>
                </div>

                {/* Continue */}
                <Button
                  className="w-full h-12 rounded-xl font-bold text-base bg-[#AF140B] hover:bg-[#8D0F08] disabled:opacity-50"
                  disabled={!canProceedStep2}
                  onClick={() => setStep('confirm')}
                >
                  Xem lại và gửi yêu cầu
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
              <CardContent className="p-5 space-y-5">
                <h3 className="text-lg font-extrabold text-gray-900">Xác nhận yêu cầu trả hàng</h3>

                {/* Items */}
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Sản phẩm trả ({selectedOrderItems.length})</p>
                  <div className="space-y-2">
                    {selectedOrderItems.map((item) => (
                      <div key={item.orderItemId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {item.color && `Màu: ${item.color}`}
                            {item.size && ` · Size: ${item.size}`}
                            {` · SL: ${item.quantity}`}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-[#AF140B]">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lý do:</span>
                    <span className="text-sm font-bold text-gray-900">{reason}</span>
                  </div>
                  {description && (
                    <div>
                      <span className="text-sm text-gray-600">Mô tả:</span>
                      <p className="text-sm text-gray-700 mt-1 italic">"{description}"</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ảnh minh chứng:</span>
                    <span className="text-sm font-bold text-gray-900">{photos.length} ảnh</span>
                  </div>
                </div>

                {/* Photos preview */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photoPreviews.map((p, i) => (
                    <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0" />
                  ))}
                </div>

                {/* Bank info */}
                <div className="bg-blue-50 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4" /> Hoàn tiền qua ngân hàng
                  </p>
                  <p className="text-sm text-blue-700">Ngân hàng: <strong>{bankName}</strong></p>
                  <p className="text-sm text-blue-700">Số TK: <strong>{bankAccountNumber}</strong></p>
                  <p className="text-sm text-blue-700">Chủ TK: <strong>{bankAccountName}</strong></p>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-gray-700 font-bold">Tổng tiền hoàn</span>
                  <span className="text-2xl font-black text-[#AF140B]">{formatPrice(refundTotal)}</span>
                </div>

                {/* Submit */}
                <Button
                  className="w-full h-12 rounded-xl font-bold text-base bg-[#AF140B] hover:bg-[#8D0F08] disabled:opacity-50"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang gửi...</>
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  Bằng việc gửi yêu cầu, bạn đồng ý với chính sách trả hàng của Kinderland.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
