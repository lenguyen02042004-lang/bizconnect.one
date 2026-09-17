import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugifyProfile } from "@/lib/personal-card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Building2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Props {
  toId: string;
  toType: "business" | "personal";
  onSuccess: () => void;
}

export function QuickSignupExchange({ toId, toType, onSuccess }: Props) {
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    const password = "Biz@" + Math.random().toString(36).slice(2, 8); // stronger random password
    const displayName = name.trim() || trimmedEmail.split("@")[0];

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: displayName,
          account_type: accountType,
        },
      },
    });

    if (authError) {
      const msg = authError.message || "";
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("User already registered")) {
        toast.error("Email này đã được đăng ký. Vui lòng đăng nhập để trao đổi danh thiếp.");
      } else if (msg.includes("invalid") && msg.includes("email")) {
        toast.error("Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        toast.error("Bạn đã thử đăng ký quá nhiều lần. Vui lòng thử lại sau vài phút.");
      } else {
        toast.error("Không thể tạo tài khoản: " + msg);
      }
      setLoading(false);
      return;
    }

    if (!authData?.user) {
      toast.error("Không thể tạo tài khoản. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Check if email confirmation is required (session is null but user exists)
    const needsConfirmation = !authData.session;

    const slug = slugifyProfile(displayName) + "-" + Math.floor(Math.random() * 9000 + 1000);

    // 2. Update profile
    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        account_type: accountType as any,
      })
      .eq("id", userId);

    let createdBusinessId: string | null = null;

    // 3. Create specific profile card
    if (accountType === "personal") {
      await supabase.from("personal_profiles").upsert({
        user_id: userId,
        full_name: displayName,
        slug,
        email: trimmedEmail,
        phone: phone.trim() || null,
        job_title: "Thành viên mới",
      });
    } else {
      const { data: bData } = await supabase
        .from("businesses")
        .insert({
          owner_id: userId,
          name: displayName,
          slug,
          email: trimmedEmail,
          phone: phone.trim() || null,
          status: "public",
        })
        .select("id")
        .single();

      if (bData) createdBusinessId = bData.id;
    }

    // 4. Send card visit (only if we have a session, i.e. auto-confirmed)
    if (!needsConfirmation) {
      const { error: sendError } = await supabase.rpc("send_card_visit", {
        _from_business: createdBusinessId,
        _to_business: toType === "business" ? toId : null,
        _from_user: accountType === "personal" ? userId : null,
        _to_user: toType === "personal" ? toId : null,
        _subject: "Xin chào, tôi muốn kết nối giao thương",
        _body: "Tôi vừa quét mã QR của bạn và tạo danh thiếp nhanh để kết nối.",
      });

      if (sendError) {
        console.error(sendError);
      }

      toast.success("Đã tạo tài khoản và trao đổi danh thiếp thành công!");
    } else {
      toast.success("Tài khoản đã được tạo! Vui lòng kiểm tra email để xác nhận tài khoản.", {
        duration: 6000,
      });
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-bold mb-1">Tạo danh thiếp nhanh</h3>
        <p className="text-xs text-muted-foreground">
          Chọn loại danh thiếp và nhập thông tin để kết nối.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <RadioGroup
          defaultValue="personal"
          value={accountType}
          onValueChange={(v) => setAccountType(v as "personal" | "business")}
          className="grid grid-cols-2 gap-3 mb-2"
        >
          <div>
            <RadioGroupItem value="personal" id="type-personal" className="peer sr-only" />
            <Label
              htmlFor="type-personal"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
            >
              <User className="mb-2 h-5 w-5" />
              Cá nhân
            </Label>
          </div>
          <div>
            <RadioGroupItem value="business" id="type-business" className="peer sr-only" />
            <Label
              htmlFor="type-business"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
            >
              <Building2 className="mb-2 h-5 w-5" />
              Doanh nghiệp
            </Label>
          </div>
        </RadioGroup>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email (bắt buộc)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            placeholder={
              accountType === "business"
                ? "Tên doanh nghiệp (không bắt buộc)"
                : "Họ và tên (không bắt buộc)"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <Input
            type="tel"
            placeholder="Số điện thoại (không bắt buộc)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <p className="text-[11px] text-muted-foreground italic text-center">
          * Hệ thống sẽ tạo mật khẩu ngẫu nhiên. Kiểm tra email để đặt lại mật khẩu sau khi đăng ký.
        </p>
        <Button
          type="submit"
          className="w-full bg-gradient-vivid text-white border-0 mt-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Kết nối ngay
        </Button>
      </form>
    </div>
  );
}
