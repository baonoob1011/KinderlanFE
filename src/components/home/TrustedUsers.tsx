import React from 'react';
import { Star, Check, TrendingUp } from 'lucide-react';

export function TrustedUsers() {
  const trustedUsers = [
    {
      id: 1,
      name: 'Nguyễn Minh Anh',
      role: 'Mẹ của bé Minh Khôi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      location: 'Hà Nội',
      verified: true,
      purchases: 15,
    },
    {
      id: 2,
      name: 'Trần Thị Hương',
      role: 'Mẹ của bé An Nhiên',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      location: 'TP. Hồ Chí Minh',
      verified: true,
      purchases: 23,
    },
    {
      id: 3,
      name: 'Lê Văn Tuấn',
      role: 'Bố của bé Gia Bảo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      location: 'Đà Nẵng',
      verified: true,
      purchases: 12,
    },
    {
      id: 4,
      name: 'Phạm Thu Hà',
      role: 'Mẹ của bé Minh Anh',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      location: 'Hải Phòng',
      verified: true,
      purchases: 19,
    },
    {
      id: 5,
      name: 'Hoàng Minh Tuấn',
      role: 'Bố của bé Phương Anh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      location: 'Cần Thơ',
      verified: true,
      purchases: 8,
    },
    {
      id: 6,
      name: 'Đỗ Thị Mai',
      role: 'Mẹ của bé Quỳnh Chi',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
      location: 'Nha Trang',
      verified: true,
      purchases: 27,
    },
  ];

  // Duplicate for infinite scroll
  const duplicatedUsers = [...trustedUsers, ...trustedUsers];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-[#FFE5E3]/30 overflow-hidden">
      <div className="container mx-auto px-4 mb-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FFE5E3] text-[#AF140B] px-4 py-2 rounded-full font-bold text-sm mb-4">
            <Check className="size-4" />
            <span>KHÁCH HÀNG TIN DÙNG</span>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Hơn 2000+ gia đình tin tưởng chọn
            <span className="text-[#AF140B]"> Kinderland</span>
          </h2>
          
          <p className="text-gray-600 text-lg">
            Khách hàng hài lòng là niềm tự hào của chúng tôi. Cùng khám phá những trải nghiệm tuyệt vời từ cộng đồng phụ huynh.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 mb-10">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-[#AF140B]/20 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#AF140B] mb-1">2,000+</div>
              <div className="text-sm text-gray-600 font-semibold">Khách hàng</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-3xl font-bold text-[#AF140B]">4.9</span>
                <Star className="size-6 fill-[#D4AF37] text-[#D4AF37]" />
              </div>
              <div className="text-sm text-gray-600 font-semibold">Đánh giá TB</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#AF140B] mb-1">99%</div>
              <div className="text-sm text-gray-600 font-semibold">Hài lòng</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="size-6 text-[#AF140B]" />
                <span className="text-3xl font-bold text-[#AF140B]">+85%</span>
              </div>
              <div className="text-sm text-gray-600 font-semibold">Quay lại</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Users - Row 1 (Left to Right) */}
      <div className="relative mb-6">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFE5E3]/30 via-white/50 to-transparent z-10 pointer-events-none" />
        
        <div className="flex">
          <div className="flex animate-scroll-left">
            {duplicatedUsers.map((user, index) => (
              <div
                key={`user-1-${index}`}
                className="flex-shrink-0 mx-3"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 border-2 border-gray-100 hover:border-[#AF140B] w-72 group">
                  <div className="flex items-start gap-4">
                    {/* Avatar with Badge */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-[#FFE5E3] group-hover:ring-[#AF140B] transition-all"
                      />
                      {user.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-[#AF140B] rounded-full p-1 ring-2 ring-white">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 group-hover:text-[#AF140B] transition-colors line-clamp-1">
                          {user.name}
                        </h4>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star className="size-4 fill-[#D4AF37] text-[#D4AF37]" />
                          <span className="text-sm font-bold text-gray-700">5.0</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{user.role}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">📍 {user.location}</span>
                        <span className="bg-[#FFE5E3] text-[#AF140B] px-2 py-1 rounded-full font-bold">
                          {user.purchases} đơn
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 mt-10 text-center">
        <div className="bg-gradient-to-r from-[#AF140B] to-[#D91810] rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">
            Tham gia cộng đồng 2000+ gia đình hạnh phúc!
          </h3>
          <p className="text-white/90 mb-4">
            Mua sắm ngay và nhận ưu đãi đặc biệt cho thành viên mới
          </p>
          <button className="bg-white text-[#AF140B] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
            Khám phá ngay
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 45s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}