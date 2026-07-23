import { useState } from "react";

interface UserAvatarProps {
  /** URL ảnh đại diện (Google trả trong claim "picture"). */
  src?: string | null;
  /** Tên dùng để lấy chữ cái đầu khi không có ảnh. */
  name?: string | null;
  /** Kích thước px. */
  size?: number;
  className?: string;
}

/**
 * Ảnh đại diện có fallback: không có ảnh (hoặc ảnh lỗi) thì hiện chữ cái đầu.
 *
 * Ảnh Google (lh3.googleusercontent.com) thỉnh thoảng trả 403 khi hết hạn cache,
 * nên luôn phải có nhánh dự phòng thay vì để vỡ ảnh.
 */
export default function UserAvatar({ src, name, size = 40, className = "" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`rounded-full bg-white overflow-hidden flex items-center justify-center font-bold text-[#AF140B] shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={name || "Ảnh đại diện"}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
}
