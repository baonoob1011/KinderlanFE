import React from "react";
import ProductCard from "../shop/ProductCard";
import { products } from "../../data/products";
import { Sparkles, TrendingUp } from "lucide-react";
import NewsletterModal from "../common/NewsletterModal";
import Pagination from "../common/Pagination";

export default function NewArrivalsPage() {
  const [showNewsletterModal, setShowNewsletterModal] =
    React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 20;

  // Mock new arrivals - in real app, filter by date
  const newProducts = products.slice(30, 50); // Last 20 products as "new"

  // Pagination
  const totalPages = Math.ceil(
    newProducts.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = newProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full mb-4 backdrop-blur-sm">
            <Sparkles className="size-6" />
            <span className="font-bold text-lg">
              HÀNG MỚI VỀ
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Sản Phẩm Mới Nhất
          </h1>
          <p className="text-xl text-white/90">
            Cập nhật liên tục các món đồ chơi hot nhất thị
            trường
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-700 mb-8 font-semibold">
          {newProducts.length} sản phẩm mới nhất
          {totalPages > 1 &&
            ` - Trang ${currentPage}/${totalPages}`}
        </p>

        {currentProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              Chưa có sản phẩm mới
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

      {/* Newsletter Modal */}
      <NewsletterModal
        isOpen={showNewsletterModal}
        onClose={() => setShowNewsletterModal(false)}
      />
    </div>
  );
}