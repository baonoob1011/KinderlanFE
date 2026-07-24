import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../../context/AppContext';
import { CreditCard, Truck, AlertCircle, Loader2, Plus, Coins, Tag } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { accountApi, AddressRequest } from '../../services/accountApi';
import { loyaltyApi } from '../../services/loyaltyApi';
import { walletApi } from '../../services/walletApi';
import WalletTopUpDialog from '../customer/WalletTopUpDialog';

const EMPTY_ADDRESS: AddressRequest = {
  street: '',
  provinceId: '',
  provinceName: '',
  districtId: '',
  districtName: '',
  wardId: '',
  wardName: '',
};

export default function Checkout() {
  const { cart, user, voucher, applyVoucher, removeVoucher, removeFromCart } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Use selectedItems if passed from Cart, otherwise fallback to full cart
  const displayItems = location.state?.selectedItems || cart;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || user?.username || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState<AddressRequest>({ ...EMPTY_ADDRESS });
  const [addressSaving, setAddressSaving] = useState(false);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  /** Subtotal gần nhất đã được gửi đi validate lại — chặn bắn trùng request. */
  const revalidatedSubtotalRef = useRef<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK' | 'CARD' | 'WALLET'>('COD');

  // Loyalty points state
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

  // Wallet balance — hiển thị ở option "Ví Kinderland" + disable option khi không đủ tiền.
  // Số dư CHỈ để hiển thị/disable; số tiền thanh toán thật do backend tự tính khi checkout
  // (xem handlePlaceOrder — payload không gửi amount).
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWalletLoading(false);
      return;
    }
    setWalletLoading(true);
    try {
      const data = await walletApi.getMyWallet();
      setWalletBalance(data.balance);
    } catch {
      setWalletBalance(null);
    } finally {
      setWalletLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  /**
   * Khách nạp tiền xong quay lại tab checkout: số dư trong state vẫn là số CŨ (trước khi nạp),
   * nên option "Ví Kinderland" sẽ vẫn hiện thiếu tiền dù ví đã đủ. Hỏi lại số dư mỗi khi trang
   * được hiển thị lại — giỏ hàng và các lựa chọn khác giữ nguyên vì không hề reload trang.
   */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchWallet();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [fetchWallet]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.getMyAddresses();
        const addrList = res.data || res || [];
        setAddresses(addrList);

        // Auto select default or first address
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a: any) => a.isDefault) || addrList[0];
          setSelectedAddressId(defaultAddr.addressId || defaultAddr.id);
          setAddingAddress(false);
        } else {
          setAddingAddress(true);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        toast.error("Không thể lấy danh sách địa chỉ.");
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (user) {
      fetchAddresses();
    } else {
      setLoadingAddresses(false);
    }
  }, [user]);

  // Fetch loyalty points
  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const data = await loyaltyApi.getMyPoints();
        setLoyaltyPoints(data.totalPoints ?? 0);
      } catch {
        setLoyaltyPoints(0);
      } finally {
        setLoyaltyLoading(false);
      }
    };
    if (user) fetchLoyalty();
    else setLoyaltyLoading(false);
  }, [user]);

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddressForm({ ...newAddressForm, [e.target.name]: e.target.value });
  };

  const submitNewAddress = async () => {
    if (!newAddressForm.street.trim() || !newAddressForm.provinceName.trim() || !newAddressForm.districtName.trim() || !newAddressForm.wardName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ!');
      return;
    }
    setAddressSaving(true);
    try {
      await accountApi.addAddress(newAddressForm);
      toast.success('Thêm địa chỉ thành công!');
      setNewAddressForm({ ...EMPTY_ADDRESS });
      
      const res = await api.getMyAddresses();
      const addrList = res.data || res || [];
      setAddresses(addrList);
      
      if (addrList.length > 0) {
        const newAddr = addrList[addrList.length - 1];
        setSelectedAddressId(newAddr.addressId || newAddr.id);
        setAddingAddress(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Thêm địa chỉ thất bại');
    } finally {
      setAddressSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const subtotal = useMemo(
    () =>
      displayItems.reduce((sum: number, item: any) => {
        // Robust price mapping matching Cart.tsx
        const sku = item.skuResponse || item.sku || {};
        const product = item.productResponse || sku.productResponse || item.product || {};
        // Giá có thể về dạng chuỗi ("599000") từ BigDecimal — Number() để không nối chuỗi.
        const price = Number(
          sku.price ?? item.price ?? item.unitPrice ?? product.minPrice ?? product.price ?? item.productPrice ?? 0
        );
        return sum + price * Number(item.quantity || 1);
      }, 0),
    [displayItems]
  );

  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  // Số tiền giảm do BACKEND tính (promotionApi.validateCode) — FE không tự nhân percent nữa.
  const discount = voucher ? Number(voucher.discountAmount) || 0 : 0;

  // Loyalty points discount: capped at 50% of subtotal and available points
  const maxLoyaltyDiscount = Math.floor(subtotal * 0.5); // 50% cap
  const loyaltyDiscount = useLoyaltyPoints
    ? Math.min(loyaltyPoints, maxLoyaltyDiscount)
    : 0;

  const total = Math.max(0, subtotal + shippingFee - discount - loyaltyDiscount);

  // Nếu đang chọn Ví mà tổng tiền tăng lên (đổi voucher, bỏ điểm...) khiến số dư không còn đủ,
  // tự chuyển về COD thay vì để nút "Đặt hàng" âm thầm thất bại vì lý do khách không thấy rõ.
  useEffect(() => {
    if (paymentMethod === 'WALLET' && walletBalance !== null && walletBalance < total) {
      setPaymentMethod('COD');
      toast.warning('Số dư ví không còn đủ cho đơn này, đã chuyển về Thanh toán khi nhận hàng.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const handleApplyVoucher = async () => {
    setVoucherError('');
    setApplyingVoucher(true);
    try {
      const result = await applyVoucher(voucherCode, subtotal);
      if (result.success) {
        setVoucherCode('');
        toast.success('Áp dụng mã giảm giá thành công!');
      } else {
        // Hiển thị đúng lý do từ backend (hết hạn / hết lượt / chưa đủ điều kiện...)
        setVoucherError(result.message || 'Mã giảm giá không hợp lệ');
      }
    } finally {
      setApplyingVoucher(false);
    }
  };

  /**
   * Giỏ hàng đổi sau khi đã áp mã (xoá bớt sản phẩm, đổi số lượng) làm subtotal đổi theo,
   * nên số tiền giảm cũ không còn đúng. Hỏi lại backend trên subtotal mới; nếu mã không còn
   * đủ điều kiện thì gỡ luôn thay vì giữ mức giảm sai.
   */
  useEffect(() => {
    if (!voucher || subtotal <= 0) return;
    if (Number(voucher.subtotal) === subtotal) return;

    // applyVoucher được tạo mới mỗi lần AppProvider render, nên nếu để nó trong dependency
    // thì effect chạy lại liên tục và bắn trùng request khi request trước chưa xong.
    // Ref này chốt "đã gửi cho subtotal nào" để mỗi giá trị subtotal chỉ validate đúng 1 lần.
    if (revalidatedSubtotalRef.current === subtotal) return;
    revalidatedSubtotalRef.current = subtotal;

    const code = voucher.code;
    (async () => {
      const result = await applyVoucher(code, subtotal);
      if (!result.success) {
        setVoucherError(result.message || 'Mã giảm giá không còn áp dụng được cho đơn này');
        toast.warning(`Đã gỡ mã ${code}: ${result.message || 'không còn hợp lệ'}`);
      }
    })();
  }, [subtotal, voucher]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      toast.error("Vui lòng thêm và chọn địa chỉ giao hàng!");
      return;
    }

    setIsPlacingOrder(true);
    const loadingToast = toast.loading("Đang xử lý đặt hàng...");

    try {
      // 1. Prepare items
      const items = displayItems.map((item: any) => {
        const sku = item.skuResponse || item.sku || {};
        const skuId = sku.id || item.skuId || item.idSku || item.product?.skuId;
        return {
          skuId: skuId,
          quantity: item.quantity
        };
      });

      // 2. Prepare storeId (fallback to 1 or from first item)
      // Try multiple possible paths for storeId
      const storeId = displayItems[0]?.storeId || displayItems[0]?.idStore || displayItems[0]?.store?.id || 1;

      // 3. Call API
      // 3. Call API — GỬI KÈM mã khuyến mãi. Thiếu tham số này chính là lý do đơn luôn được
      // tạo với giá gốc dù giao diện đã hiện "đã áp voucher".
      console.log("Placing order from cart:", {
        selectedAddressId, storeId, itemsCount: items.length, promotionCode: voucher?.code,
      });
      const orderRes = await api.createOrder(selectedAddressId, storeId, items, voucher?.code);

      // Extract orderId from response - assuming it's in data or data.id
      const orderId = orderRes.data?.orderId || orderRes.data?.id || orderRes.orderId || orderRes.id;

      // Số tiền HIỂN THỊ ở màn thành công lấy từ đơn backend đã chốt, không lấy `total` FE tự tính,
      // để hai bên không thể lệch nhau.
      const createdOrder = orderRes.data ?? orderRes;
      const serverFinalAmount = Number(createdOrder?.finalAmount ?? createdOrder?.totalAmount ?? NaN);
      const confirmedTotal = Number.isFinite(serverFinalAmount) ? serverFinalAmount : total;

      if (!orderId) {
        console.warn("Could not find orderId in response:", orderRes);
      }

      // 5. Selective Cart Cleanup: Only remove items that were actually ordered
      // We do this BEFORE potentially redirecting to a payment gateway
      const itemsToRemove = [...displayItems];
      console.log("Cart clearing for ordered items:", itemsToRemove.length);
      
      // Use Promise.all to handle removals concurrently
      await Promise.all(itemsToRemove.map(async (item) => {
        const cartItemId = item.id || item.cartItemId || item.idCart || item.cartId;
        if (cartItemId) {
          try {
            await removeFromCart(cartItemId);
          } catch (err) {
            console.error(`Failed to remove item ${cartItemId} from cart:`, err);
          }
        }
      }));

      // 6. Always call checkout to handle payment method + loyalty points
      // KHÔNG dùng ternary fallback: `x === 'CARD' ? 'VNPAY' : 'COD'` biến MỌI giá trị lạ
      // (kể cả 'BANK' hoặc typo) thành COD một cách âm thầm — người dùng tưởng đã chọn
      // thanh toán online nhưng đơn lại được tạo là COD.
      const mapPaymentMethod = (ui: 'COD' | 'BANK' | 'CARD' | 'WALLET'): 'COD' | 'VNPAY' | 'WALLET' => {
        switch (ui) {
          case 'COD':
            return 'COD';
          case 'CARD':
            return 'VNPAY';
          case 'WALLET':
            return 'WALLET';
          default:
            throw new Error('Phương thức thanh toán không được hỗ trợ');
        }
      };
      const checkoutPaymentMethod = mapPaymentMethod(paymentMethod);
      try {
        // Payload CHỈ có paymentMethod + pointsToUse (loyaltyDiscount ở đây chỉ để backend biết
        // SỐ ĐIỂM muốn dùng, không phải số tiền — số tiền cuối cùng backend tự chốt lại toàn bộ
        // từ order đã lưu, WALLET không hề khác VNPAY/COD ở khoản này).
        const checkoutRes = await api.checkoutOrder(orderId, checkoutPaymentMethod, loyaltyDiscount);

        if (paymentMethod === 'CARD') {
          toast.dismiss(loadingToast);
          // Backend trả BaseResponse<CheckoutResponse>:
          //   { success, data: { orderId, paymentMethod, paymentStatus, paymentUrl, message } }
          // data LÀ OBJECT, không phải string. Gán thẳng checkoutRes.data vào location.href
          // khiến trình duyệt điều hướng tới chuỗi "[object Object]".
          const paymentUrl: string | undefined = checkoutRes?.data?.paymentUrl;

          if (checkoutRes.success && paymentUrl) {
            window.location.href = paymentUrl;
            return;
          } else {
            throw new Error("Không lấy được link thanh toán");
          }
        }
        // WALLET (như COD): checkout() ở BE đã trừ ví ĐỒNG BỘ trong request này — nếu tới được
        // đây (không rơi vào catch) nghĩa là đã trừ tiền thành công, rơi xuống khối "success" chung.
      } catch (paymentErr: any) {
        toast.dismiss(loadingToast);
        // Backend trả đúng message "Số dư ví không đủ..." (WALLET_INSUFFICIENT_BALANCE) —
        // hiển thị thẳng thay vì che bằng thông báo lỗi chung, để khách biết cần nạp thêm/đổi
        // phương thức thay vì tưởng hệ thống lỗi.
        toast.error(paymentErr.message || "Lỗi khởi tạo thanh toán. Vui lòng thử lại");
        return;
      }

      // COD: show success toast
      toast.dismiss(loadingToast);
      toast.success("🎉 Đặt hàng thành công!");

      // Build address string from the selected address
      const selectedAddr = addresses.find((a: any) => (a.addressId || a.id) === selectedAddressId);
      const addressStr = selectedAddr
        ? [selectedAddr.street, selectedAddr.wardName, selectedAddr.districtName, selectedAddr.provinceName].filter(Boolean).join(', ')
        : customerInfo.address;

      navigate('/order-success', {
        state: {
          orderInfo: {
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || user?.username || customerInfo.name),
            phone: user?.phone || customerInfo.phone,
            address: addressStr,
            total: Math.max(0, confirmedTotal - loyaltyDiscount),
            paymentMethod,
            orderDate: new Date().toISOString()
          }
        }
      });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Order error:", error);
      toast.error(error.message || "Đặt hàng thất bại. Vui lòng thử lại!");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (displayItems.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-4 backdrop-blur-sm">
            <CreditCard className="size-6" />
            <span className="font-bold text-lg">THANH TOÁN</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Hoàn Tất Đơn Hàng
          </h1>
          <p className="text-xl text-white/90">
            {displayItems.length} sản phẩm trong đơn hàng
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#AF140B] rounded-xl">
                      <Truck className="size-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Thông Tin Giao Hàng
                    </h2>
                  </div>
                  {loadingAddresses && <Loader2 className="animate-spin text-[#AF140B]" />}
                </div>

                {addresses.length > 0 && !addingAddress && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-gray-700">Chọn địa chỉ nhận hàng:</p>
                      <button type="button" onClick={() => setAddingAddress(true)} className="text-[#AF140B] text-sm font-bold flex items-center gap-1 hover:underline">
                        <Plus className="size-4" /> Thêm địa chỉ mới
                      </button>
                    </div>
                    <div className="grid gap-3">
                      {addresses.map((addr) => {
                        const id = addr.addressId || addr.id;
                        const isSelected = selectedAddressId === id;
                        return (
                          <div
                            key={id}
                            onClick={() => setSelectedAddressId(id)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-[#AF140B] bg-[#FFE5E3]' : 'border-gray-200 hover:border-[#AF140B]/30'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <input type="radio" readOnly checked={isSelected} className="mt-1.5 size-4 text-[#AF140B] border-gray-300 focus:ring-[#AF140B]" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-800">
                                    {addr.street || "Địa chỉ"}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] bg-[#AF140B] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {addr.wardName}, {addr.districtName}, {addr.provinceName}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {addingAddress && (
                  <div className="space-y-4">
                    {addresses.length === 0 && !loadingAddresses && (
                      <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl text-orange-700 text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="size-5" />
                        Bạn chưa có địa chỉ giao hàng nào. Vui lòng thêm địa chỉ!
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-[#AF140B]/50">
                      <h3 className="font-bold text-gray-800 mb-3 text-lg">Thêm địa chỉ giao hàng mới</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Số nhà, tên đường *</label>
                          <input type="text" name="street" value={newAddressForm.street} onChange={handleNewAddressChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-[#AF140B] focus:border-[#AF140B]" placeholder="Ví dụ: 123 Đường B" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Tỉnh / Thành phố *</label>
                            <input type="text" name="provinceName" value={newAddressForm.provinceName} onChange={handleNewAddressChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-[#AF140B] focus:border-[#AF140B]" placeholder="TP.HCM" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Quận / Huyện *</label>
                            <input type="text" name="districtName" value={newAddressForm.districtName} onChange={handleNewAddressChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-[#AF140B] focus:border-[#AF140B]" placeholder="Quận 1" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Phường / Xã *</label>
                          <input type="text" name="wardName" value={newAddressForm.wardName} onChange={handleNewAddressChange} className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-[#AF140B] focus:border-[#AF140B]" placeholder="Phường Bến Nghé" />
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button type="button" onClick={submitNewAddress} disabled={addressSaving} className="bg-[#AF140B] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8D0F08] flex items-center gap-2">
                            {addressSaving ? <Loader2 className="size-4 animate-spin" /> : null} Lưu Địa Chỉ
                          </button>
                          {addresses.length > 0 && (
                            <button type="button" onClick={() => setAddingAddress(false)} disabled={addressSaving} className="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg font-bold hover:bg-gray-100 text-gray-600">
                              Hủy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Voucher — khối này trước đây bị comment toàn bộ, nên màn thanh toán KHÔNG có
                  ô nhập mã. Đã bật lại và nối vào luồng validate thật của backend. */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-xl border-2 border-[#AF140B]">
                    <Tag className="size-6 text-[#AF140B]" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Mã Giảm Giá</h2>
                </div>

                {voucher ? (
                  <div className="flex items-center justify-between p-4 bg-[#FFE5E3] border-2 border-[#AF140B] rounded-xl">
                    <div>
                      <p className="font-bold text-[#AF140B] text-lg">
                        Mã: {voucher.code}
                      </p>
                      <p className="text-sm text-gray-600">
                        {voucher.title ? `${voucher.title} — ` : ''}
                        Giảm {formatPrice(discount)}
                        {voucher.discountPercent ? ` (${Number(voucher.discountPercent)}%)` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeVoucher}
                      className="text-red-500 hover:text-red-600 text-sm font-semibold px-3 py-1 hover:bg-red-50 rounded-lg transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          setVoucherError('');
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 bg-white text-gray-800 rounded-xl focus:ring-2 focus:ring-[#AF140B] focus:border-[#AF140B] transition-all font-semibold"
                        placeholder="Nhập mã giảm giá"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={applyingVoucher || !voucherCode.trim()}
                        className="px-6 py-3 bg-[#AF140B] text-white rounded-xl hover:bg-[#8D0F08] transition-all shadow-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {applyingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-semibold">
                        <AlertCircle className="size-4" />
                        {voucherError}
                      </p>
                    )}
                    {/* Danh sách mã cứng cũ (GIAM10/GIAM50K/FREESHIP) đã bỏ: đó là mock ở FE,
                        không tồn tại trong DB nên nhập vào sẽ bị từ chối. Mã thật do trang
                        Khuyến mãi của quản trị tạo ra. */}
                    <p className="mt-3 text-sm text-gray-500">
                      Nhập mã khuyến mãi đang có hiệu lực. Mức giảm được hệ thống kiểm tra và tính trực tiếp.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#AF140B] rounded-xl">
                    <CreditCard className="size-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Phương Thức Thanh Toán
                  </h2>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const walletSufficient = walletBalance !== null && walletBalance >= total;
                    const walletDisabled = walletLoading || walletBalance === null || !walletSufficient;
                    return (
                      <label
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                          walletDisabled
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-70'
                            : 'border-gray-200 cursor-pointer hover:bg-gray-50 has-[:checked]:border-[#AF140B] has-[:checked]:bg-[#FFE5E3]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="WALLET"
                          checked={paymentMethod === 'WALLET'}
                          disabled={walletDisabled}
                          onChange={(e) => setPaymentMethod(e.target.value as 'WALLET')}
                          className="size-5 text-[#AF140B]"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">👛 Ví Kinderland</p>
                          {walletLoading ? (
                            <p className="text-sm text-gray-500">Đang kiểm tra số dư...</p>
                          ) : walletBalance === null ? (
                            <p className="text-sm text-gray-500">
                              Không kiểm tra được số dư ví
                              <button
                                type="button"
                                onClick={(e) => {
                                  // Nằm trong <label> nên click mặc định sẽ chọn luôn radio ví
                                  // (đang disabled) thay vì chạy hành động này.
                                  e.preventDefault();
                                  fetchWallet();
                                }}
                                className="ml-2 text-[#AF140B] font-semibold hover:underline"
                              >
                                Thử lại
                              </button>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600">
                              Số dư: {formatPrice(walletBalance)}
                              {!walletSufficient && (
                                <>
                                  <span className="text-red-500 font-medium">
                                    {' '}
                                    · Số dư không đủ. Nạp thêm{' '}
                                    {formatPrice(Math.max(0, total - walletBalance))}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setTopUpOpen(true);
                                    }}
                                    className="ml-2 text-[#AF140B] font-semibold hover:underline"
                                  >
                                    Nạp tiền ngay
                                  </button>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })()}

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-[#AF140B] has-[:checked]:bg-[#FFE5E3]">
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                      className="size-5 text-[#AF140B]"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">💵 Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                  </label>

                  {/* <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-[#AF140B] has-[:checked]:bg-[#FFE5E3]">
                    <input
                      type="radio"
                      name="payment"
                      value="BANK"
                      checked={paymentMethod === 'BANK'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'BANK')}
                      className="size-5 text-[#AF140B]"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">🏦 Chuyển khoản ngân hàng</p>
                      <p className="text-sm text-gray-600">
                        Chuyển khoản qua tài khoản ngân hàng
                      </p>
                    </div>
                  </label> */}

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-[#AF140B] has-[:checked]:bg-[#FFE5E3]">
                    <input
                      type="radio"
                      name="payment"
                      value="CARD"
                      checked={paymentMethod === 'CARD'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'CARD')}
                      className="size-5 text-[#AF140B]"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">💳 Thanh toán online qua VNPAY</p>
                      <p className="text-sm text-gray-600">
                        Quét QR, thẻ ATM nội địa, Internet Banking hoặc thẻ Visa/Mastercard
                      </p>
                      {paymentMethod === 'CARD' && (
                        <p className="mt-1 text-sm font-medium text-[#AF140B]">
                          Bạn sẽ được chuyển tới cổng thanh toán VNPAY sau khi tạo đơn.
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  📦 Đơn Hàng
                </h2>

                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {displayItems.map((item: any, index: number) => {
                    const sku = item.skuResponse || item.sku || {};
                    const product = item.productResponse || sku.productResponse || item.product || {};

                    const name = product.name || item.productName || item.name || "Sản phẩm";
                    const imageUrl = product.imageUrl || item.imageUrl || item.productImageUrl || product.image || item.image || "https://placehold.co/100x100?text=No+Image";
                    const price = sku.price || item.price || item.unitPrice || product.minPrice || product.price || 0;
                    const skuCode = sku.skuCode || item.skuCode || "";

                    const cartItemId = item.id || item.cartItemId || item.idCart || item.cartId || `item-${index}`;

                    return (
                      <div key={cartItemId} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all">
                        <img
                          src={imageUrl}
                          alt={name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">{name}</p>
                          {skuCode && <p className="text-xs text-gray-500">{skuCode}</p>}
                          <p className="text-sm text-gray-600 font-semibold">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-[#AF140B]">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Loyalty Points Toggle */}
                {!loyaltyLoading && loyaltyPoints > 0 && (
                  <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-1">
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        useLoyaltyPoints
                          ? 'border-[#D4AF37] bg-[#FFF9E6]'
                          : 'border-gray-200 hover:border-[#D4AF37]/40'
                      }`}
                      onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${
                          useLoyaltyPoints ? 'bg-[#D4AF37]' : 'bg-gray-200'
                        }`}>
                          <Coins className={`size-5 ${
                            useLoyaltyPoints ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Sử dụng điểm tích lũy</p>
                          <p className="text-xs text-gray-500">
                            Bạn có <span className="font-bold text-[#D4AF37]">{loyaltyPoints.toLocaleString('vi-VN')}</span> điểm
                            {useLoyaltyPoints && (
                              <span className="text-gray-400"> · Tối đa 50% đơn hàng</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {useLoyaltyPoints && (
                          <span className="text-sm font-bold text-[#D4AF37]">-{formatPrice(loyaltyDiscount)}</span>
                        )}
                        <div className={`w-10 h-6 rounded-full transition-all relative ${
                          useLoyaltyPoints ? 'bg-[#D4AF37]' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                            useLoyaltyPoints ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold">{formatPrice(shippingFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#AF140B]">
                      <span className="font-semibold">Giảm giá:</span>
                      <span className="font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-[#D4AF37]">
                      <span className="font-semibold flex items-center gap-1">
                        <Coins className="size-4" /> Điểm tích lũy:
                      </span>
                      <span className="font-bold">-{formatPrice(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-dashed border-gray-300 pt-3 flex justify-between font-bold text-xl">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-[#AF140B] text-2xl">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPlacingOrder || loadingAddresses || !selectedAddressId}
                  className="w-full mt-6 bg-[#AF140B] text-white py-4 rounded-xl hover:bg-[#8D0F08] transition-all shadow-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="animate-spin size-5" />
                      Đang xử lý...
                    </>
                  ) : "Đặt Hàng"}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* returnTo='/checkout': sau khi nạp xong, trang kết quả có nút đưa khách về đúng đây.
          Giỏ hàng nằm ở backend nên quay lại vẫn còn nguyên. */}
      <WalletTopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} returnTo="/checkout" />
    </div>
  );
}