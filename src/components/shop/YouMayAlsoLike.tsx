import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { inventoryApi } from '../../services/inventoryApi';
import { useApp } from '../../context/AppContext';

interface YouMayAlsoLikeProps {
  currentProductId: number;
}

interface SkuItem {
  id: number;
  productId: number;
  productName: string;
  skuCode: string;
  price: number;
  color?: string;
  size?: string;
  type?: string;
  imageUrl?: string;
}

export default function YouMayAlsoLike({ currentProductId }: YouMayAlsoLikeProps) {
  const navigate = useNavigate();
  const {
    addToCart,
    setCartDropdownOpen,
    wishlistItems,
    setWishlistItems,
    addWishlistItemGlobal,
    removeWishlistItemGlobal,
    user,
  } = useApp();
  const [skuItems, setSkuItems] = useState<SkuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const res = await api.get('/api/v1/sku');
        const allSkus: SkuItem[] = res.data || [];
        const otherSkus = allSkus.filter((sku) => sku.productId !== currentProductId);
        const shuffled = otherSkus.sort(() => Math.random() - 0.5).slice(0, 10);
        setSkuItems(shuffled);
      } catch (error) {
        console.error('Error fetching SKUs for recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkus();
  }, [currentProductId]);

  const handleAddToCart = async (sku: SkuItem) => {
    setAddingToCart(sku.id);
    try {
      const availRes = await inventoryApi.getStoreAvailability(sku.id);
      const stores = (availRes.data || []).filter(
        (s) =>
          (s.quantity != null && s.quantity > 0) ||
          s.availabilityStatus === 'Có sẵn' ||
          s.availabilityStatus === 'Còn ít' ||
          s.availabilityStatus === 'Còn hàng'
      );
      if (stores.length === 0) {
        toast.error('Sản phẩm hiện tại đã hết hàng.');
        return;
      }
      const bestStore = [...stores].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0];
      await addToCart(sku.id, 1, bestStore.storeId);
      toast.success('✅ Thêm vào giỏ hàng thành công!');
      setCartDropdownOpen(true);
      setTimeout(() => setCartDropdownOpen(false), 4000);
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleWishlistToggle = async (sku: SkuItem) => {
    const productId = sku.productId;
    const isLiked = wishlistItems?.some(
      (item: any) => (item.productId || item.id) === productId
    );
    try {
      if (isLiked) {
        if (user && localStorage.getItem('accessToken')) {
          const wishlistItem = wishlistItems.find(
            (item: any) => (item.productId || item.id) === productId
          );
          if (wishlistItem) {
            const targetId = wishlistItem.wishlistItemId || wishlistItem.id;
            console.log('[YouMayAlsoLike] Removing wishlist item:', { targetId, wishlistItem });
            const response = await api.removeWishlist(targetId);
            // Refresh wishlist from API response
            const items = response.data?.items || response.items || response.data || [];
            if (Array.isArray(items)) {
              setWishlistItems(items);
            }
          }
        }
        removeWishlistItemGlobal(productId);
        toast.success('Đã xóa khỏi yêu thích');
      } else {
        if (user && localStorage.getItem('accessToken')) {
          await api.addWishlist(productId);
          // Re-fetch full wishlist to get proper IDs
          try {
            const res = await api.get('/api/v1/wishlist');
            let items = res.data || res.items || res;
            if (Array.isArray(items)) {
              setWishlistItems(items);
            } else if (items && Array.isArray(items.items)) {
              setWishlistItems(items.items);
            }
          } catch {
            // fallback: just add locally
            addWishlistItemGlobal({
              productId,
              name: sku.productName,
              image: sku.imageUrl,
              price: sku.price,
            });
          }
        } else {
          addWishlistItemGlobal({
            productId,
            name: sku.productName,
            image: sku.imageUrl,
            price: sku.price,
          });
        }
        toast.success('❤️ Đã thêm vào yêu thích');
      }
    } catch (error: any) {
      console.error('[YouMayAlsoLike] Wishlist toggle error:', error);
      const msg = error.message || '';
      if (msg.includes('400') || msg.includes('already') || msg.includes('đã có')) {
        toast.error('Sản phẩm đã có trong danh sách yêu thích');
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại!');
      }
    }
  };

  const isProductLiked = (productId: number) =>
    wishlistItems?.some((item: any) => (item.productId || item.id) === productId);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('you-may-also-like-scroll');
    if (!container) return;
    const scrollAmount = 280;
    const newPos =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: newPos, behavior: 'smooth' });
  };

  if (loading || skuItems.length === 0) return null;

  return (
    <div className="mb-8 mt-2">
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Có thể bạn cũng thích</h2>

      {/* Carousel wrapper with side arrows */}
      <div className="relative group/carousel">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-[#AF140B] text-[#AF140B] shadow-lg flex items-center justify-center hover:bg-[#AF140B] hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-1/2"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-[#AF140B] text-[#AF140B] shadow-lg flex items-center justify-center hover:bg-[#AF140B] hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-1/2"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Scrollable card list */}
        <div
          id="you-may-also-like-scroll"
          className="flex gap-4 overflow-x-auto pb-4 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {skuItems.map((sku) => {
            const liked = isProductLiked(sku.productId);
            return (
              <div
                key={sku.id}
                className="flex-shrink-0 w-[240px] bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 flex flex-col"
              >
                {/* Image — click to navigate */}
                <button
                  onClick={() => navigate(`/product/${sku.productId}`)}
                  className="w-full h-[140px] bg-gray-50 flex items-center justify-center p-3 cursor-pointer relative"
                >
                  <img
                    src={sku.imageUrl || '/placeholder.png'}
                    alt={sku.productName}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                </button>

                {/* Info */}
                <div className="p-2.5 flex flex-col flex-1">
                  <button
                    onClick={() => navigate(`/product/${sku.productId}`)}
                    className="text-left w-full"
                  >
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 hover:text-[#AF140B] transition-colors leading-tight mb-1">
                      {sku.productName}
                    </p>
                  </button>

                  {/* SKU variant info */}
                  <div className="flex gap-1 flex-wrap mb-2">
                    {sku.color && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {sku.color}
                      </span>
                    )}
                    {sku.size && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {sku.size}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-sm font-bold text-[#AF140B] mb-2">
                    {formatPrice(sku.price)}
                  </p>

                  {/* Actions: Add to Cart + Wishlist Heart */}
                  <div className="flex gap-1.5 mt-auto">
                    <button
                      onClick={() => handleAddToCart(sku)}
                      disabled={addingToCart === sku.id}
                      className="flex-1 bg-[#AF140B] text-white py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[#8D0F08] transition-all disabled:opacity-50"
                    >
                      <ShoppingCart className="size-3" />
                      {addingToCart === sku.id ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}
                    </button>
                    <button
                      onClick={() => handleWishlistToggle(sku)}
                      className={`w-8 h-8 flex-shrink-0 rounded-lg border flex items-center justify-center transition-all ${
                        liked
                          ? 'border-[#AF140B] bg-[#FFE5E3] text-[#AF140B]'
                          : 'border-gray-300 text-gray-400 hover:border-[#AF140B] hover:text-[#AF140B]'
                      }`}
                    >
                      <Heart
                        className={`size-3.5 transition-colors ${liked ? 'fill-[#AF140B]' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
