import { Truck, RefreshCcw, ShieldCheck, Phone, Headphones, Gift } from 'lucide-react';

const marqueeItems = [
  { icon: Truck, text: 'Miễn phí giao hàng đơn từ 500.000đ' },
  { icon: RefreshCcw, text: 'Đổi trả trong 7 ngày' },
  { icon: Phone, text: 'Hotline: (+84) 28-7300-8800 (8:00 - 22:00)' },
  { icon: ShieldCheck, text: 'Bảo hành chính hãng' },
  { icon: Truck, text: 'Giao hàng nhanh toàn quốc' },
  { icon: Headphones, text: 'Hỗ trợ 24/7' },
  { icon: Gift, text: 'Chương trình thành viên - Tích điểm đổi quà' },
];

export default function TopMarquee() {
  // Duplicate items for seamless loop
  const items = [...marqueeItems, ...marqueeItems];

  return (
    <div className="bg-[#AF140B] overflow-hidden whitespace-nowrap relative">
      <div className="animate-marquee inline-flex items-center gap-8 py-1.5">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 text-white text-xs font-medium shrink-0"
            >
              <Icon className="size-3.5 flex-shrink-0" />
              {item.text}
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
