import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugifyProfile } from "@/lib/personal-card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Building2, Eye, EyeOff, LogIn } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Props {
  toId: string;
  toType: "business" | "personal";
  onSuccess: () => void;
}

type Mode = "signup" | "login";

export function QuickSignupExchange({ toId, toType, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("signup");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---- Send card after auth ----
  const sendCardVisit = async (userId: string, businessId: string | null) => {
    try {
      await supabase.rpc("send_card_visit", {
        _from_business: businessId ?? undefined,
        _to_business: toType === "business" ? toId : undefined,
        _from_user: businessId ? undefined : userId,
        _to_user: toType === "personal" ? toId : undefined,
        _subject: "Xin chào, tôi muốn kết nối giao thương",
        _body: "Tôi vừa quét mã QR của bạn và tạo danh thiếp nhanh để kết nối.",
      });
    } catch (_) {
      // non-fatal — user still registered
    }
  };

  // ---- LOGIN mode ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error || !data?.user) {
      toast.error("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      setLoading(false);
      return;
    }
    await sendCardVisit(data.user.id, null);
    toast.success("Đã đăng nhập và gửi danh thiếp thành công!");
    setLoading(false);
    onSuccess();
  };

  // ---- SIGNUP mode ----
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    const displayName = name.trim() || trimmedEmail.split("@")[0];

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { display_name: displayName, account_type: accountType } },
    });

    if (authError) {
      const msg = (authError.message ?? "").toLowerCase();
      // Email already registered → switch to login
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("user already registered") ||
        msg.includes("already exists") ||
        msg.includes("duplicate")
      ) {
        toast.error("Email này đã có tài khoản.", {
          description: "Vui lòng chuyển sang đăng nhập bên dưới.",
          duration: 5000,
        });
        setMode("login");
        setLoading(false);
        return;
      }
      if (
        msg.includes("rate limit") ||
        msg.includes("over_email_send_rate_limit") ||
        msg.includes("too many")
      ) {
        toast.error("Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.");
        setLoading(false);
        return;
      }
      if (msg.includes("invalid") && msg.includes("email")) {
        toast.error("Địa chỉ email không hợp lệ.");
        setLoading(false);
        return;
      }
      if (msg.includes("password")) {
        toast.error("Mật khẩu không đủ mạnh. Vui lòng dùng ít nhất 6 ký tự.");
        setLoading(false);
        return;
      }
      // Fallback — show raw but friendly
      toast.error("Không thể tạo tài khoản. Vui lòng thử lại.");
      console.error("[QuickSignup] authError:", authError);
      setLoading(false);
      return;
    }

    if (!authData?.user) {
      toast.error("Không thể tạo tài khoản. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    if (!authData.session) {
      toast.success("Tài khoản đã được tạo. Vui lòng xác nhận email để tiếp tục.", {
        description: "Sau khi xác nhận, hãy đăng nhập để hoàn tất kết nối.",
      });
      setMode("login");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    const slug = slugifyProfile(displayName) + "-" + Math.floor(Math.random() * 90000 + 10000);

    // 2. Update profile (non-fatal)
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName, account_type: accountType as any })
        .eq("id", userId);
    if (profileError) {
      toast.error("Không thể lưu thông tin tài khoản. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    let createdBusinessId: string | null = null;

    // 3. Create profile card (non-fatal)
    let cardError: string | null = null;
    try {
      if (accountType === "personal") {
        const { error } = await supabase.from("personal_profiles").upsert({
          user_id: userId,
          full_name: displayName,
          slug,
          email: trimmedEmail,
          phone: phone.trim() || null,
          job_title: "Thành viên mới",
        });
        if (error) cardError = error.message;
      } else {
        const { data: bData, error } = await supabase
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
        if (error) cardError = error.message;
        if (bData) createdBusinessId = bData.id;
      }
    } catch (error) {
      cardError = error instanceof Error ? error.message : String(error);
    }
    if (cardError || (accountType === "business" && !createdBusinessId)) {
      toast.error("Tài khoản đã tạo nhưng chưa tạo được danh thiếp. Vui lòng mở Dashboard để thử lại.", {
        description: cardError ?? undefined,
      });
      setLoading(false);
      onSuccess();
      return;
    }

    // 4. Send card visit (non-fatal)
    await sendCardVisit(userId, createdBusinessId);

    toast.success("Đã tạo tài khoản và kết nối thành công! 🎉");
    setLoading(false);
    onSuccess();
  };

  // ---- RENDER ----
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="font-display text-xl font-bold mb-1">
          {mode === "signup" ? "Tạo danh thiếp nhanh" : "Đăng nhập để kết nối"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {mode === "signup"
            ? "Điền thông tin và tạo tài khoản để gửi danh thiếp."
            : "Nhập tài khoản của bạn để tiếp tục kết nối."}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-primary text-white" : "bg-transparent text-muted-foreground hover:bg-accent"}`}
        >
          Đăng ký mới
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-primary text-white" : "bg-transparent text-muted-foreground hover:bg-accent"}`}
        >
          <LogIn className="w-3.5 h-3.5 inline mr-1" />
          Đăng nhập
        </button>
      </div>

      {mode === "signup" ? (
        <form onSubmit={handleSignup} className="space-y-3">
          {/* Account type */}
          <RadioGroup
            value={accountType}
            onValueChange={(v) => setAccountType(v as "personal" | "business")}
            className="grid grid-cols-2 gap-3"
          >
            <div>
              <RadioGroupItem value="personal" id="type-personal" className="peer sr-only" />
              <Label
                htmlFor="type-personal"
                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-sm"
              >
                <User className="mb-1.5 h-4 w-4" />
                Cá nhân
              </Label>
            </div>
            <div>
              <RadioGroupItem value="business" id="type-business" className="peer sr-only" />
              <Label
                htmlFor="type-business"
                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-sm"
              >
                <Building2 className="mb-1.5 h-4 w-4" />
                Doanh nghiệp
              </Label>
            </div>
          </RadioGroup>

          <Input
            type="email"
            placeholder="Email (bắt buộc)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
          <Input
            placeholder={accountType === "business" ? "Tên doanh nghiệp" : "Họ và tên"}
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
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-vivid text-white border-0 h-11"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Kết nối ngay
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-vivid text-white border-0 h-11"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Đăng nhập & Kết nối
          </Button>
        </form>
      )}
    </div>
  );
}
