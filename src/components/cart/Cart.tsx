import React from "react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, updateCartItem, user } = useApp();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  // Auto-select all on first load if cart has items
  React.useEffect(() => {
    if (cart.length > 0 && selectedIds.length === 0) {
      const allIds = cart.map(item => item.id || item.cartItemId || item.idCart || item.cartId).filter(Boolean);
      setSelectedIds(allIds);
    }
  }, [cart.length]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cart.length) {
      setSelectedIds([]);
    } else {
      const allIds = cart.map(item => item.id || item.cartItemId || item.idCart || item.cartId).filter(Boolean);
      setSelectedIds(allIds);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const selectedItems = cart.filter(item => {
    const id = item.id || item.cartItemId || item.idCart || item.cartId;
    return selectedIds.includes(id);
  });

  const subtotal = selectedItems.reduce((sum, item) => {
    // Priority: use the totals already calculated by backend
    return sum + (item.totalPrice || (item.finalPrice * item.quantity) || (item.unitPrice * item.quantity) || 0);
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để đặt hàng");
      return;
    }
    // Pass selected items to checkout via state
    navigate("/checkout", { state: { selectedItems } });
  };

  const updateQuantity = async (
    cartItemId: number,
    currentQuantity: number,
    change: number
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 1) {
      try {
        await updateCartItem(cartItemId, newQuantity);
      } catch (err: any) {
        toast.error(err.message || "Không thể cập nhật số lượng");
      }
    } else {
      // If quantity becomes < 1, remove item
      try {
        const loadingToast = toast.loading("Đang xóa sản phẩm...");
        await removeFromCart(cartItemId);
        toast.dismiss(loadingToast);
        toast.success("Đã xóa khỏi giỏ hàng");
      } catch (err: any) {
        toast.error(err.message || "Không thể xóa");
      }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-4 backdrop-blur-sm">
              <ShoppingBag className="size-6" />
              <span className="font-bold text-lg">
                GIỎ HÀNG
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Giỏ Hàng Của Bạn
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="size-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#AF140B] text-white px-8 py-4 rounded-2xl hover:bg-[#8D0F08] transition-all shadow-lg font-bold text-lg"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-4 backdrop-blur-sm">
            <ShoppingBag className="size-6" />
            <span className="font-bold text-lg">GIỎ HÀNG</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Giỏ Hàng Của Bạn
          </h1>
          <p className="text-xl text-white/90">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm đang chờ
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#AF140B] hover:text-[#8D0F08] mb-6 font-semibold"
        >
          <ArrowLeft className="size-5" />
          Tiếp tục mua sắm
        </button>
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === cart.length && cart.length > 0}
              onChange={toggleSelectAll}
              className="size-5 rounded border-gray-300 text-[#AF140B] focus:ring-[#AF140B]"
            />
            <span className="font-bold text-gray-800">Chọn tất cả ({cart.length})</span>
          </label>
          <button
            onClick={() => {
              // Future feature: Batch remove
            }}
            className="text-gray-500 hover:text-red-500 font-semibold text-sm transition-colors"
          >
            Xóa mục đã chọn
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* DEBUG: Log full cart array once for visibility */}
            {(() => {
              if (cart.length > 0) console.log("CURRENT CART DATA:", cart);
              return null;
            })()}
            {cart.map((item, index) => {
              // CRITICAL: Try all possible ID fields for the CART ITEM itself
              const cartItemId = item.id || item.cartItemId || item.idCart || item.cartId;
              const isSelected = selectedIds.includes(cartItemId);

              const name = item.productName || item.name || "Sản phẩm";
              const imageUrl = item.imageUrl || item.productImageUrl || "/placeholder.png";
              const skuCode = item.skuCode || "";
              const color = item.color || "";
              const size = item.size || "";

              return (
                <div
                  key={`cart-item-${cartItemId || index}`}
                  className={`bg-white rounded-2xl shadow-lg p-5 flex gap-4 hover:shadow-xl transition-shadow border-2 transition-all ${isSelected ? 'border-[#AF140B] bg-[#FFE5E3]/10' : 'border-gray-200 hover:border-[#AF140B]/30'
                    }`}
                >
                  <div className="flex items-center pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(cartItemId)}
                      className="size-5 rounded border-gray-300 text-[#AF140B] focus:ring-[#AF140B] cursor-pointer"
                    />
                  </div>

                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-28 h-28 object-cover rounded-xl border border-gray-100"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-[#2C2C2C] mb-1 text-lg">
                      {name}
                    </h3>
                    <div className="space-y-1">
                      {skuCode && (
                        <p className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded">
                          {skuCode}
                        </p>
                      )}
                      {color && (
                        <p className="text-sm text-gray-600 font-medium">
                          Màu sắc: <span className="text-gray-900">{color}</span>
                        </p>
                      )}
                      {size && (
                        <p className="text-sm text-gray-600 font-medium">
                          Kích cỡ: <span className="text-gray-900">{size}</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-2">
                      {item.discountAmount > 0 || (item.unitPrice > (item.finalPrice || item.unitPrice)) ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#AF140B] font-bold text-xl">
                              {formatPrice(item.finalPrice || (item.unitPrice - (item.discountAmount || 0)))}
                            </span>
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-bold text-[10px]">
                              Giảm {Math.round(((item.unitPrice - (item.finalPrice || item.unitPrice)) / item.unitPrice) * 100) || 0}%
                            </span>
                          </div>
                          <p className="text-gray-400 line-through text-sm">
                            {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[#AF140B] font-bold text-xl">
                          {formatPrice(item.finalPrice || item.unitPrice)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={async () => {
                        if (!cartItemId) {
                          toast.error("Không tìm thấy ID của sản phẩm trong giỏ hàng");
                          return;
                        }
                        try {
                          await removeFromCart(cartItemId);
                          toast.success("Đã xóa khỏi giỏ hàng");
                        } catch (err: any) {
                          toast.error(err.message || "Không thể xóa");
                        }
                      }}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="size-5" />
                    </button>

                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => {
                          if (cartItemId) {
                            updateQuantity(cartItemId, item.quantity, -1);
                          }
                        }}
                        className="p-2 hover:bg-[#FFE5E3] rounded-lg transition-all text-[#AF140B]"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-[#2C2C2C]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (cartItemId) {
                            updateQuantity(cartItemId, item.quantity, 1);
                          }
                        }}
                        className="p-2 hover:bg-[#FFE5E3] rounded-lg transition-all text-[#AF140B]"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-4">
                Tóm Tắt Đơn Hàng
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold">
                    Tính sau
                  </span>
                </div>
                <div className="border-t-2 border-dashed border-gray-300 pt-3 flex justify-between font-bold text-xl">
                  <span className="text-[#2C2C2C]">
                    Tổng cộng:
                  </span>
                  <span className="text-[#AF140B]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#AF140B] text-white py-4 rounded-xl hover:bg-[#8D0F08] transition-all shadow-lg font-bold text-lg"
              >
                Đặt Hàng
              </button>

              <div className="mt-4 text-sm text-gray-600 space-y-2 bg-[#FFE5E3] p-4 rounded-xl">
                <p className="flex items-center gap-2">
                  <span className="text-[#AF140B]">✓</span>
                  Miễn phí vận chuyển đơn từ 500.000đ
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#AF140B]">✓</span>
                  Thanh toán an toàn & bảo mật
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}