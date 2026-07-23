import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { CreditCard, Building2, Loader2 } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useApp();
  const [processing, setProcessing] = useState(false);

  const orderInfo = location.state?.orderInfo;

  useEffect(() => {
    if (!orderInfo) {
      navigate('/');
    }
  }, [orderInfo, navigate]);

  if (!orderInfo) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handlePayment = () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      clearCart();
      navigate('/order-success', { state: { orderInfo } });
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh Toán</h1>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Thông Tin Thanh Toán
          </h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-bold text-xl text-purple-600">
                {formatPrice(orderInfo.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức:</span>
              <span className="font-semibold">
                {orderInfo.paymentMethod === 'BANK' 
                  ? 'Chuyển khoản ngân hàng' 
                  : 'Thẻ tín dụng/Ghi nợ'}
              </span>
            </div>
          </div>

          {orderInfo.paymentMethod === 'BANK' ? (
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="size-6 text-purple-600" />
                <h3 className="font-bold text-gray-800">Thông Tin Chuyển Khoản</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-semibold">Vietcombank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tài khoản:</span>
                  <span className="font-semibold">0123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chủ tài khoản:</span>
                  <span className="font-semibold">Cửa Hàng Đồ Chơi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nội dung:</span>
                  <span className="font-semibold">
                    {orderInfo.name} {orderInfo.phone}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="size-6 text-purple-600" />
                <h3 className="font-bold text-gray-800">Thông Tin Thẻ</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số thẻ
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày hết hạn
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chủ thẻ
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="NGUYEN VAN A"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-purple-600 text-white py-4 rounded-xl hover:bg-purple-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
        >
          {processing ? (
            <>
              <Loader2 className="size-6 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Xác Nhận Thanh Toán'
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Demo - Nhấn nút để mô phỏng thanh toán thành công
        </p>
      </div>
    </div>
  );
}