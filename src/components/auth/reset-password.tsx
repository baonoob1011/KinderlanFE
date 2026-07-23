import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router";
import api from "../../services/api";

export default function ResetPasswordPage() {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Thiếu email!");
      navigate("/forgot-password");
      return;
    }

    try {
      await api.post("/api/v1/auth/reset-password", {
        email,
        otp,
        newPassword: password,
      });

      toast.success("Đổi mật khẩu thành công!");

      // ⏱ delay nhẹ cho user thấy toast rồi redirect
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("OTP không hợp lệ hoặc đã hết hạn!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFE5E3] via-white to-[#FFE5E3]">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">

        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Đặt lại mật khẩu
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Nhập OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:border-[#AF140B]"
          />

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:border-[#AF140B]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold bg-[#AF140B] text-white hover:bg-[#8D0F08] transition-all"
          >
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}