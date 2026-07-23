import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductCard from "../shop/ProductCard";
import Pagination from "../common/Pagination";
import api from "../../services/api";
import { resolveImageUrl } from "../../services/imageUrl";

const BRAND_PLACEHOLDER = "/placeholder-brand.png";

/* ===============================
   TYPES
================================= */
interface Brand {
  id: number;
  name: string;
  origin?: string | null;
  /** Backend trả về đúng field này (presigned S3 URL). */
  logoUrl?: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

/* ===============================
   COMPONENT
================================= */
export default function BrandsPage() {
  const { brandName } = useParams<{ brandName?: string }>();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [brandsLoading, setBrandsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;

  /* ===============================
     FETCH BRANDS
  ================================= */
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setBrandsLoading(true);

        const response = await api.get("/api/v1/brands");

        // xử lý linh hoạt theo structure backend
        const data = response.data;
        const brandsData = Array.isArray(data)
          ? data
          : data.content || data.data || [];

        setBrands(brandsData || []);
      } catch (error) {
        console.error("Lỗi lấy brands:", error);
      } finally {
        setBrandsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  /* ===============================
     FETCH PRODUCTS THEO BRAND
  ================================= */
  useEffect(() => {
    if (!brandName) return;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);

        const response = await api.get(
          `/api/v1/products/browse?brandName=${encodeURIComponent(brandName)}`
        );

        const data = response.data;
        const productsData = Array.isArray(data)
          ? data
          : data.content || data.data?.content || data.data || [];

        const mappedProducts = productsData.map((item: any) => {
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
            category: item.categoryName,
            brand: item.brandName,
            image: item.imageUrl,
            rating: 4.5,
            reviewCount: 10,
          };
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Lỗi lấy products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [brandName]);

  /* ===============================
     BRAND DETAIL PAGE
  ================================= */
  if (brandName) {
    const currentBrand = brands.find(
      (b) => b.name === brandName
    );

    const totalPages = Math.ceil(
      products.length / itemsPerPage
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProducts = products.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <div className="bg-gray-50 min-h-screen">
        {/* HEADER */}
        <div className="text-black py-12">
          <div className="container mx-auto px-4">
            <Link
              to="/brands"
              className="inline-flex items-center gap-2 text-black/90 hover:text-black mb-4"
            >
              <ArrowLeft className="size-5" />
              Quay lại thương hiệu
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-white rounded-xl flex items-center justify-center p-2 overflow-hidden">
                <img
                  src={
                    resolveImageUrl(currentBrand?.logoUrl) || BRAND_PLACEHOLDER
                  }
                  alt={brandName}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = BRAND_PLACEHOLDER;
                  }}
                />
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  {brandName}
                </h1>
                <p className="text-black/90 mt-2">
                  {products.length} sản phẩm
                  {totalPages > 1 &&
                    ` - Trang ${currentPage}/${totalPages}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="container mx-auto px-4 py-8">
          {productsLoading ? (
            <div className="text-center py-20">
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                Chưa có sản phẩm của thương hiệu này
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

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ===============================
     BRAND LIST PAGE
  ================================= */
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold mb-3 text-[#AF140B]">
          Thương Hiệu
        </h1>

        <p className="text-gray-700 text-lg mb-8 font-semibold">
          Khám phá các thương hiệu đồ chơi hàng đầu thế giới
        </p>

        {brandsLoading ? (
          <div className="text-center py-20">
            <p>Đang tải thương hiệu...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20">
            <p>Không có thương hiệu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.name}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden p-8 text-center border-2 border-gray-100 hover:border-[#AF140B]">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={
                        resolveImageUrl(brand.logoUrl) || BRAND_PLACEHOLDER
                      }
                      alt={brand.name}
                      loading="lazy"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = BRAND_PLACEHOLDER;
                      }}
                    />
                  </div>

                  <h3 className="font-bold text-gray-800 mb-2 group-hover:text-[#AF140B] transition-colors">
                    {brand.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}