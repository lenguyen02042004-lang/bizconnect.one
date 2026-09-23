import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

interface ClaimBusinessDialogProps {
  businessId: string;
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimBusinessDialog({
  businessId,
  businessName,
  isOpen,
  onClose,
}: ClaimBusinessDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [proofText, setProofText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này.");
      navigate({ to: "/login" });
      return;
    }

    if (!proofText.trim()) {
      toast.error("Vui lòng cung cấp thông tin chứng minh.");
      return;
    }

    setLoading(true);

    // Check if user already has a pending claim for this business
    const { data: existingClaim } = await supabase
      .from("business_claims")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingClaim) {
      setLoading(false);
      toast.error("Bạn đã gửi yêu cầu cho doanh nghiệp này. Vui lòng chờ admin phê duyệt.");
      onClose();
      return;
    }

    const { error } = await supabase.from("business_claims").insert({
      business_id: businessId,
      user_id: user.id,
      proof_text: proofText,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
    } else {
      toast.success(
        "Yêu cầu nhận quyền quản lý đã được gửi thành công! Admin sẽ kiểm tra và phê duyệt sớm nhất.",
      );
      onClose();
      setProofText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Nhận quyền quản lý
          </DialogTitle>
          <DialogDescription>
            Bạn đang yêu cầu quyền quản lý trang doanh nghiệp <strong>{businessName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="proof">Thông tin chứng minh (Bắt buộc)</Label>
            <Textarea
              id="proof"
              placeholder="Vui lòng cung cấp email công ty, số điện thoại hoặc vai trò của bạn tại doanh nghiệp này để Admin có thể xác thực..."
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              required
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
