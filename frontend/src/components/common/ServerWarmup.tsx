import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { MessageCircle, Loader2 } from "lucide-react";

interface ServerWarmupProps {
  children: React.ReactNode;
}

const ServerWarmup = ({ children }: ServerWarmupProps) => {
  const [isAwake, setIsAwake] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (!isAwake) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAwake]);

  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.get("/ping");
        setIsAwake(true);
      } catch (error) {
        console.log("Server is still warming up, retrying in 3 seconds...");
        setTimeout(checkServer, 3000);
      }
    };

    checkServer();
  }, []);

  if (isAwake) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-purple text-slate-800 p-6 select-none">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl animate-pulse duration-[3000ms]" />

      <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-8 bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-soft border border-violet-100">
        {/* App Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="size-12 bg-gradient-chat rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <MessageCircle className="size-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Moji Chat
          </span>
        </div>

        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="size-24 rounded-full border-4 border-violet-100 border-t-primary animate-spin" />
          <Loader2 className="absolute size-8 text-primary/70 animate-pulse" />
        </div>

        {/* Text content */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">
            Đang khởi động máy chủ...
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Do phiên bản thử nghiệm được chạy trên dịch vụ đám mây miễn phí (Render Free), hệ thống sẽ tự động ngủ sau 15 phút không hoạt động.
          </p>
          <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100/50">
            <p className="text-xs text-primary font-medium leading-relaxed">
              Vui lòng đợi khoảng 30s - 1 phút để hệ thống đánh thức container máy chủ. Cảm ơn sự kiên nhẫn và thông cảm của bạn! 💖
            </p>
          </div>
        </div>

        {/* Progress Timer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span>Thời gian đã đợi:</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
            {timeElapsed} giây
          </span>
        </div>
      </div>
    </div>
  );
};

export default ServerWarmup;
