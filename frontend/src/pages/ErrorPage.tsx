import { useNavigate, useSearchParams } from "react-router";
import { AlertTriangle, Home, RefreshCw, ShieldAlert, FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDetails {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  glowClass: string;
}

const ErrorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Lấy mã lỗi từ query param (ví dụ: ?code=403), nếu không có mặc định là 404
  const errorCode = searchParams.get("code") || "404";

  const errorMap: Record<string, ErrorDetails> = {
    "404": {
      title: "404",
      subtitle: "Không tìm thấy trang",
      description: "Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển sang một địa chỉ khác.",
      icon: <FileQuestion className="size-16 animate-bounce text-violet-500" />,
      colorClass: "from-violet-500 to-indigo-600 bg-clip-text text-transparent",
      glowClass: "bg-violet-500/20",
    },
    "403": {
      title: "403",
      subtitle: "Truy cập bị từ chối",
      description: "Bạn không có quyền truy cập vào tài nguyên này. Vui lòng đăng nhập bằng tài khoản có quyền truy cập.",
      icon: <ShieldAlert className="size-16 text-pink-500 animate-pulse" />,
      colorClass: "from-pink-500 to-rose-600 bg-clip-text text-transparent",
      glowClass: "bg-pink-500/20",
    },
    "500": {
      title: "500",
      subtitle: "Lỗi máy chủ",
      description: "Đã xảy ra lỗi không mong muốn trên hệ thống của chúng tôi. Chúng tôi đang tích cực khắc phục sự cố này.",
      icon: <AlertTriangle className="size-16 text-amber-500 animate-pulse duration-[3000ms]" />,
      colorClass: "from-amber-500 to-orange-600 bg-clip-text text-transparent",
      glowClass: "bg-amber-500/20",
    },
  };

  // Nếu là mã lỗi lạ thì dùng template 404 hoặc custom
  const currentError = errorMap[errorCode] || {
    title: errorCode,
    subtitle: searchParams.get("message") || "Đã xảy ra lỗi",
    description: "Hệ thống gặp sự cố không xác định. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
    icon: <AlertTriangle className="size-16 text-rose-500 animate-pulse" />,
    colorClass: "from-rose-500 to-red-600 bg-clip-text text-transparent",
    glowClass: "bg-rose-500/20",
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-purple text-slate-800 p-6 select-none">
      {/* Background glowing effects */}
      <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse ${currentError.glowClass}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse duration-[3000ms] ${currentError.glowClass}`} />

      <div className="relative flex flex-col items-center max-w-lg w-full text-center space-y-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 md:p-10 rounded-2xl shadow-soft border border-violet-100 dark:border-slate-800 transition-smooth">
        
        {/* Animated Icon Wrapper */}
        <div className="flex items-center justify-center size-28 rounded-full bg-violet-50 dark:bg-slate-800 border border-violet-100 dark:border-slate-700 shadow-inner">
          {currentError.icon}
        </div>

        {/* Error Code & Details */}
        <div className="space-y-3">
          <h1 className={`text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r ${currentError.colorClass}`}>
            {currentError.title}
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {currentError.subtitle}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {currentError.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 border-violet-200 hover:bg-violet-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại</span>
          </Button>
          
          <Button 
            variant="outline"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 border-violet-200 hover:bg-violet-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={handleReload}
          >
            <RefreshCw className="size-4 animate-spin-hover" />
            <span>Tải lại</span>
          </Button>

          <Button 
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-90 text-white shadow-md shadow-primary/25 border-0"
            onClick={() => navigate("/")}
          >
            <Home className="size-4" />
            <span>Trang chủ</span>
          </Button>
        </div>

        {/* Decorative footer */}
        <div className="text-xs text-muted-foreground border-t border-slate-200/50 dark:border-slate-800/50 pt-4 w-full flex items-center justify-center gap-2">
          <span>QQNA Chat System Error logs</span>
          <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

      </div>
    </div>
  );
};

export default ErrorPage;
