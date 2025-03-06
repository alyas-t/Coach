
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/Index";
import DashboardPage from "./pages/Dashboard";
import AuthPage from "./pages/Auth";
import OnboardingPage from "./pages/Onboarding";
import NotFoundPage from "./pages/NotFound";
import ChatPage from "./pages/Chat";
import Calendar from "./pages/Calendar";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
