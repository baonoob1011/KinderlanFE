import React from "react";
import ProductCard from "../shop/ProductCard";
import { Percent, TrendingDown } from "lucide-react";
import Pagination from "../common/Pagination";
import api from "../../services/api";

export default function DiscountsPage() {

  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 20;

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await api.get("/api/v1/products", { params: { page: 0, size: 100 } });
        const data = response.data;

        const productsData = Array.isArray(data) ? data : data.content || data.data?.content || data.data || [];

        const mappedProducts = productsData.map((item) => {
          const discount = item.promotion?.discountPercent || 0;

          const originalPrice = item.minPrice;
          const price =
            discount > 0
              ? originalPrice - (originalPrice * discount) / 100
              : originalPrice;

          return {
            id: item.id,
            name: item.name,
            description: item.description,
            price: price,
            originalPrice: discount > 0 ? originalPrice : null,
            discountPercent: discount,

            category: item.categoryName,
            brand: item.brandName,
            image: item.imageUrl,
          };
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Lỗi lấy products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products with discounts
  const discountedProducts = products.filter(
    (p) => p.discountPercent > 0
  );
  // Pagination
  const totalPages = Math.ceil(
    discountedProducts.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = discountedProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const vouchers = [
    {
      code: "GIAM10",
      discount: "10%",
      desc: "Giảm 10% cho tất cả đơn hàng",
      color: "from-[#AF140B] to-[#8D0F08]",
    },
    {
      code: "GIAM50K",
      discount: "50.000đ",
      desc: "Giảm 50.000đ cho đơn từ 500.000đ",
      color: "from-[#D91810] to-[#AF140B]",
    },
    {
      code: "FREESHIP",
      discount: "30.000đ",
      desc: "Giảm 30.000đ phí vận chuyển",
      color: "from-[#AF140B] to-[#8D0F08]",
    },
    {
      code: "NEWUSER",
      discount: "15%",
      desc: "Giảm 15% cho khách hàng mới",
      color: "from-[#D91810] to-[#AF140B]",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-5">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-2 backdrop-blur-sm">
            <Percent className="size-4" />
            <span className="font-bold text-sm">
              KHUYẾN MÃI ĐẶC BIỆT
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Giảm Giá Khủng
          </h1>
          <p className="text-sm text-white/90">
            Tiết kiệm tối đa với các ưu đãi hấp dẫn
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-700 mb-8 font-semibold">
          {discountedProducts.length} sản phẩm đang giảm giá
        </p>

        {loading ? (
          <div className="text-center py-20">
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              Hiện không có sản phẩm khuyến mãi
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}