import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthErrorMessage(error: any): string {
  const msg = error?.message || "";
  if (msg.includes("User already registered")) return "Email này đã được đăng ký. Vui lòng đăng nhập.";
  if (msg.includes("Invalid login credentials")) return "Email hoặc mật khẩu không chính xác.";
  if (msg.includes("Password should be at least 6 characters")) return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (msg.includes("Email not confirmed")) return "Vui lòng xác nhận email trước khi đăng nhập.";
  if (msg.includes("rate limit")) return "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.";
  return msg;
}
