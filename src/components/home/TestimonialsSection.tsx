import React from 'react';
import { Star, Quote } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      name: 'Nguyễn Minh Anh',
      role: 'Khách hàng',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5,
      content: 'Chúng tôi đã có những trải nghiệm mua sắm tuyệt vời tại Kinderland. Nhân viên rất chuyên nghiệp và tận tâm. Cảm ơn vì đã mang đến cho chúng tôi những kỷ niệm đáng nhớ!',
    },
    {
      id: 2,
      name: 'Trần Thị Hương',
      role: 'Khách hàng',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      rating: 5,
      content: 'Sản phẩm đồ chơi chất lượng tuyệt vời, an toàn cho bé. Con tôi rất thích những món đồ chơi sáng tạo từ Kinderland. Giao hàng nhanh, nhân viên tư vấn nhiệt tình!',
    },
    {
      id: 3,
      name: 'Lê Văn Tuấn',
      role: 'Khách hàng',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      rating: 5,
      content: 'Cửa hàng có rất nhiều lựa chọn đồ chơi cho các lứa tuổi khác nhau. Giá cả hợp lý, khuyến mãi thường xuyên. Tôi rất hài lòng với dịch vụ của Kinderland!',
    },
  ];

  return (
    <section className="relative bg-[#AF140B] py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="testimonial-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="#FFFFFF" />
              <circle cx="60" cy="60" r="2" fill="#FFFFFF" />
              <path d="M40,10 L45,20 L35,20 Z" fill="#FFFFFF" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#testimonial-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Content */}
          <div className="lg:col-span-4 text-white">
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-white/20 text-white rounded-full text-sm font-bold tracking-wider">
                CHẤT LƯỢNG DỊCH VỤ
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Đánh giá tích cực từ khách hàng
            </h2>

            <p className="text-white/90 text-lg leading-relaxed">
              Đánh giá tích cực từ khách hàng là động lực lớn để chúng tôi tiếp tục cung cấp dịch vụ và đồ chơi tốt nhất. Chúng tôi luôn cố gắng không ngừng nâng cao chất lượng dịch vụ và mang đến những trải nghiệm tuyệt vời cho mỗi khách hàng.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">2000+</div>
                <div className="text-white/70 text-sm">Khách hàng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">4.9/5</div>
                <div className="text-white/70 text-sm">Đánh giá</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">99%</div>
                <div className="text-white/70 text-sm">Hài lòng</div>
              </div>
            </div>
          </div>

          {/* Right - Testimonials Cards */}
          <div className="lg:col-span-8">
            <div className="grid md:grid-cols-1 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border-2 border-white/30 hover:border-white transition-all duration-300 relative group shadow-xl hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Quote Icon */}
                  <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl group-hover:scale-110 transition-transform">
                    <Quote className="w-8 h-8 text-[#AF140B]" fill="currentColor" />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]"
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-white text-lg italic leading-relaxed mb-6">
                    "{testimonial.content}"
                  </p>

                  {/* Customer Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover border-4 border-white/30"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                        <div className="w-3 h-3 bg-[#AF140B] rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">
                        {testimonial.name}
                      </h4>
                      <p className="text-white/70 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-white to-white/50 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-white/50 to-white rounded-full blur-3xl opacity-30 animate-pulse delay-75"></div>
    </section>
  );
}