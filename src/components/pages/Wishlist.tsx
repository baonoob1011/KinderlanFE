import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Minus, Heart } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import api from "../../services/api";

export default function Wishlist() {
  const { user, wishlistItems, setWishlistItems: setGlobalWishlistItems, removeWishlistItemGlobal } = useApp();
  const [wishlist, setWishlist] = useState<any[]>([]);

  const fetchWishlist = async () => {
    if (!user) {
      // Guest: use wishlist from context (backed by localStorage)
      setWishlist(wishlistItems);
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
        setWishlist(items);
        setGlobalWishlistItems(items);
      } else if (items && Array.isArray(items.items)) {
        setWishlist(items.items);
        setGlobalWishlistItems(items.items);
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
      setWishlist(wishlistItems);
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

                    <img
                      src={item.productImageUrl || item.imageUrl || item.image}
                      alt={item.productName || item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

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