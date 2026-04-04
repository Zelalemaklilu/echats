import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Contacts from "./pages/Contacts";
import Calls from "./pages/Calls";
import SavedMessages from "./pages/SavedMessages";
import NewGroup from "./pages/NewGroup";
import GroupChat from "./pages/GroupChat";
import AddGroupMembers from "./pages/AddGroupMembers";
import NewMessage from "./pages/NewMessage";
import NewContact from "./pages/NewContact";
import Wallet from "./pages/Wallet";
import WalletQR from "./pages/WalletQR";
import Features from "./pages/Features";
import AddMoney from "./pages/AddMoney";
import SendMoney from "./pages/SendMoney";
import RequestMoney from "./pages/RequestMoney";
import TransactionHistory from "./pages/TransactionHistory";
import TransactionReceipt from "./pages/TransactionReceipt";
import TransactionDetail from "./pages/TransactionDetail";
import AddAccount from "./pages/AddAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ContactProfile from "./pages/ContactProfile";
import PrivacySettings from "./pages/PrivacySettings";
import NotificationSettings from "./pages/NotificationSettings";
import DataStorageSettings from "./pages/DataStorageSettings";
import Channels from "./pages/Channels";
import ChannelView from "./pages/ChannelView";
import Bots from "./pages/Bots";
import BotChat from "./pages/BotChat";
import NearbyPeople from "./pages/NearbyPeople";
import NotFound from "./pages/NotFound";
import ActiveSessions from "./pages/ActiveSessions";
import VoiceChatRoom from "./pages/VoiceChatRoom";
import LiveStories from "./pages/LiveStories";
import QuickRepliesSettings from "./pages/QuickRepliesSettings";
import BusinessProfileSettings from "./pages/BusinessProfileSettings";
import GiftsPage from "./pages/GiftsPage";
import BuyStars from "./pages/BuyStars";
import Etok from "./pages/Etok";
import EtokOnboarding from "./pages/EtokOnboarding";
import EtokCamera from "./pages/EtokCamera";
import EtokSearch from "./pages/EtokSearch";
import EtokLive from "./pages/EtokLive";
import EtokProfile from "./pages/EtokProfile";
import EtokAnalytics from "./pages/EtokAnalytics";
import EtokSettings from "./pages/EtokSettings";
import GlobalSearch from "./pages/GlobalSearch";
import AIAssistant from "./pages/AIAssistant";
import { updateOnlineStatus } from "@/lib/supabaseService";
import logoImage from "@/assets/echat-logo.jpg";
import { CallProvider } from "@/contexts/CallContext";
import { CallOverlay } from "@/components/call/CallOverlay";
import { DevHealthBanner } from "@/components/dev/DevHealthBanner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { chatStore } from "@/lib/chatStore";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initAccentColor } from "@/lib/profileCustomizationService";
import { BottomNavigation } from "@/components/BottomNavigation";
import AppLockGate from "./components/AppLockScreen";
import WalletLockGate from "./components/WalletLockScreen";
import ScheduledPayments from "./pages/ScheduledPayments";
import Reminders from "./pages/Reminders";
import ChatStats from "./pages/ChatStats";
import GroupCall from "./pages/GroupCall";
import SavingsGoals from "./pages/SavingsGoals";
import SoundSettings from "./pages/SoundSettings";
import BroadcastList from "./pages/BroadcastList";
import PaymentRequest from "./pages/PaymentRequest";
import Stories from "./pages/Stories";
import CloseFriends from "./pages/CloseFriends";
import { getDueReminders } from "@/lib/reminderService";
import { checkTodaysBirthdays } from "@/lib/birthdayService";
import OfflineBanner from "@/components/OfflineBanner";

// Initialize accent color from localStorage on app load
initAccentColor();

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { authState, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const loginToastShownRef = useRef(false);
  const redirectToChatsDoneRef = useRef(false);

  // Reminder checker
  useEffect(() => {
    const check = () => {
      const due = getDueReminders();
      due.forEach(r => {
        toast(`🔔 Reminder: "${r.messageText}"`, {
          action: { label: "View", onClick: () => navigate(`/chat/${r.chatId}`) },
          duration: 8000,
        });
      });
    };
    const interval = setInterval(check, 60_000);
    check();
    return () => clearInterval(interval);
  }, [navigate]);

  // Birthday checker (runs once on auth)
  useEffect(() => {
    if (!user?.id) return;
    const shown = sessionStorage.getItem("echat_bday_checked");
    if (shown) return;
    sessionStorage.setItem("echat_bday_checked", "1");
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("profiles")
        .select("id, name, username, birthday")
        .neq("id", user.id)
        .then(({ data }) => {
          if (!data) return;
          const bdays = checkTodaysBirthdays(data as { id: string; name: string | null; username: string; birthday?: string | null }[]);
          bdays.forEach(c => {
            toast(`🎂 ${c.name || c.username} has a birthday today!`, { duration: 6000 });
          });
        });
    });
  }, [user?.id]);

  const isAuthenticated = authState === 'authenticated';

  // Initialize chat store from the single, already-restored auth state
  useEffect(() => {
    if (user?.id) {
      chatStore.initialize(user.id).catch((err) => {
        console.error("[ChatStore] initialize failed:", err);
      });
    } else {
      chatStore.cleanup();
    }
  }, [user?.id]);

  // Online status (non-blocking)
  useEffect(() => {
    if (!user?.id) return;
    updateOnlineStatus(user.id, true).catch(console.warn);
    return () => {
      updateOnlineStatus(user.id, false).catch(console.warn);
    };
  }, [user?.id]);

  // Post-login toast & redirect
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!loginToastShownRef.current) {
      toast.success("Login successful");
      loginToastShownRef.current = true;
    }

    if (redirectToChatsDoneRef.current) return;
    if (location.pathname === "/chats") {
      redirectToChatsDoneRef.current = true;
      return;
    }

    const publicPaths = new Set(["/", "/auth", "/forgot-password"]);
    if (publicPaths.has(location.pathname)) {
      redirectToChatsDoneRef.current = true;
      navigate("/chats", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Loading screen
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative mx-auto w-32 h-32"
          >
            <motion.div
              className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-primary">
              <img 
                src={logoImage} 
                alt="Echat Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold text-foreground">
              Echat
            </h1>
            <p className="text-lg text-muted-foreground">
              Fast. Simple. Secure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex justify-center"
          >
            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-primary rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                style={{ width: "50%" }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isEtokRoute = location.pathname.startsWith("/etok");
  const showBottomNav = isAuthenticated && !isEtokRoute && ["/chats", "/calls", "/channels", "/contacts", "/settings", "/bots", "/nearby"].includes(location.pathname);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/chats" replace /> : <PageTransition><Splash /></PageTransition>
          } />
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/chats" replace /> : <PageTransition><Auth /></PageTransition>
          } />
          <Route path="/forgot-password" element={
            isAuthenticated ? <Navigate to="/chats" replace /> : <PageTransition><ForgotPassword /></PageTransition>
          } />
          <Route path="/chats" element={
            isAuthenticated ? <PageTransition><Chats /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/chat" element={
            isAuthenticated ? <Navigate to="/chats" replace /> : <Navigate to="/" replace />
          } />
          <Route path="/chat/:chatId" element={
            isAuthenticated ? <PageTransition><Chat /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/profile" element={
            isAuthenticated ? <PageTransition><Profile /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/settings" element={
            isAuthenticated ? <PageTransition><Settings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/contacts" element={
            isAuthenticated ? <PageTransition><Contacts /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/calls" element={
            isAuthenticated ? <PageTransition><Calls /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/saved-messages" element={
            isAuthenticated ? <PageTransition><SavedMessages /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/new-group" element={
            isAuthenticated ? <PageTransition><NewGroup /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/group/:groupId" element={
            isAuthenticated ? <PageTransition><GroupChat /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/group/:groupId/add-members" element={
            isAuthenticated ? <PageTransition><AddGroupMembers /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/contact/:userId" element={
            isAuthenticated ? <PageTransition><ContactProfile /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/privacy-settings" element={
            isAuthenticated ? <PageTransition><PrivacySettings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/notification-settings" element={
            isAuthenticated ? <PageTransition><NotificationSettings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/data-storage" element={
            isAuthenticated ? <PageTransition><DataStorageSettings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/new-message" element={
            isAuthenticated ? <PageTransition><NewMessage /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/new-contact" element={
            isAuthenticated ? <PageTransition><NewContact /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/wallet" element={
            isAuthenticated ? <PageTransition><WalletLockGate><Wallet /></WalletLockGate></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/scheduled-payments" element={
            isAuthenticated ? <PageTransition><ScheduledPayments /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/wallet/qr" element={
            isAuthenticated ? <PageTransition><WalletQR /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/features" element={
            isAuthenticated ? <PageTransition><Features /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/add-money" element={
            isAuthenticated ? <PageTransition><AddMoney /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/send-money" element={
            isAuthenticated ? <PageTransition><SendMoney /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/request-money" element={
            isAuthenticated ? <PageTransition><RequestMoney /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/transaction-history" element={
            isAuthenticated ? <PageTransition><TransactionHistory /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/transaction-receipt" element={
            isAuthenticated ? <PageTransition><TransactionReceipt /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/transaction-detail/:transactionId" element={
            isAuthenticated ? <PageTransition><TransactionDetail /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/add-account" element={
            isAuthenticated ? <PageTransition><AddAccount /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/channels" element={
            isAuthenticated ? <PageTransition><Channels /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/channel/:id" element={
            isAuthenticated ? <PageTransition><ChannelView /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/bots" element={
            isAuthenticated ? <PageTransition><Bots /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/bot/:id" element={
            isAuthenticated ? <PageTransition><BotChat /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/nearby" element={
            isAuthenticated ? <PageTransition><NearbyPeople /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/active-sessions" element={
            isAuthenticated ? <PageTransition><ActiveSessions /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/voice-chat/:id" element={
            isAuthenticated ? <PageTransition><VoiceChatRoom /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/live-stories" element={
            isAuthenticated ? <PageTransition><LiveStories /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/quick-replies" element={
            isAuthenticated ? <PageTransition><QuickRepliesSettings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/business-profile" element={
            isAuthenticated ? <PageTransition><BusinessProfileSettings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/gifts" element={
            isAuthenticated ? <PageTransition><GiftsPage /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/buy-stars" element={
            isAuthenticated ? <PageTransition><BuyStars /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/search" element={
            isAuthenticated ? <GlobalSearch /> : <Navigate to="/auth" replace />
          } />
          <Route path="/ai-assistant" element={
            isAuthenticated ? <AIAssistant /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/onboarding" element={
            isAuthenticated ? <EtokOnboarding /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok" element={
            isAuthenticated ? <Etok /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/camera" element={
            isAuthenticated ? <EtokCamera /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/search" element={
            isAuthenticated ? <EtokSearch /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/live" element={
            isAuthenticated ? <EtokLive /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/live/:streamId" element={
            isAuthenticated ? <EtokLive /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/profile/:userId" element={
            isAuthenticated ? <EtokProfile /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/me" element={
            isAuthenticated ? <EtokProfile /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/analytics" element={
            isAuthenticated ? <EtokAnalytics /> : <Navigate to="/auth" replace />
          } />
          <Route path="/etok/settings" element={
            isAuthenticated ? <EtokSettings /> : <Navigate to="/auth" replace />
          } />
          <Route path="/reminders" element={
            isAuthenticated ? <PageTransition><Reminders /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/chat-stats/:chatId" element={
            isAuthenticated ? <PageTransition><ChatStats /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/group-call/:roomId" element={
            isAuthenticated ? <GroupCall /> : <Navigate to="/auth" replace />
          } />
          <Route path="/savings-goals" element={
            isAuthenticated ? <PageTransition><SavingsGoals /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/sound-settings" element={
            isAuthenticated ? <PageTransition><SoundSettings /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/broadcast" element={
            isAuthenticated ? <PageTransition><BroadcastList /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/payment-request" element={
            isAuthenticated ? <PageTransition><PaymentRequest /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/stories" element={
            isAuthenticated ? <PageTransition><Stories /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="/close-friends" element={
            isAuthenticated ? <PageTransition><CloseFriends /></PageTransition> : <Navigate to="/auth" replace />
          } />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {showBottomNav && <BottomNavigation />}
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OfflineBanner />
            <AuthProvider>
              <AppLockGate>
                <CallProvider>
                  <AppRoutes />
                  <CallOverlay />
                  <DevHealthBanner />
                </CallProvider>
              </AppLockGate>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
