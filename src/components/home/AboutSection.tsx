import React from 'react';
import { Check, Truck, CreditCard, Headphones } from 'lucide-react';
import { Logo } from '../common/Logo';

export function AboutSection() {
  return (
    <section className="relative bg-[#AF140B] py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="toy-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="2" fill="#FFFFFF" />
              <circle cx="75" cy="75" r="2" fill="#FFFFFF" />
              <path d="M50,10 L60,30 L40,30 Z" fill="#FFFFFF" />
              <rect x="10" y="60" width="15" height="15" fill="#FFFFFF" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#toy-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            {/* Logo */}
            <div className="mb-6 inline-block">
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <Logo size="default" />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent">
                TRẢI NGHIỆM MUA SẮM ĐỒ CHƠI
              </span>
              <br />
              <span className="text-white">ĐỘC ĐÁO VÀ KÝ NIỆM KHÓ QUÊN</span>
            </h2>

            {/* Description */}
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              Chúng tôi tự hào giới thiệu với bạn một trải nghiệm mua sắm đồ chơi tuyệt vời, nơi bạn có thể 
              khám phá những sản phẩm độc đáo, trải nghiệm văn hóa đa dạng và tạo ra những 
              kỷ niệm tuyệt đẹp. Với sự tận tâm và chuyên nghiệp, chúng tôi cam kết 
              đem cho bạn những kỷ niệm và giá trị trên mỗi hành trình.
            </p>

            {/* Checklist */}
            <div className="space-y-4">
              {[
                'Trải nghiệm mua sắm đồ chơi độc đáo',
                'Hướng dẫn chuyên nghiệp',
                'Dịch vụ chất lượng cao'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Images - Overlapping circles */}
          <div className="relative h-[500px] lg:h-[600px]">
            {/* Large circle - Back */}
            <div className="absolute top-0 right-0 w-[300px] h-[400px] md:w-[350px] md:h-[450px] rounded-[200px] overflow-hidden shadow-2xl border-4 border-white transform rotate-12 hover:rotate-6 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800"
                alt="Toys Collection"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Small circle - Front */}
            <div className="absolute bottom-12 left-0 w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-full overflow-hidden shadow-2xl border-4 border-white transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
              <img
                src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800"
                alt="Happy Kids"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Decorative elements */}
            <div className="absolute top-20 left-20 w-16 h-16 bg-white rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute bottom-40 right-20 w-20 h-20 bg-white rounded-full blur-xl opacity-30 animate-pulse delay-75"></div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Services */}
      <div className="mt-20 bg-white py-8 border-t-4 border-white/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: 'Miễn phí vận chuyển',
                desc: 'Giao hàng nhanh chóng trên toàn quốc'
              },
              {
                icon: CreditCard,
                title: 'Giá cả ưu đãi',
                desc: 'Tiết kiệm tiền với giá cả cạnh tranh và ưu đãi độc quyền'
              },
              {
                icon: Headphones,
                title: 'Dịch vụ đáng tin',
                desc: 'Trải nghiệm dịch vụ chuyên nghiệp và hỗ trợ 24/7'
              }
            ].map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="flex items-start gap-4 text-[#2C2C2C]">
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#AF140B] to-[#D91810] p-4 rounded-xl shadow-lg border-2 border-[#D4AF37]/20">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{service.title}</h3>
                    <p className="text-[#2C2C2C]/80 text-sm">{service.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}