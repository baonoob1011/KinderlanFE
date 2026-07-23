import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Minus, Heart } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import api from "../../services/api";

export default function Wishlist() {
  const { user, wishlistItems, setWishlistItems: setGlobalWishlistItems, removeWishlistItemGlobal } = useApp();
  const [wishlist, setWishlist] = useState<any[]>([]);

  /**
   * Bổ sung ảnh cho những item wishlist chưa có.
   *
   * GET /api/v1/wishlist trả WishlistItemResponse — DTO này KHÔNG có trường ảnh
   * (chỉ id/productId/productName/price/addedAt), nên ảnh luôn undefined và thẻ
   * sản phẩm hiện icon vỡ. Trang Sản phẩm lấy ảnh từ GET /api/v1/products và chạy
   * tốt, nên lấy lại từ đúng nguồn đó: 1 request, map productId -> imageUrl.
   *
   * Giữ nguyên item nếu backend đã trả ảnh sẵn (khi bản sửa WishlistService được
   * deploy thì nhánh này tự động không cần dùng tới).
   */
  const withProductImages = async (items: any[]): Promise<any[]> => {
    const missing = items.some(
      (i) => !(i.imageUrl || i.productImageUrl || i.image),
    );
    if (!missing) return items;

    try {
      const res = await api.get("/api/v1/products");
      const raw = res?.data ?? res;
      const list = Array.isArray(raw) ? raw : raw?.content ?? [];
      const imageByProductId = new Map<number, string>();
      for (const p of list) {
        if (p?.id != null && p?.imageUrl) imageByProductId.set(Number(p.id), p.imageUrl);
      }
      return items.map((i) => {
        if (i.imageUrl || i.productImageUrl || i.image) return i;
        const url = imageByProductId.get(Number(i.productId ?? i.id));
        return url ? { ...i, imageUrl: url } : i;
      });
    } catch {
      // Không lấy được ảnh thì vẫn hiển thị danh sách, chỉ thiếu ảnh.
      return items;
    }
  };

  const applyItems = async (items: any[]) => {
    const enriched = await withProductImages(items);
    setWishlist(enriched);
    setGlobalWishlistItems(enriched);
  };

  const fetchWishlist = async () => {
    if (!user) {
      // Guest: use wishlist from context (backed by localStorage)
      setWishlist(await withProductImages(wishlistItems));
      return;
    }
    try {
      const res = await api.get("/api/v1/wishlist");

      let items = res;
      if (res && res.data) {
        items = res.data;
      } else if (res && res.items) {
        items = res.items;
      }

      if (Array.isArray(items)) {
        await applyItems(items);
      } else if (items && Array.isArray(items.items)) {
        await applyItems(items.items);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  // Keep local state in sync with context for guests
  useEffect(() => {
    if (!user) {
      // Phải enrich ở đây nữa, nếu không effect này ghi đè danh sách đã có ảnh
      // bằng bản thô trong context -> ảnh vừa hiện lại biến mất.
      let cancelled = false;
      withProductImages(wishlistItems).then((items) => {
        if (!cancelled) setWishlist(items);
      });
      return () => { cancelled = true; };
    }
  }, [wishlistItems, user]);

  const handleRemove = async (id: number) => {
    if (!user) {
      // Guest: remove from context (which persists to localStorage)
      removeWishlistItemGlobal(id);
      toast.success("Đã xóa khỏi danh sách yêu thích");
      return;
    }
    try {
      const res = await api.removeWishlist(id);

      let items = res.data || res.items || res;

      if (res && res.data && Array.isArray(res.data.items)) {
        items = res.data.items;
      } else if (res && Array.isArray(res.items)) {
        items = res.items;
      }

      if (Array.isArray(items)) {
        setWishlist(items);
        setGlobalWishlistItems(items);
      } else {
        fetchWishlist();
      }

      toast.success("Đã xóa khỏi danh sách yêu thích");
    } catch (error) {
      toast.error("Không thể xóa sản phẩm khỏi danh sách yêu thích");
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* HERO SECTION */}

      <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-16">

        <div className="container mx-auto px-4 text-center">

          <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-4 backdrop-blur-sm">
            <Heart className="size-6" />
            <span className="font-bold text-lg">
              WISHLIST
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-4">
            Danh Sách Yêu Thích
          </h1>
        </div>

      </div>

      <div className="container mx-auto px-4 py-12">

        {/* EMPTY STATE */}

        {wishlist.length === 0 ? (

          <div className="text-center py-24 bg-white rounded-3xl shadow-md border border-gray-100">

            <div className="flex justify-center mb-5">
              <div className="bg-red-100 p-5 rounded-full">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Bạn chưa có sản phẩm nào trong danh sách yêu thích.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition shadow-md"
            >
              Tiếp tục mua sắm
            </Link>

          </div>

        ) : (

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

            {wishlist.map((item: any) => (

              <div
                key={item.wishlistItemId || item.productId || item.id}
                className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >

                <Link to={`/product/${item.productId || item.id}`}>

                  <div className="aspect-square bg-gradient-to-br from-red-50 to-white overflow-hidden">

                    {/* Sản phẩm chưa có ảnh -> placeholder, thay vì <img src={undefined}>
                        vốn hiện icon ảnh vỡ kèm alt text. */}
                    {(item.imageUrl || item.productImageUrl || item.image) ? (
                      <img
                        src={item.imageUrl || item.productImageUrl || item.image}
                        alt={item.productName || item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          // Presigned URL hết hạn hoặc key hỏng -> đổi sang placeholder.
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          el.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="w-10 h-10 text-red-200" />
                      </div>
                    )}

                  </div>

                  <div className="p-4">

                    <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[3rem] group-hover:text-red-600 transition">
                      {item.productName || item.name}
                    </h3>

                    <div className="mt-2 text-red-600 font-bold text-lg">
                      {formatPrice(item.priceAtAddTime || item.price)}
                    </div>

                  </div>

                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(user ? (item.wishlistItemId || item.id) : (item.productId || item.id));
                  }}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 hover:scale-110 shadow-sm transition-all"
                >
                  <Minus className="w-5 h-5" />
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}