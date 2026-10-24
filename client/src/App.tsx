import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import About from "./pages/About";
import Services from "./pages/Services";
import Departments from "./pages/Departments";
import Contact from "./pages/Contact";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import AIHealthAssistant from "./pages/AIHealthAssistant";
import ForgotPassword from "./pages/ForgotPassword";
import ServiceDetail from "./pages/ServiceDetail";
import DepartmentDetail from "./pages/DepartmentDetail";

function RoleRoute({ role }: { role: "admin" | "user" }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f8f7f2]"><Loader2 className="h-6 w-6 animate-spin text-[#0d786d]" /></div>;
  if (!user) { navigate("/login"); return null; }
  if (user.role !== role) { navigate(role === "admin" ? "/user" : "/"); return null; }
  return role === "admin" ? <AdminDashboard /> : <UserDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/register" component={Register} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/about" component={About} />
      <Route path="/services/:slug" component={ServiceDetail} />
      <Route path="/services" component={Services} />
      <Route path="/departments/:slug" component={DepartmentDetail} />
      <Route path="/departments" component={Departments} />
      <Route path="/contact" component={Contact} />

      <Route path="/ai-assistant" component={AIHealthAssistant} />

      <Route path="/admin">
        <RoleRoute role="admin" />
      </Route>

      <Route path="/user">
        <RoleRoute role="user" />
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
export default App;
