import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowRight,
  Truck,
  Shield,
  Clock,
  Star,
  TrendingUp,
  BookOpen,
  Check,
  Gift,
  Heart,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { products } from "../../data/products";
import { blogs } from "../../data/blogs";
import NewsletterModal from "../common/NewsletterModal";
import Logo from "../common/Logo";
import { HeroSection } from "../HeroSection";
import ProductCard from "../shop/ProductCard";
import { AboutSection } from "./AboutSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { BrandMarquee } from "./BrandMarquee";
import { TrustedUsers } from "./TrustedUsers";

export default function HomePage() {
  const [showNewsletterModal, setShowNewsletterModal] =
    React.useState(false);
  // const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const featuredBlogs = blogs.slice(0, 3);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  useEffect(() => {
    // fetchBrands();
    fetchCategories();
    fetchNewArrivals();
    fetchFeaturedProducts();
  }, []);

  // const fetchBrands = async () => {
  //   try {
  //     const res = await api.get("/api/v1/brands");
  //     setBrands(res.data);
  //   } catch (error) {
  //     console.error("Fetch brands error:", error);
  //   }
  // };
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      const res = await api.get("/api/v1/categories");

      console.log("Categories API:", res);

      const data = res.data;

      const categoriesData = Array.isArray(data) ? data : data.data;

      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      setNewArrivalsLoading(true);
      const res = await api.get("/api/v1/products", { params: { page: 0, size: 6, sort: "createdDate,desc" } });
      const data = res.data;
      const productsData = Array.isArray(data) ? data : data.content || data.data?.content || data.data || [];
      const mapped = productsData.slice(0, 6).map((item: any) => {
        const discount = item.promotion?.discountPercent || 0;
        const originalPrice = item.minPrice;
        const price = discount > 0 ? originalPrice - (originalPrice * discount) / 100 : originalPrice;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price,
          originalPrice: discount > 0 ? originalPrice : null,
          category: item.categoryName,
          brand: item.brandName,
          image: item.imageUrl,
          rating: item.averageRating || 0,
          reviewCount: item.reviewCount || 0,
        };
      });
      setNewArrivals(mapped);
    } catch (error) {
      console.error("Fetch new arrivals error:", error);
    } finally {
      setNewArrivalsLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true);
      const res = await api.get("/api/v1/products", { params: { page: 0, size: 6 } });
      const data = res.data;
      const productsData = Array.isArray(data) ? data : data.content || data.data?.content || data.data || [];
      const mapped = productsData.slice(0, 6).map((item: any) => {
        const discount = item.promotion?.discountPercent || 0;
        const originalPrice = item.minPrice;
        const price = discount > 0 ? originalPrice - (originalPrice * discount) / 100 : originalPrice;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price,
          originalPrice: discount > 0 ? originalPrice : null,
          category: item.categoryName,
          brand: item.brandName,
          image: item.imageUrl,
          rating: item.averageRating || 0,
          reviewCount: item.reviewCount || 0,
        };
      });
      setFeaturedProducts(mapped);
    } catch (error) {
      console.error("Fetch featured products error:", error);
    } finally {
      setFeaturedLoading(false);
    }
  };


  return (
    <div className="bg-white">
      {/* About Section */}
      <AboutSection />

      {/* Brand Marquee */}
      <BrandMarquee />

      {/* Categories Section */}
      <section className="py-16 bg-[#FFFDF7]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#4A4A4A]">
              Danh Mục Sản Phẩm
            </h2>
            <Link
              to="/categories"
              className="text-[#AF140B] font-semibold hover:text-[#8D0F08] flex items-center gap-2"
            >
              Xem tất cả
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesLoading ? (
              <div className="col-span-6 text-center py-10">
                Đang tải danh mục...
              </div>
            ) : (
              categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.name}`}
                  className="group"
                >
                  <div className="flex items-center justify-center h-32 rounded-2xl bg-gradient-to-br from-[#AF140B] to-[#8D0F08] text-white font-bold text-center p-4 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 hover:scale-105">

                    <span className="text-sm md:text-base">
                      {category.name}
                    </span>

                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#4A4A4A]">
              Sản Phẩm Nổi Bật
            </h2>
            <Link
              to="/products"
              className="text-[#AF140B] font-semibold hover:text-[#8D0F08] flex items-center gap-2"
            >
              Xem tất cả
              <ArrowRight className="size-4" />
            </Link>
          </div>
          {featuredLoading ? (
            <div className="text-center py-10 text-gray-500">Đang tải sản phẩm...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-[#FFFDF7]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-6 text-[#AF140B]" />
              <h2 className="text-2xl font-bold text-[#4A4A4A]">
                Hàng Mới Về
              </h2>
            </div>
            <Link
              to="/products"
              className="text-[#AF140B] font-semibold hover:text-[#8D0F08] flex items-center gap-2 text-sm"
            >
              Xem tất cả
              <ArrowRight className="size-4" />
            </Link>
          </div>
          {newArrivalsLoading ? (
            <div className="text-center py-10 text-gray-500">Đang tải sản phẩm mới...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner CTA */}
      <section className="py-16 bg-gradient-to-r from-[#AF140B] to-[#8D0F08] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ưu Đãi Đặc Biệt Cuối Tuần
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Giảm giá lên đến 50% cho các sản phẩm được chọn lọc
          </p>
          <Link
            to="/discounts"
            className="inline-flex items-center gap-2 bg-white text-[#AF140B] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg"
          >
            Khám Phá Ngay
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="size-8 text-[#AF140B]" />
              <div>
                <h2 className="text-3xl font-bold text-[#4A4A4A]">
                  Blog Nuôi Dạy Con
                </h2>
                <p className="text-gray-600">
                  Kiến thức và kinh nghiệm hữu ích cho cha mẹ
                </p>
              </div>
            </div>
            <Link
              to="/blog"
              className="text-[#AF140B] font-semibold hover:text-[#8D0F08] flex items-center gap-2"
            >
              Xem tất cả
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredBlogs.map((blog) => (
              <Link
                key={blog.id}
                to={`/blog/${blog.id}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all group border-2 border-gray-200 hover:border-[#AF140B]"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#AF140B] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {blog.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#4A4A4A] mb-3 line-clamp-2 group-hover:text-[#AF140B] transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <span className="font-semibold">
                      {blog.author}
                    </span>
                    <span>{formatDate(blog.date)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Trusted Users */}
      <TrustedUsers />

      {/* Newsletter Modal */}
      <NewsletterModal
        show={showNewsletterModal}
        onClose={() => setShowNewsletterModal(false)}
      />
    </div>
  );
}