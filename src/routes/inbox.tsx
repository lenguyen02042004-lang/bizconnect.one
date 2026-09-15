import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getInbox, markMessageRead, getMyQuota } from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Mail, UserPlus, Briefcase, User } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { formatDistanceToNow } from "date-fns";
import { downloadVCard } from "@/lib/vcard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/inbox")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: InboxPage,
  head: () => ({ meta: [{ title: "Hộp thư kết nối — BizConnect.One" }] }),
});

function InboxPage() {
  const { user } = useAuth();
  const inboxFn = useServerFn(getInbox);
  const markRead = useServerFn(markMessageRead);
  const quotaFn = useServerFn(getMyQuota);

  const msgQ = useQuery({
    queryKey: ["inbox"],
    queryFn: () => inboxFn({ data: {} }),
  });
  const quotaQ = useQuery({
    queryKey: ["quota"],
    queryFn: () => quotaFn(),
  });

  const mark = useMutation({
    mutationFn: (id: string) => markRead({ data: { id } }),
    onSuccess: () => msgQ.refetch(),
  });

  return (
    <DashboardShell title="Hộp thư kết nối" subtitle="Quản lý danh thiếp đã nhận và đã gửi.">
      <>
        {quotaQ.data && (
          <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">
                Hạn mức gửi danh thiếp năm {new Date().getFullYear()}
              </span>
              <Badge variant="secondary">
                {Math.max(0, quotaQ.data.limit - quotaQ.data.used_count)} / {quotaQ.data.limit} còn
                lại
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-vivid"
                style={{
                  width: `${Math.min(100, (quotaQ.data.used_count / quotaQ.data.limit) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {msgQ.isLoading && <p className="text-muted-foreground">Đang tải...</p>}
          {msgQ.data?.messages.length === 0 && (
            <p className="text-muted-foreground text-center py-12">Chưa có danh thiếp nào.</p>
          )}
          {msgQ.data?.messages.map((m: any) => {
            // Check if user is the sender (either personal or one of their businesses)
            // Note: Since we only fetch messages the user has access to, if from_user_id == my_id or from_business is mine, it's outgoing.
            // But we don't have is_mine flag on business here. Let's just assume if it's sent to ME, it's incoming.
            const isIncoming = m.to_user_id === user?.id || !!m.to_business; // Simplification, relies on our query
            const senderInfo = m.from_business || m.from_user;
            const receiverInfo = m.to_business || m.to_user;
            const isSenderBiz = !!m.from_business;
            const isReceiverBiz = !!m.to_business;

            const peer = isIncoming ? senderInfo : receiverInfo;
            const peerIsBiz = isIncoming ? isSenderBiz : isReceiverBiz;
            const unread = isIncoming && !m.read_at;

            const myEntity = isIncoming ? receiverInfo : senderInfo;

            return (
              <div
                key={m.id}
                onClick={() => {
                  if (unread) mark.mutate(m.id);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-smooth flex gap-3 items-start ${unread ? "bg-primary/5 border-primary/40" : "bg-card border-border cursor-pointer hover:border-primary/50"}`}
              >
                {peer?.logo_url || peer?.avatar_url ? (
                  <img
                    src={peer.logo_url || peer.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover bg-white shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {peerIsBiz ? (
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isIncoming ? (
                      <Mail className="w-4 h-4 text-primary" />
                    ) : (
                      <Send className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold truncate">
                      {peer?.name || peer?.full_name || "—"}
                    </span>
                    {peerIsBiz && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        Doanh nghiệp
                      </Badge>
                    )}
                    {!peerIsBiz && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        Cá nhân
                      </Badge>
                    )}
                    {unread && <Badge className="bg-primary text-[10px] h-5">Mới</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    {isIncoming ? "Gửi tới:" : "Gửi từ:"}
                    <span className="font-medium text-foreground">
                      {myEntity?.name || myEntity?.full_name}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{m.subject}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.body}</p>

                  {isIncoming && peer && (
                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => {
                          downloadVCard(
                            {
                              id: peer.id,
                              name: peer.name || peer.full_name,
                              slug: peer.slug,
                              logo_url: peer.logo_url || peer.avatar_url || "",
                              banner_url: "",
                              industry: peer.company_name || "",
                              short_intro: peer.job_title || "",
                              phone: peer.phone ?? "",
                              email: peer.email ?? "",
                              website: peer.website ?? "",
                              address: peer.address ?? "",
                              province: peer.province ?? "",
                              country_code: peer.country_code ?? "",
                              country_name: peer.country_code ?? "",
                              socials: {},
                              gallery: [],
                              icon_tier: "standard",
                              views_count: 0,
                              followers_count: 0,
                              lat: 0,
                              lng: 0,
                            } as any,
                            typeof window !== "undefined"
                              ? `${window.location.origin}/${peerIsBiz ? "b" : "p"}/${peer.slug}`
                              : undefined,
                          );
                          toast.success("Đã tải thẻ danh bạ (.vcf)");
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Lưu danh bạ (VCF)
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" asChild>
                        <Link
                          to={peerIsBiz ? "/business/$slug" : "/p/$slug"}
                          params={{ slug: peer.slug }}
                        >
                          Xem card
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    </DashboardShell>
  );
}
