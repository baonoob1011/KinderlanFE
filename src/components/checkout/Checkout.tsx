import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../../context/AppContext';
import { CreditCard, Truck, AlertCircle, Loader2, Plus, Coins } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { accountApi, AddressRequest } from '../../services/accountApi';
import { loyaltyApi } from '../../services/loyaltyApi';

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
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK' | 'CARD'>('COD');

  // Loyalty points state
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

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

  const subtotal = displayItems.reduce((sum: number, item: any) => {
    // Robust price mapping matching Cart.tsx
    const sku = item.skuResponse || item.sku || {};
    const product = item.productResponse || sku.productResponse || item.product || {};
    const price = sku.price || item.price || item.unitPrice || product.minPrice || product.price || item.productPrice || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  let discount = 0;
  if (voucher) {
    discount = voucher.type === 'percentage'
      ? (subtotal * voucher.discount) / 100
      : voucher.discount;
  }

  // Loyalty points discount: capped at 50% of subtotal and available points
  const maxLoyaltyDiscount = Math.floor(subtotal * 0.5); // 50% cap
  const loyaltyDiscount = useLoyaltyPoints
    ? Math.min(loyaltyPoints, maxLoyaltyDiscount)
    : 0;

  const total = subtotal + shippingFee - discount - loyaltyDiscount;

  const handleApplyVoucher = () => {
    setVoucherError('');
    const success = applyVoucher(voucherCode);
    if (success) {
      setVoucherCode('');
      toast.success("Áp dụng mã giảm giá thành công!");
    } else {
      setVoucherError('Mã giảm giá không hợp lệ');
    }
  };

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
      console.log("Placing order from cart:", { selectedAddressId, storeId, itemsCount: items.length });
      const orderRes = await api.createOrder(selectedAddressId, storeId, items);

      // Extract orderId from response - assuming it's in data or data.id
      const orderId = orderRes.data?.orderId || orderRes.data?.id || orderRes.orderId || orderRes.id;

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
      const mapPaymentMethod = (ui: 'COD' | 'BANK' | 'CARD'): 'COD' | 'VNPAY' => {
        switch (ui) {
          case 'COD':
            return 'COD';
          case 'CARD':
            return 'VNPAY';
          default:
            throw new Error('Phương thức thanh toán không được hỗ trợ');
        }
      };
      const checkoutPaymentMethod = mapPaymentMethod(paymentMethod);
      try {
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
      } catch (paymentErr: any) {
        toast.dismiss(loadingToast);
        toast.error("Lỗi khởi tạo thanh toán: " + (paymentErr.message || "Vui lòng thử lại"));
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
            total,
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

              {/* Voucher */}
              {/* <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
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
                        Giảm {voucher.type === 'percentage'
                          ? `${voucher.discount}%`
                          : formatPrice(voucher.discount)}
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
                        className="px-6 py-3 bg-[#AF140B] text-white rounded-xl hover:bg-[#8D0F08] transition-all shadow-lg font-bold"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-semibold">
                        <AlertCircle className="size-4" />
                        {voucherError}
                      </p>
                    )}
                    <div className="mt-4 p-4 bg-[#FFE5E3] rounded-xl border border-[#AF140B]/30">
                      <p className="font-bold mb-2 text-gray-800">🎁 Mã khả dụng:</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-semibold">• GIAM10 - Giảm 10%</p>
                        <p className="font-semibold">• GIAM50K - Giảm 50.000đ</p>
                        <p className="font-semibold">• FREESHIP - Giảm 30.000đ phí ship</p>
                      </div>
                    </div>
                  </div>
                )}
              </div> */}

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
    </div>
  );
}