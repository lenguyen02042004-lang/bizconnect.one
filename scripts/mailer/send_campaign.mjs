import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import 'dotenv/config';

// Khởi tạo Supabase
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Khởi tạo Resend SDK
if (!process.env.RESEND_API_KEY) {
  console.error("❌ Thiếu RESEND_API_KEY trong file .env!");
  process.exit(1);
}
const resend = new Resend(process.env.RESEND_API_KEY);

// Địa chỉ gửi đi. Phải là email thuộc tên miền đã Verify trên Resend.
// Ví dụ: hello@bizconnect.one
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || "hello@bizconnect.one";

async function runCampaign() {
  console.log("🚀 Bắt đầu chiến dịch Gửi Email Tự động qua Resend...");

  // 1. Tìm các doanh nghiệp có email, chưa từng được liên hệ, tối đa 100 người/ngày
  const { data: targets, error } = await supabase
    .from("businesses")
    .select("id, name, email")
    .not("email", "is", null)
    .is("contacted_at", null)
    .limit(100);

  if (error) {
    console.error("❌ Lỗi truy vấn DB:", error);
    return;
  }

  if (!targets || targets.length === 0) {
    console.log("✅ Không còn doanh nghiệp nào mới để gửi email hôm nay.");
    return;
  }

  console.log(`📧 Tìm thấy ${targets.length} doanh nghiệp mục tiêu. Chuẩn bị gửi...`);

  let successCount = 0;

  for (const biz of targets) {
    try {
      // 2. Tạo Link Bàn Giao độc nhất
      const { data: inviteCode, error: inviteErr } = await supabase.rpc(
        "create_business_invite",
        { p_business_id: biz.id, p_created_by: null }
      );

      if (inviteErr || !inviteCode) {
        console.log(`⚠️ Bỏ qua ${biz.name}: Không tạo được link bàn giao.`);
        continue;
      }

      const claimLink = `https://bizconnect.one/business/${biz.id}?invite=${inviteCode}`;

      // 3. Gọi Resend API để gửi Mail
      const { data, error: sendErr } = await resend.emails.send({
        from: `BizConnect.One <${SENDER_EMAIL}>`,
        to: biz.email,
        subject: `[Quan Trọng] Yêu cầu tiếp quản hồ sơ doanh nghiệp ${biz.name} trên BizConnect`,
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #e11d48; margin: 0;">BizConnect.One</h1>
            </div>
            <h2>Kính gửi đại diện ${biz.name},</h2>
            <p>Hồ sơ doanh nghiệp của quý vị đã được khởi tạo trên nền tảng kết nối giao thương B2B quốc tế <strong>BizConnect.One</strong>.</p>
            <p>Tuy nhiên, hồ sơ này hiện <strong>chưa có chủ sở hữu quản lý</strong>, khiến quý vị có thể bỏ lỡ các yêu cầu báo giá và kết nối từ đối tác.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${claimLink}" style="background-color: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Kích hoạt & Tiếp quản Hồ sơ ngay
              </a>
            </div>
            
            <p style="font-size: 14px; color: #555;">
              Việc tiếp quản hồ sơ là hoàn toàn miễn phí và giúp doanh nghiệp hiển thị chuyên nghiệp hơn trước hàng ngàn người mua hàng quốc tế.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888;">
              Trân trọng,<br>
              <strong>Đội ngũ Phát triển BizConnect.One</strong><br>
              Đây là email tự động, vui lòng không trả lời.
            </p>
          </div>
        `
      });

      if (sendErr) {
        console.log(`❌ Lỗi gửi từ Resend cho ${biz.name}:`, sendErr.message);
        continue;
      }
      
      // 4. Đánh dấu đã liên hệ để không bao giờ gửi trùng lặp 
      await supabase.from("businesses").update({ contacted_at: new Date().toISOString() }).eq("id", biz.id);
      
      console.log(`✅ Đã gửi thành công tới: ${biz.name} (${biz.email}) - ResendID: ${data.id}`);
      successCount++;

      // Delay 2 giây giữa các lần gửi để không bị Rate Limit API
      await new Promise(res => setTimeout(res, 2000));

    } catch (err) {
      console.log(`❌ Lỗi hệ thống khi xử lý ${biz.name}:`, err.message);
    }
  }

  console.log(`🎉 Chiến dịch hoàn tất! Đã gửi thành công ${successCount}/${targets.length} email.`);
}

runCampaign();
