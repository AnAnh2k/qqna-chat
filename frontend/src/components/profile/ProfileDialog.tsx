import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PersonalInfoForm from "./PersonalInfoForm";
import PreferencesForm from "./PreferencesForm";
import PrivacySettings from "./PrivacySettings";

interface ProfileDialogProps {
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>> | ((open: boolean) => void);
}

const ProfileDialog = ({ open, setOpen }: ProfileDialogProps = {}) => {
  const storeOpen = useUserStore((s) => s.profileModalOpen);
  const storeSetOpen = useUserStore((s) => s.setProfileModalOpen);
  const selectedUser = useUserStore((s) => s.selectedProfileUser);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const { user: currentUser } = useAuthStore();

  const isOpen = open !== undefined ? open : storeOpen;
  const handleOpenChange = setOpen !== undefined ? setOpen : storeSetOpen;

  const displayUser = open !== undefined ? currentUser : selectedUser;
  const isOwnProfile = currentUser?._id === displayUser?._id;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[95vh] p-0 bg-transparent border-0 shadow-2xl sm:max-w-xl beautiful-scrollbar">
        {profileLoading ? (
          <div className="bg-white/95 dark:bg-slate-900/95 p-12 rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-800 dark:text-slate-200">
            <div className="size-10 border-4 border-violet-100 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Đang tải thông tin...</span>
          </div>
        ) : !displayUser ? (
          <div className="bg-white/95 dark:bg-slate-900/95 p-8 rounded-2xl text-center text-slate-800 dark:text-slate-200">
            Không tìm thấy thông tin người dùng.
          </div>
        ) : (
          <div className="bg-gradient-glass">
            <div className="max-w-4xl mx-auto p-4">
              {/* heading */}
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {isOwnProfile ? "Profile & Settings" : "Thông Tin Cá Nhân"}
                </DialogTitle>
              </DialogHeader>

              <ProfileCard user={displayUser} />

              {isOwnProfile ? (
                <Tabs defaultValue="personal" className="my-4">
                  <TabsList className="grid w-full grid-cols-3 glass-light">
                    <TabsTrigger
                      value="personal"
                      className="data-[state=active]:glass-strong"
                    >
                      Tài Khoản
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="data-[state=active]:glass-strong"
                    >
                      Cấu Hình
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="data-[state=active]:glass-strong"
                    >
                      Bảo Mật
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal">
                    <PersonalInfoForm userInfo={displayUser} />
                  </TabsContent>

                  <TabsContent value="preferences">
                    <PreferencesForm />
                  </TabsContent>

                  <TabsContent value="privacy">
                    <PrivacySettings />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="mt-6 p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-violet-100 dark:border-slate-800 space-y-4 text-slate-850 dark:text-slate-200">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                    Thông tin tài khoản
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Tên đăng nhập:</span>
                    <span className="col-span-2 font-medium">@{displayUser.username}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Họ và tên:</span>
                    <span className="col-span-2 font-medium">{displayUser.displayName}</span>
                  </div>
                  {displayUser.bio && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-muted-foreground">Giới thiệu:</span>
                      <span className="col-span-2 text-slate-600 dark:text-slate-350 italic">
                        "{displayUser.bio}"
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
