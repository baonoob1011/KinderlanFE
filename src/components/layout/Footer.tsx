import React, { useState } from "react";
import { Link } from "react-router";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import { Logo } from "../common/Logo";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 3000);
    }
  };

  const galleryImages = [
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
    "https://images.unsplash.com/photo-1546776230-bb86256870ce?w=400",
    "https://images.unsplash.com/photo-1612506001235-f0d0892aa11b?w=400",
    "https://images.unsplash.com/photo-1602734846297-9299fc2d4703?w=400",
  ];

  return (
    <footer>
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-[#AF140B] to-[#8D0F08] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white md:max-w-md">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Đăng ký ngay để nhận các ưu đãi đặc biệt, khuyến
                mãi hấp dẫn và tin tức mới nhất về đồ chơi
              </h3>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex gap-2 w-full md:w-auto"
            >
              <input
                type="email"
                placeholder="Email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 md:w-80 px-6 py-4 rounded-lg bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:border-white transition-all"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-[#AF140B] font-bold rounded-lg hover:bg-gray-50 transition-all shadow-lg whitespace-nowrap"
              >
                {subscribed ? "Đã đăng ký!" : "Đăng ký"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[#4A4A4A] text-white py-12 border-t-4 border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div>
              <div className="mb-4">
                <Logo size="default" />
              </div>
              <p className="text-white/90 mb-6 leading-relaxed">
                Kinderland tự hào là điểm đến tin cậy cho cha mẹ
                trong việc mang đến những món đồ chơi chất
                lượng, an toàn và phát triển toàn diện cho trẻ
                em.
              </p>

              {/* Social Media */}
              <div className="flex gap-3">
                {[
                  {
                    icon: Facebook,
                    color: "hover:bg-blue-600",
                    link: "#",
                  },
                  {
                    icon: Instagram,
                    color: "hover:bg-pink-500",
                    link: "#",
                  },
                  {
                    icon: Twitter,
                    color: "hover:bg-blue-400",
                    link: "#",
                  },
                  {
                    icon: Youtube,
                    color: "hover:bg-red-600",
                    link: "#",
                  },
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 bg-white/20 rounded-lg ${social.color} transition-all hover:scale-110`}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* About Us Links */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">
                Về chúng tôi
              </h3>
              <ul className="space-y-3">
                {[
                  {
                    label: "Câu chuyện Kinderland",
                    path: "/about",
                  },
                  { label: "Blog & Tin tức", path: "/blog" },
                  {
                    label: "Làm việc cùng chúng tôi",
                    path: "/careers",
                  },
                  {
                    label: "Chính sách đối tác",
                    path: "/partner",
                  },
                  {
                    label: "Điều khoản dịch vụ",
                    path: "/terms",
                  },
                  {
                    label: "Chính sách bảo mật",
                    path: "/privacy",
                  },
                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.path}
                      className="text-white/80 hover:text-white hover:translate-x-2 transition-all inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">
                Thông tin liên hệ
              </h3>
              <ul className="space-y-4">
              
                <li className="flex items-center gap-3">
                  <div className="p-2 bg-[#AF140B] rounded-lg flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <a
                    href="tel:+842873008800"
                    className="text-white/90 hover:text-white transition-colors"
                  >
                    (+84) 28-7300-8800
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 bg-[#AF140B] rounded-lg flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <a
                    href="mailto:contact@kinderland.vn"
                    className="text-white/90 hover:text-white transition-colors"
                  >
                    contact@kinderland.vn
                  </a>
                </li>
                  <li className="flex items-start gap-3">
                  <div className="p-2 bg-[#AF140B] rounded-lg mt-1 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-white/90">
                    <p className="font-semibold text-white mb-1">
                      Trụ sở chính
                    </p>
                    <p>107/3/23 Cách Mạng Tháng 8,</p>
                    <p>P.7, Q.Tân Bình, TP.HCM</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Gallery */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">
                Hình ảnh
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden group cursor-pointer border-2 border-white/20"
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#3A3A3A] py-6 border-t-2 border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/90 text-sm">
            <p>
              © 2026 Kinderland. All rights reserved. Made with
              ❤️ for kids
            </p>
            <div className="flex gap-6">
              <Link
                to="/terms"
                className="hover:text-white transition-colors"
              >
                Điều khoản
              </Link>
              <Link
                to="/privacy"
                className="hover:text-white transition-colors"
              >
                Bảo mật
              </Link>
              <Link
                to="/sitemap"
                className="hover:text-white transition-colors"
              >
                Sơ đồ trang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}