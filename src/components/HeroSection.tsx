import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [ageRange, setAgeRange] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  const handleSearch = () => {
    // This would filter products based on search criteria
    console.log('Searching with:', { searchQuery, category, ageRange, priceRange });
  };

  return (
    <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1659629150656-b6f87bd86954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMHRveXMlMjBraWRzJTIwcGxheXJvb218ZW58MXx8fHwxNzY4NDAxNDQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Text */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Khám phá thế giới đồ chơi tuyệt vời
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Mang niềm vui và sự phát triển toàn diện đến từng nụ cười của bé yêu với hàng ngàn sản phẩm chất lượng
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm bg-white/95">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tên đồ chơi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-input-background"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-input-background"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="dolls">Búp bê & Nhân vật</option>
                <option value="building">Đồ chơi xếp hình</option>
                <option value="vehicles">Xe & Phương tiện</option>
                <option value="educational">Đồ chơi giáo dục</option>
                <option value="outdoor">Đồ chơi ngoài trời</option>
              </select>
            </div>

            {/* Age Range Select */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Độ tuổi
              </label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-input-background"
              >
                <option value="all">Tất cả độ tuổi</option>
                <option value="0-2">0-2 tuổi</option>
                <option value="3-5">3-5 tuổi</option>
                <option value="6-8">6-8 tuổi</option>
                <option value="9-12">9-12 tuổi</option>
                <option value="12+">12+ tuổi</option>
              </select>
            </div>

            {/* Price Range Select */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Giá
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-input-background"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="0-200">Dưới 200.000đ</option>
                <option value="200-500">200.000đ - 500.000đ</option>
                <option value="500-1000">500.000đ - 1.000.000đ</option>
                <option value="1000+">Trên 1.000.000đ</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90 text-white px-12 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
