import { ShoppingCart, Heart, MapPin, Plus, Minus, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import api from '../../services/api';

interface ProductActionsProps {
  product: any;
  selectedSku: any;
  quantity: number;
  currentStock: number;
  availabilityLoading: boolean;
  storesWithStock: any[];
  onQuantityChange: (qty: number) => void;
  onShowStoreModal: () => void;
}

export default function ProductActions({
  product,
  selectedSku,
  quantity,
  currentStock,
  availabilityLoading,
  storesWithStock,
  onQuantityChange,
  onShowStoreModal,
}: ProductActionsProps) {
  const { user, addToCart, wishlistItems, setWishlistItems, addWishlistItemGlobal, removeWishlistItemGlobal, setCartDropdownOpen } = useApp();

  const productId = product.id && typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
  const wishlistItem = wishlistItems?.find((item: any) => (item.productId || item.id) === productId);
  const isLiked = !!wishlistItem;

  const handleAddToCart = async () => {
    try {
      if (!selectedSku) {
        throw new Error("Vui lòng chọn loại sản phẩm!");
      }
      if (storesWithStock.length === 0) {
        throw new Error("Sản phẩm hiện tại đã hết hàng ở tất cả các chi nhánh.");
      }
      const sortedStores = [...storesWithStock].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
      const bestStore = sortedStores[0];
      await addToCart(selectedSku.id, quantity, bestStore.storeId);
      toast.success('✅ Thêm vào giỏ hàng thành công!');
      setCartDropdownOpen(true);
      setTimeout(() => setCartDropdownOpen(false), 4000);
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isLiked) {
        if (user && localStorage.getItem('accessToken')) {
          const targetId = wishlistItem.wishlistItemId || wishlistItem.id;
          const response = await api.removeWishlist(targetId);
          const items = response.data?.items || response.items || response.data || [];
          if (Array.isArray(items) && setWishlistItems) setWishlistItems(items);
        } else {
          removeWishlistItemGlobal(productId);
        }
        toast.success("Đã xóa khỏi yêu thích");
      } else {
        if (user && localStorage.getItem('accessToken')) {
          const response = await api.addWishlist(productId);
          const items = response.data?.items || response.items || response.data || [];
          if (Array.isArray(items) && setWishlistItems) setWishlistItems(items);
        } else {
          addWishlistItemGlobal({ productId, name: product.name, image: product.image, price: product.price });
        }
        toast.success('❤️ Đã thêm vào yêu thích');
      }
    } catch (error: any) {
      const errorMsg = error.message || "";
      if (errorMsg.includes('400') || errorMsg.includes('already') || errorMsg.includes('đã có')) {
        toast.error('Sản phẩm đã có trong danh sách yêu thích');
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
    }
  };

  return (
    <>
      {/* Quantity Selector */}
      <div className="mb-4 mt-3">
        <label className="block text-xs font-bold text-gray-700 mb-2">Số lượng:</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => quantity > 1 && onQuantityChange(quantity - 1)}
            className="p-1.5 border border-gray-300 rounded-lg hover:bg-[#AF140B] hover:text-white hover:border-[#AF140B] transition-all"
          >
            <Minus className="size-4" />
          </button>
          <span className="text-base font-bold w-10 text-center">{quantity}</span>
          <button
            onClick={() => quantity < currentStock && onQuantityChange(quantity + 1)}
            className="p-1.5 border border-gray-300 rounded-lg hover:bg-[#AF140B] hover:text-white hover:border-[#AF140B] transition-all disabled:opacity-50"
            disabled={quantity >= currentStock || currentStock === 0}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1.5 font-medium">
          {availabilityLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> Đang kiểm tra tồn kho...
            </span>
          ) : (
            `Còn lại: ${currentStock} sản phẩm`
          )}
        </p>
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={currentStock === 0 || availabilityLoading}
        className="w-full bg-[#AF140B] text-white py-2.5 rounded-xl hover:bg-[#8D0F08] transition-all shadow-md flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
      >
        <ShoppingCart className="size-4" />
        {availabilityLoading ? "Đang kiểm tra..." : currentStock > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}
      </button>

      {/* Wishlist */}
      <button
        onClick={handleWishlistToggle}
        className="w-full mt-2 bg-white border border-[#AF140B] text-[#AF140B] py-2.5 rounded-xl hover:bg-[#FFE5E3] transition-all flex items-center justify-center gap-2 font-semibold text-sm group"
      >
        <Heart className={`size-4 transition-colors ${isLiked ? "fill-[#AF140B] text-[#AF140B]" : "text-[#AF140B] group-hover:fill-[#AF140B]"}`} />
        {isLiked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      </button>

      {/* Find in Store */}
      <button
        onClick={onShowStoreModal}
        className="w-full mt-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
      >
        <MapPin className="size-4" />
        Tìm tại cửa hàng
      </button>
    </>
  );
}
