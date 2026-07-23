import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";

export function BrandMarquee() {
  const [brands, setBrands] = useState<any[]>([]);
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get("/api/v1/brands");

        console.log("Brands API:", res);

        setBrands(res.data);
      } catch (error) {
        console.error("Fetch brands error:", error);
      }
    };

    fetchBrands();
  }, []);

  const duplicatedBrands = [...brands, ...brands];
  return (
    <section className="py-12 bg-gradient-to-r from-[#FFE5E3] via-white to-[#FFE5E3] overflow-hidden border-y-2 border-[#AF140B]/10">
      <div className="container mx-auto px-4 mb-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Thương Hiệu Hàng Đầu
          </h2>
          <p className="text-gray-600">
            Đối tác tin cậy của Kinderland
          </p>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FFE5E3] via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFE5E3] via-white/80 to-transparent z-10 pointer-events-none" />

        {/* Sliding Track */}
        <div className="flex">
          <div className="flex animate-marquee">
            {duplicatedBrands.map((brand, index) => (
              <Link
                key={`${brand.id}-${index}`}
                to={`/brands/${brand.name}`}
                className="flex-shrink-0 mx-4 group"
              >
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 hover:border-[#AF140B] w-48 h-32 flex flex-col items-center justify-center group-hover:scale-105 transform">

                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-10 mb-2 object-contain"
                  />

                  <p className="font-bold text-gray-800 text-center group-hover:text-[#AF140B] transition-colors">
                    {brand.name}
                  </p>

                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-[#AF140B] text-xl">✓</span>
            <span className="font-semibold">100% Hàng chính hãng</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#AF140B] text-xl">✓</span>
            <span className="font-semibold">Bảo hành toàn cầu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#AF140B] text-xl">✓</span>
            <span className="font-semibold">20+ thương hiệu nổi tiếng</span>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 40s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}