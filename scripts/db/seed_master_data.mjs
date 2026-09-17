import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const GLOBAL_INDUSTRIES = [
  { name: "Công nghệ thông tin", slug: "technology", icon: "Cpu" },
  { name: "Tài chính - Ngân hàng", slug: "finance", icon: "Landmark" },
  { name: "Bất động sản", slug: "real-estate", icon: "Building2" },
  { name: "Sản xuất & Công nghiệp", slug: "manufacturing", icon: "Factory" },
  { name: "Nhựa & Cao su", slug: "plastic", icon: "Factory" }, // specifically requested by user
  { name: "Thương mại - Bán lẻ", slug: "retail", icon: "ShoppingBag" },
  { name: "Du lịch - Khách sạn", slug: "hospitality", icon: "Plane" },
  { name: "Giáo dục & Đào tạo", slug: "education", icon: "GraduationCap" },
  { name: "Y tế - Sức khỏe", slug: "healthcare", icon: "HeartPulse" },
  { name: "Thực phẩm & Đồ uống", slug: "food-beverage", icon: "UtensilsCrossed" },
  { name: "Logistics - Vận tải", slug: "logistics", icon: "Truck" },
  { name: "Nông nghiệp", slug: "agriculture", icon: "Wheat" },
  { name: "Năng lượng", slug: "energy", icon: "Zap" },
  { name: "Truyền thông - Marketing", slug: "marketing", icon: "Megaphone" },
  { name: "Tư vấn - Pháp lý", slug: "consulting", icon: "Scale" },
  { name: "Xây dựng", slug: "construction", icon: "HardHat" },
  { name: "Thời trang - Làm đẹp", slug: "fashion", icon: "Shirt" },
  { name: "Giải trí - Nghệ thuật", slug: "entertainment", icon: "Music" },
  { name: "Ô tô - Xe máy", slug: "automotive", icon: "Car" },
  { name: "Dược phẩm", slug: "pharmaceutical", icon: "HeartPulse" },
  { name: "Hoá chất", slug: "chemical", icon: "Factory" },
  { name: "Dệt may", slug: "textile", icon: "Shirt" },
  { name: "Bao bì", slug: "packaging", icon: "Factory" },
  { name: "Khác", slug: "other", icon: "MoreHorizontal" },
];

const COUNTRIES = [
  { code: "VN", name: "Việt Nam", flag: "🇻🇳" },
  { code: "US", name: "Hoa Kỳ", flag: "🇺🇸" },
  { code: "CN", name: "Trung Quốc", flag: "🇨🇳" },
  { code: "JP", name: "Nhật Bản", flag: "🇯🇵" },
  { code: "KR", name: "Hàn Quốc", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "TH", name: "Thái Lan", flag: "🇹🇭" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "IN", name: "Ấn Độ", flag: "🇮🇳" },
  { code: "TW", name: "Đài Loan", flag: "🇹🇼" },
  { code: "HK", name: "Hồng Kông", flag: "🇭🇰" },
  { code: "AU", name: "Úc", flag: "🇦🇺" },
  { code: "GB", name: "Vương quốc Anh", flag: "🇬🇧" },
  { code: "DE", name: "Đức", flag: "🇩🇪" },
  { code: "FR", name: "Pháp", flag: "🇫🇷" },
  { code: "IT", name: "Ý", flag: "🇮🇹" },
  { code: "ES", name: "Tây Ban Nha", flag: "🇪🇸" },
  { code: "NL", name: "Hà Lan", flag: "🇳🇱" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Ả Rập Saudi", flag: "🇸🇦" },
  { code: "ZA", name: "Nam Phi", flag: "🇿🇦" },
  { code: "RU", name: "Nga", flag: "🇷🇺" },
];

(async () => {
  try {
    console.log("Seeding Industries...");
    const { error: indError } = await supabase
      .from("industries")
      .upsert(GLOBAL_INDUSTRIES, { onConflict: "slug" });
    if (indError) throw indError;
    console.log("✅ Industries seeded successfully.");

    console.log("Seeding Countries...");
    const { error: ctrError } = await supabase
      .from("countries")
      .upsert(COUNTRIES, { onConflict: "code" });
    if (ctrError) throw ctrError;
    console.log("✅ Countries seeded successfully.");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  }
})();
