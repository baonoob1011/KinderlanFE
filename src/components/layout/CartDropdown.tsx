import { Link, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CartDropdown() {
  const { cart, removeFromCart, updateCartItem, user } = useApp();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => {
    const sku = item.skuResponse || item.sku || {};
    const product = item.productResponse || sku.productResponse || item.product || {};
    const price = sku.price || item.price || item.unitPrice || product.minPrice || product.price || item.productPrice || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  const updateQuantity = (cartItemId: number, newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= 99) {
      updateCartItem(cartItemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="absolute top-full -mt-4 -right-2 w-96 z-[100]">
        <div className="bg-white rounded-2xl p-6">
          <div className="text-center py-8">
            <ShoppingCart className="size-16 text-gray-300 mx-auto mb-3" />
            <p className="text-[#2C2C2C] font-semibold">Giỏ hàng trống</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full -mt-4 -right-2 w-96 z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#AF140B]/20 p-6">
        <h3 className="font-bold text-[#2C2C2C] text-lg mb-4">
          Giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </h3>
        
        {/* Cart Items - Max height with scroll */}
        <div className="max-h-[300px] overflow-y-auto space-y-4 mb-4">
          {cart.map((item, index) => {
            const sku = item.skuResponse || item.sku || {};
            const product = item.productResponse || sku.productResponse || item.product || item || {};
            
            // CRITICAL: Identify the correct Cart Item ID for API calls
            const cartItemId = item.id || item.cartItemId || item.idCart || item.cartId;
            
            // Alignment: imageUrl from productResponse (preferred), SKU Code from skuResponse
            const name = product.name || item.productName || item.name || "Sản phẩm";
            const imageUrl = product.imageUrl || item.imageUrl || item.productImageUrl || product.image || item.image || "/placeholder.png";
            const price = sku.price || item.price || item.unitPrice || product.minPrice || product.price || 0;
            const skuCode = sku.skuCode || item.skuCode || "";
            
            return (
              <div
                key={`cart-dropdown-${cartItemId || index}`}
                className="flex gap-3 p-3 hover:bg-[#FFE5E3] rounded-lg transition-colors border border-gray-100"
              >
                {/* Product Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#2C2C2C] text-sm line-clamp-2 mb-1">
                    {name}
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    {skuCode && (
                      <span className="text-[10px] font-mono text-gray-400">
                        {skuCode}
                      </span>
                    )}
                    {sku.color && (
                      <p className="text-[10px] text-gray-500">Màu: {sku.color}</p>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (cartItemId) {
                          if (item.quantity > 1) updateQuantity(cartItemId, item.quantity - 1);
                          else toast.error("Số lượng tối thiểu là 1");
                        }
                        else toast.error("Không tìm thấy ID giỏ hàng");
                      }}
                      className="w-7 h-7 flex items-center justify-center border-2 border-[#AF140B]/30 text-[#AF140B] rounded-full hover:bg-[#FFE5E3] transition-colors"
                    >
                      <Minus className="size-4" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (cartItemId) updateQuantity(cartItemId, val);
                      }}
                      className="w-12 h-7 text-center border-2 border-[#AF140B]/20 bg-white text-[#2C2C2C] rounded-lg font-semibold text-sm focus:outline-none focus:border-[#AF140B]"
                      min="1"
                      max="99"
                    />
                    <button
                      onClick={() => {
                        if (cartItemId) updateQuantity(cartItemId, item.quantity + 1);
                        else toast.error("Không tìm thấy ID giỏ hàng");
                      }}
                      className="w-7 h-7 flex items-center justify-center border-2 border-[#78A2D2]/40 text-[#78A2D2] rounded-full hover:bg-[#78A2D2]/20 transition-colors"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Price and Delete */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => {
                      if (cartItemId) removeFromCart(cartItemId);
                      else toast.error("Không tìm thấy ID giỏ hàng");
                    }}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <p className="font-bold text-[#AF140B] text-sm">
                    {formatPrice(price * (item.quantity || 1))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-[#AF140B]/20 my-4"></div>

        {/* Total */}
        <div className="bg-[#FFE5E3]/40 rounded-xl p-4 mb-4 border border-[#AF140B]/15">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#2C2C2C]">Tổng cộng</span>
            <span className="font-bold text-[#AF140B] text-xl">
              {formatPrice(subtotal)}
            </span>
          </div>
        </div>

        {/* Terms */}
        <div className="mb-4">
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="mt-0.5 rounded border-[#AF140B]/30 accent-[#AF140B]"
            />
            <span>
              Tôi đã đọc và đồng ý với{' '}
              <a href="#" className="text-[#AF140B] hover:underline">
                Chính sách bảo mật
              </a>{' '}
              và{' '}
              <a href="#" className="text-[#78A2D2] hover:underline">
                Điều kiện thanh toán
              </a>
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            to="/cart"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#AF140B] text-[#AF140B] rounded-xl hover:bg-[#FFE5E3] transition-colors font-semibold text-sm"
          >
            <ShoppingCart className="size-3.5" />
            Xem giỏ hàng
          </Link>
          <button
            onClick={handleCheckout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#AF140B] text-white rounded-xl hover:bg-[#8D0F08] transition-colors font-semibold text-sm shadow-lg"
          >
            Thanh toán ngay
          </button>
        </div>
      </div>
    </div>
  );
}