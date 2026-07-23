import React, { useState } from 'react';
import { X, Mail, Bell, CheckCircle } from 'lucide-react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    setIsLoading(false);

    // Auto close after 2 seconds
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setEmail('');
      setName('');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#AF140B] via-[#D91810] to-[#AF140B] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="size-5 text-white" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Bell className="size-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Đăng Ký Nhận Thông Báo
          </h2>
          <p className="text-center text-white/90">
            Cập nhật tin tức mới nhất về đồ chơi và ưu đãi hấp dẫn
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AF140B] focus:border-[#AF140B] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#AF140B] focus:border-[#AF140B] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#FFE5E3] rounded-xl p-4">
                <h4 className="font-bold text-gray-800 mb-2 text-sm">
                  Bạn sẽ nhận được:
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#AF140B] flex-shrink-0" />
                    <span>Thông báo sản phẩm mới về</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#AF140B] flex-shrink-0" />
                    <span>Ưu đãi và khuyến mãi độc quyền</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#AF140B] flex-shrink-0" />
                    <span>Bài viết hữu ích về nuôi dạy con</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#AF140B] flex-shrink-0" />
                    <span>Mã giảm giá sinh nhật đặc biệt</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#AF140B] to-[#D91810] text-white py-4 rounded-xl hover:from-[#8D0F08] hover:to-[#AF140B] transition-all shadow-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </button>

              <p className="text-xs text-center text-gray-500">
                Chúng tôi tôn trọng quyền riêng tư của bạn. Thông tin sẽ được bảo mật tuyệt đối.
              </p>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="bg-[#FFE5E3] rounded-full p-4 inline-block mb-4">
                <CheckCircle className="size-16 text-[#AF140B]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Đăng ký thành công!
              </h3>
              <p className="text-gray-600">
                Cảm ơn bạn đã đăng ký. Chúng tôi sẽ gửi thông báo đến email của bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}