import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import ProductCard from "../shop/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import Pagination from "../common/Pagination";
import api from "../../services/api";
import { categoryApi, type Category } from "../../services/categoryApi";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAge, setSelectedAge] = useState("all");
  const [ages, setAges] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";

  // Fetch category tree for parent-child matching
  useEffect(() => {
    categoryApi.getAll()
      .then((data) => setAllCategories(data || []))
      .catch(() => {});
  }, []);

  // Auto-set category filter from URL query param
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }
  }, [categoryParam]);

  // Build set of category names that match selected category (including children of parent)
  const getMatchingCategoryNames = (selected: string): Set<string> => {
    if (selected === "all") return new Set();
    
    const matchSet = new Set<string>([selected]);
    
    // Check if selected is a parent category
    const parentCat = allCategories.find(
      (c) => c.name === selected && !c.parentId
    );
    if (parentCat) {
      // Add all child category names
      allCategories
        .filter((c) => c.parentId === parentCat.id)
        .forEach((child) => matchSet.add(child.name));
    }
    
    return matchSet;
  };

  const matchingCategories = getMatchingCategoryNames(selectedCategory);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.category
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.brand
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "under300" && product.price < 300000) ||
      (priceRange === "300-600" &&
        product.price >= 300000 &&
        product.price < 600000) ||
      (priceRange === "600-1000" &&
        product.price >= 600000 &&
        product.price < 1000000) ||
      (priceRange === "over1000" && product.price >= 1000000);

    const matchesBrand =
      selectedBrand === "all" ||
      product.brand === selectedBrand;
    const matchesCategory =
      selectedCategory === "all" ||
      matchingCategories.has(product.category);
    const matchesAge = 
      selectedAge === "all" || 
      product.ageRange === selectedAge;

    return (
      matchesSearch &&
      matchesPrice &&
      matchesBrand &&
      matchesCategory &&
      matchesAge
    );
  });


  

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(
    sortedProducts.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(
    startIndex,
    endIndex,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    sortBy,
    priceRange,
    selectedBrand,
    selectedCategory,
    selectedAge,
  ]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await api.get("/api/v1/products?size=1000");

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
            ageRange: item.ageRange,

            image: item.imageUrl,

            rating: 4.5,
            reviewCount: 10,

            isBestSeller: false,
            isNew: false,
          };
        });

        setProducts(mappedProducts);

        const uniqueBrands = [
          ...new Set(mappedProducts.map((p) => p.brand)),
        ];

        setBrands(uniqueBrands);
        
        const uniqueCategories = [
          ...new Set(mappedProducts.map((p) => p.category)),
        ];

        setCategories(uniqueCategories);

        const uniqueAges = [
          ...new Set(mappedProducts.map((p) => p.ageRange).filter(Boolean)),
        ] as string[];
        
        setAges(uniqueAges);

      } catch (error) {
        console.error("Lỗi lấy products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);


  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">

          {/* Left Sidebar - Filters */}
          <aside className="hidden md:block w-[240px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-5 sticky top-[140px]">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                <SlidersHorizontal className="size-5 text-[#AF140B]" />
                <h3 className="font-bold text-gray-800 text-base">Bộ lọc</h3>
              </div>

              <div className="space-y-5">
                {/* Sort */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Sắp xếp theo
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] font-medium text-gray-700"
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                    <option value="name">Tên: A-Z</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Khoảng giá
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] font-medium text-gray-700"
                  >
                    <option value="all">Tất cả</option>
                    <option value="under300">Dưới 300.000đ</option>
                    <option value="300-600">300.000đ - 600.000đ</option>
                    <option value="600-1000">600.000đ - 1.000.000đ</option>
                    <option value="over1000">Trên 1.000.000đ</option>
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Thương hiệu
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] font-medium text-gray-700"
                  >
                    <option value="all">Tất cả thương hiệu</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] font-medium text-gray-700"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Độ tuổi
                  </label>
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#AF140B]/20 focus:border-[#AF140B] font-medium text-gray-700"
                  >
                    <option value="all">Tất cả độ tuổi</option>
                    {ages.map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content - Products */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-1 text-[#AF140B]">
                {searchTerm
                  ? `Kết quả tìm kiếm: \"${searchTerm}\"`
                  : selectedCategory !== "all"
                    ? selectedCategory
                    : "Tất Cả Sản Phẩm"}
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Tìm thấy{" "}
                <span className="font-bold text-[#AF140B]">
                  {sortedProducts.length}
                </span>{" "}
                sản phẩm
                {totalPages > 1 &&
                  ` — Trang ${currentPage}/${totalPages}`}
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-20">
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy sản phẩm nào
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Pagination */}
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
      </div>
    </div>
  );
}