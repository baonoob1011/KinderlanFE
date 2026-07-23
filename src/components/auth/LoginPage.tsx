import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useApp } from "../../context/AppContext";
import { useAdmin } from "../../context/AdminContext";
import { useEffect } from "react";
import {
  AlertCircle,
  Mail,
  Lock,
  User,
  Phone,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import api from "../../services/api";
import GoogleAuthService from "../../services/googleAuth";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  // common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register-only
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const { loginAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, setUser } = useApp();

  const [showForgotModal, setShowForgotModal] = useState(false);
const [step, setStep] = useState<"email" | "reset">("email");

const [forgotEmail, setForgotEmail] = useState("");
const [otp, setOtp] = useState(["", "", "", "", "", ""]);
const [newPassword, setNewPassword] = useState("");

const [loading, setLoading] = useState(false);
const [countdown, setCountdown] = useState(0);

useEffect(() => {
  if (countdown <= 0) return;

  const timer = setInterval(() => {
    setCountdown((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [countdown]);


const handleOtpChange = (value: string, index: number) => {
  if (!/^[0-9]?$/.test(value)) return;

  const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);

  // auto focus next
  if (value && index < 5) {
    const next = document.getElementById(`otp-${index + 1}`);
    next?.focus();
  }
};

const handleSendOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await api.post("/api/v1/auth/forgot-password", {
      email: forgotEmail,
    });

    toast.success("OTP đã được gửi!");
    setStep("reset");
    setCountdown(60); // 👈 bắt đầu đếm ngược

  } catch (err) {
    toast.error("Gửi OTP thất bại!");
  } finally {
    setLoading(false);
  }
};

const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await api.post("/api/v1/auth/reset-password", {
      email: forgotEmail,
      otp: otp.join(""),
      newPassword,
    });

    toast.success("Đổi mật khẩu thành công!");

    setTimeout(() => {
      setShowForgotModal(false);
      setStep("email");
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
    }, 1200);

  } catch (error) {
    toast.error("OTP không hợp lệ hoặc hết hạn!");
  } finally {
    setLoading(false);
  }
};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.loginWithEmail(email, password);
      console.log("FULL RESPONSE:", response);
      console.log("DATA:", response.data);
      const data = response.data;

      if (!data?.accessToken) {
        toast.error("Không nhận được token!");
        return;
      }

      const { accessToken, refreshToken, role, email: userEmail } = data;

      // Clear any stale tokens first, then set new ones
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('storeId');
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      toast.success("Đăng nhập thành công!");

      if (role === "ROLE_ADMIN") {
        loginAdmin({ id: userEmail, email: userEmail, name: userEmail, role: "admin" });
        navigate("/admin/dashboard");
      } else if (role === "ROLE_MANAGER") {
        // Fetch the manager's assigned store
        let storeId: string | undefined;
        let storeName: string | undefined;
        try {
          const storeRes = await api.get('/api/v1/stores/me');
          const store = storeRes?.data;
          if (store) {
            storeId = String(store.id);
            storeName = store.name;
            localStorage.setItem('storeId', storeId);
            console.log('[Login] manager store:', store.name, 'id:', store.id);
          }
        } catch (storeErr) {
          console.warn('[Login] Could not fetch manager store:', storeErr);
        }
        loginAdmin({ id: userEmail, email: userEmail, name: userEmail, role: "manager", storeId, storeName });
        navigate("/manager/dashboard");
      } else if (role === "ROLE_STAFF") {
        loginAdmin({ id: userEmail, email: userEmail, name: userEmail, role: "staff" });
        navigate("/staff/dashboard");
      } else {
        // CUSTOMER — decode JWT to get real account ID
        let accountId = data.id || "1";
        try {
          const jwtPayload = JSON.parse(atob(accessToken.split('.')[1]));
          accountId = jwtPayload.sub || jwtPayload.id || jwtPayload.accountId || accountId;
        } catch { /* fallback to data.id */ }
        setUser({
          id: String(accountId),
          email: userEmail,
          username: data.username || userEmail.split("@")[0],
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || userEmail.split("@")[0],
          role,
        });

        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại!");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      toast.info("Đang khởi tạo Google Sign-In...");
      const googleAuth = GoogleAuthService.getInstance();
      await googleAuth.initialize();
      const credential = await googleAuth.signIn();

      if (!credential) {
        toast.error("Không nhận được Google credential");
        return;
      }

      toast.info("Đang xác thực với server...");
      const response = await api.loginWithGoogle(credential);
      const data = response.data || response;

      if (!data?.accessToken) {
        toast.error("Phản hồi server không hợp lệ");
        return;
      }

      const { accessToken, refreshToken, email, role } = data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      toast.success(`Chào mừng ${email}!`);

      if (role === "ROLE_ADMIN") {
        loginAdmin({ id: email, email, name: email, role: "admin" });
        navigate("/admin/dashboard");
      } else if (role === "ROLE_MANAGER") {
        let storeId: string | undefined;
        let storeName: string | undefined;
        try {
          const storeRes = await api.get('/api/v1/stores/me');
          const store = storeRes?.data;
          if (store) {
            storeId = String(store.id);
            storeName = store.name;
            localStorage.setItem('storeId', storeId);
          }
        } catch (storeErr) {
          console.warn('[GoogleLogin] Could not fetch manager store:', storeErr);
        }
        loginAdmin({ id: email, email, name: email, role: "manager", storeId, storeName });
        navigate("/manager/dashboard");
      } else if (role === "ROLE_STAFF") {
        loginAdmin({ id: email, email, name: email, role: "staff" });
        navigate("/staff/dashboard");
      } else {
        // Decode JWT to get real account ID
        let accountId = data.id || "1";
        try {
          const jwtPayload = JSON.parse(atob(accessToken.split('.')[1]));
          accountId = jwtPayload.sub || jwtPayload.id || jwtPayload.accountId || accountId;
        } catch { /* fallback */ }
        setUser({
          id: String(accountId),
          email: email,
          username: data.username || email.split("@")[0],
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || email.split("@")[0],
          role,
        });
        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error("Google login failed:", error);
      toast.error("Đăng nhập Google thất bại.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.register({
        username,
        firstName,
        lastName,
        email,
        phone,
        password,
      });

      toast.success("Đăng ký thành công!");

      const loginResponse = await api.loginWithEmail(email, password);

      const data = loginResponse.data || loginResponse;

      if (!data?.accessToken) {
        toast.error("Không nhận được token sau khi đăng ký");
        return;
      }

      const { accessToken, refreshToken, role, email: userEmail } = data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Decode JWT to get real account ID
      let accountId = data.id || "1";
      try {
        const jwtPayload = JSON.parse(atob(accessToken.split('.')[1]));
        accountId = jwtPayload.sub || jwtPayload.id || jwtPayload.accountId || accountId;
      } catch { /* fallback */ }
      setUser({
        id: String(accountId),
        email: userEmail,
        username: data.username || userEmail.split("@")[0],
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || userEmail.split("@")[0],
        role,
      });

      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Đăng ký thất bại!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFE5E3] via-white to-[#FFE5E3]">
      <div className="relative w-full max-w-4xl h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <motion.div
          className="absolute top-0 w-1/2 h-full bg-gradient-to-br from-[#AF140B] to-[#8D0F08] z-10 flex items-center justify-center text-white p-12"
          initial={false}
          animate={{
            left: isLogin ? "50%" : "0%",
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
          }}
        >
          <div className="text-center space-y-6">
            <motion.div
              key={isLogin ? "smile" : "welcome"}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm"
            >
              <Smile className="w-12 h-12" />
            </motion.div>

            <motion.div
              key={isLogin ? "hello" : "welcome-back"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-3">
                {isLogin ? "Chào mừng trở lại!" : "Xin chào, Bạn!"}
              </h2>
              <p className="text-white/90 mb-6 leading-relaxed">
                {isLogin
                  ? "Để tiếp tục kết nối với chúng tôi, vui lòng đăng nhập với thông tin cá nhân."
                  : "Nhập thông tin của bạn để bắt đầu hành trình kỳ diệu cùng KinderLand."}
              </p>
              <p> Hoặc</p>
              <p className="text-white/90 mb-6 leading-relaxed">
                {isLogin
                  ? "Nếu bạn chưa có tài khoản hãy đăng ký để bắt đầu hành trình kỳ diệu cùng KinderLand."
                  : "Nếu đã trở thành bạn với Kinderland hãy đăng nhập để tiếp tục khám phá."}
              </p>
            </motion.div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="px-10 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-[#AF140B] transition-all duration-300"
            >
              {isLogin ? "Đăng Ký" : "Đăng Nhập"}
            </button>
          </div>
        </motion.div>

        <div
          className={`absolute top-0 left-0 w-1/2 h-full flex items-center justify-center p-12 transition-opacity duration-300 ${isLogin
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
            }`}
        >
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Đăng Nhập KinderLand
            </h2>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold mb-4"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Đăng nhập với Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  HOẶC SỬ DỤNG EMAIL
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                icon={<Mail />}
                type="email"
                placeholder="Email"
                value={email}
                onChange={setEmail}
              />
              <Input
                icon={<Lock />}
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={setPassword}
              />
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:text-[#AF140B] transition-colors"
                  onClick={() => setShowForgotModal(true)}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-[#AF140B] text-white shadow-md hover:shadow-lg hover:bg-[#8D0F08] hover:-translate-y-[1px] active:translate-y-0 transition-all"
              >
                Đăng Nhập
              </button>
            </form>
          </div>
        </div>

        <div
          className={`absolute top-0 right-0 w-1/2 h-full flex items-center justify-center p-12 transition-opacity duration-300 ${!isLogin
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
            }`}
        >
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Tạo Tài Khoản
            </h2>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  hoặc sử dụng email để đăng ký:
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <Input
                icon={<User />}
                placeholder="Tên người dùng"
                value={username}
                onChange={setUsername}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Họ" value={lastName} onChange={setLastName} />
                <Input placeholder="Tên" value={firstName} onChange={setFirstName} />
              </div>
              <Input icon={<Mail />} type="email" placeholder="Email" value={email} onChange={setEmail} />
              <Input icon={<Phone />} placeholder="Số điện thoại" value={phone} onChange={setPhone} />
              <Input icon={<Lock />} type="password" placeholder="Mật khẩu" value={password} onChange={setPassword} />
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-[#AF140B] text-white shadow-md hover:shadow-lg hover:bg-[#8D0F08] hover:-translate-y-[1px] active:translate-y-0 transition-all"
              >
                Đăng Ký
              </button>
            </form>
          </div>
        </div>
      </div>
      {showForgotModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 40 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl relative border border-gray-200"
    >

      {/* Close */}
      <button
        onClick={() => {
          setShowForgotModal(false);
          setStep("email");
        }}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg"
      >
        ✕
      </button>

      {/* STEP 1 */}
      {step === "email" && (
        <>
          <h2 className="text-2xl font-bold text-center mb-4">
            Quên mật khẩu
          </h2>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Nhập email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-gray-50 focus:border-[#AF140B] focus:ring-2 focus:ring-[#AF140B]/30"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#AF140B] text-white font-bold flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </form>
        </>
      )}

      {/* STEP 2 */}
      {step === "reset" && (
        <>
          <h2 className="text-2xl font-bold text-center mb-2">
            Nhập mã OTP
          </h2>

          {countdown > 0 && (
            <p className="text-center text-sm text-gray-500 mb-3">
              OTP hết hạn sau <span className="font-bold text-[#AF140B]">{countdown}s</span>
            </p>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">

            {/* OTP BOX */}
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  className="w-12 h-12 text-center border-2 border-gray-300 rounded-xl text-lg font-bold 
                  focus:border-[#AF140B] focus:ring-2 focus:ring-[#AF140B]/40 transition-all"
                />
              ))}
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-gray-50 focus:border-[#AF140B] focus:ring-2 focus:ring-[#AF140B]/30"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#AF140B] text-white font-bold flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>

            {/* BACK */}
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-gray-500 hover:text-black"
            >
              ← Nhập lại email
            </button>

          </form>
        </>
      )}
    </motion.div>
  </div>
)}
    </div>
  );
}

function Input({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon?: React.ReactElement<{ size?: number }>; type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {React.cloneElement(icon, { size: 18 })}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`w-full px-4 py-3 rounded-xl text-sm border border-gray-300 placeholder-gray-400 bg-gray-50 transition-all focus:outline-none focus:border-[#AF140B] focus:ring-2 focus:ring-[#AF140B]/30 focus:bg-white hover:border-gray-400 ${icon ? "pl-12" : ""}`}
      />
    </div>
  );
}

