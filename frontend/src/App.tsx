import { BrowserRouter, Routes, Route } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import SignUpPage from "./pages/SignUpPage";
import { Toaster } from "sonner";
import GuestRoute from "./components/auth/GuestRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorPage from "./pages/ErrorPage";
import ProfileDialog from "./components/profile/ProfileDialog";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";
import ServerWarmup from "./components/common/ServerWarmup";
import DocumentTitle from "./components/common/DocumentTitle";
import { startPagePresenceTracking } from "./lib/pagePresence";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();
  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => startPagePresenceTracking(), []);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }

    return () => disconnectSocket();
  }, [accessToken]);

  return (
    <ServerWarmup>
      <Toaster richColors position="top-right" closeButton={true} />
      <DocumentTitle />
      <ProfileDialog />
      <BrowserRouter>
        <Routes>
          {/* guest routes */}
          <Route element={<GuestRoute />}>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>
          {/* protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatAppPage />} />
          </Route>
          {/* error fallback routes */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </BrowserRouter>
    </ServerWarmup>
  );
}

export default App;

