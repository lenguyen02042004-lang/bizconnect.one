import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, MailOpen, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function PlatformContactsSection({ listFn, markReadFn }: { listFn: any; markReadFn: any }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: () => listFn(),
  });

  const markMutation = useMutation({
    mutationFn: (id: string) => markReadFn({ id }),
    onSuccess: () => {
      toast.success("Đã đánh dấu đã đọc");
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
    },
    onError: (e: any) => {
      toast.error(e.message ?? "Lỗi khi cập nhật");
    },
  });

  const contacts = data?.contacts || [];

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Mail className="w-5 h-5 text-muted-foreground" />
          Tin nhắn liên hệ từ khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center bg-muted/30 rounded-xl">
            Chưa có tin nhắn liên hệ nào.
          </p>
        ) : (
          <div className="space-y-4">
            {contacts.map((c: any) => (
              <div
                key={c.id}
                className={`p-5 rounded-xl border transition-all ${
                  c.is_read
                    ? "bg-muted/20 border-border opacity-70"
                    : "bg-background border-primary/20 shadow-sm"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{c.name}</span>
                      {!c.is_read && (
                        <span className="bg-primary text-primary-foreground text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Email:{" "}
                        <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                          {c.email}
                        </a>
                      </span>
                      {c.phone && <span>SĐT: {c.phone}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ngày gửi: {format(new Date(c.created_at), "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                  {!c.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markMutation.mutate(c.id)}
                      disabled={markMutation.isPending}
                      className="shrink-0"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Đánh dấu đã đọc
                    </Button>
                  )}
                </div>

                <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
                  {c.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
