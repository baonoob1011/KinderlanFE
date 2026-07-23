import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
import ProductCard from "../shop/ProductCard";
import Pagination from "../common/Pagination";
import api from "../../services/api";

/* ===============================
   TYPES
================================= */
interface Category {
  id: number;
  name: string;
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
export default function CategoriesPage() {
  const { categoryName } = useParams<{ categoryName?: string }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;

  /* ===============================
     FETCH CATEGORIES
  ================================= */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        const response = await api.get("/api/v1/categories");

        const data = response.data;
        const categoriesData = Array.isArray(data) ? data : data.content || data.data || [];

        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Lỗi lấy categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /* ===============================
     FETCH PRODUCTS BY CATEGORY
  ================================= */
  useEffect(() => {
    if (!categoryName) return;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);

        const response = await api.get(
          `/api/v1/products/browse`, { params: { categoryName, page: 0, size: 100 } }
        );

        const data = response.data;
        const productsData = Array.isArray(data) ? data : data.content || data.data?.content || data.data || [];

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
  }, [categoryName]);

  /* ===============================
     CATEGORY DETAIL PAGE
  ================================= */
  if (categoryName) {
    const totalPages = Math.ceil(products.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentProducts = products.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="text-black py-12">
          <div className="container mx-auto px-4">

            <Link
              to="/categories"
              className="inline-flex items-center gap-2 text-black/80 hover:text-black mb-4"
            >
              <ArrowLeft className="size-5" />
              Quay lại danh mục
            </Link>

            <h1 className="text-4xl font-bold">{categoryName}</h1>

            <p className="text-black/70 mt-2">
              {products.length} sản phẩm
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {productsLoading ? (
            <div className="text-center py-20">
              Đang tải sản phẩm...
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-20">
              Không có sản phẩm
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
     CATEGORY LIST PAGE
  ================================= */
  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="container mx-auto px-4 py-10">

        <h1 className="text-5xl font-bold mb-3 text-[#AF140B]">
          Danh Mục Sản Phẩm
        </h1>

        <p className="text-gray-700 text-lg mb-10 font-semibold">
          Khám phá các danh mục đồ chơi
        </p>

        {categoriesLoading ? (
          <div className="text-center py-20">
            Đang tải danh mục...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.name}`}
                className="group"
              >
                <div className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 text-center border border-gray-100 hover:border-[#AF140B] group overflow-hidden hover:-translate-y-1">

                  {/* background hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFE5E3] to-transparent opacity-0 group-hover:opacity-100 transition"></div>

                  {/* icon */}
                  <div className="relative z-10 flex items-center justify-center mb-4">
                    <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#FFE5E3] group-hover:bg-[#AF140B] transition">
                      <Tag className="size-6 text-[#AF140B] group-hover:text-white transition" />
                    </div>
                  </div>

                  {/* name */}
                  <h3 className="relative z-10 text-lg font-bold text-gray-800 group-hover:text-[#AF140B] transition">
                    {category.name}
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