import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthErrorMessage(error: any): string {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("user already registered") || msg.includes("already been registered") || msg.includes("already registered")) 
    return "Email này đã được đăng ký. Vui lòng đăng nhập.";
  if (msg.includes("invalid login credentials")) 
    return "Email hoặc mật khẩu không chính xác.";
  if (msg.includes("password should be at least 6")) 
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (msg.includes("email not confirmed")) 
    return "Vui lòng xác nhận email trước khi đăng nhập.";
  if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) 
    return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau vài phút.";
  if (msg.includes("invalid") && msg.includes("email"))
    return "Địa chỉ email không hợp lệ.";
  if (msg.includes("signup is disabled") || msg.includes("signups not allowed"))
    return "Tính năng đăng ký hiện đang tạm khóa. Vui lòng thử lại sau.";
  return error?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
}
