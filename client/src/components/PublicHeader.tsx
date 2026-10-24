import { Activity, LogIn, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";

export default function PublicHeader() {
  const [, navigate] = useLocation();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  const goHome = () => {
    close();
    navigate("/");
  };

  const goLogin = () => {
    close();
    navigate("/login");
  };

  const goAdminLogin = () => {
    close();
    navigate("/admin-login");
  };

  const handleLogout = async () => {
    close();

    try {
      await logout();
    } finally {
      // User logout થયા પછી Home page પર જ રહેશે
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6e7df] bg-[#f8f7f2]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">

        {/* LOGO */}
        <button onClick={goHome} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#0d5e57] text-white shadow-[0_8px_20px_rgba(13,94,87,.18)]">
            <Activity className="h-5 w-5" />
          </div>

          <div className="text-left">
            <div className="display-font text-[16px] font-extrabold tracking-[-.04em]">
              CareVista Hospital
            </div>

            <div className="text-[9px] font-bold uppercase tracking-[.17em] text-[#82918b]">
              Hospital Management
            </div>
          </div>
        </button>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-5 md:flex">

          <button
            onClick={() => navigate("/services")}
            className="text-[12px] font-semibold text-[#657871] hover:text-[#0d6e65]"
          >
            Services
          </button>

          <button
            onClick={() => navigate("/departments")}
            className="text-[12px] font-semibold text-[#657871] hover:text-[#0d6e65]"
          >
            Departments
          </button>

          <button
            onClick={() => navigate("/about")}
            className="text-[12px] font-semibold text-[#657871] hover:text-[#0d6e65]"
          >
            About Us
          </button>

          <button
            onClick={() => navigate("/contact")}
            className="text-[12px] font-semibold text-[#657871] hover:text-[#0d6e65]"
          >
            Contact Us
          </button>

          {!loading && user ? (
            /* LOGGED IN USER */
            <div className="flex items-center gap-2">

              <span className="rounded-xl bg-[#e3f0eb] px-3 py-2 text-xs font-bold text-[#17695f]">
                Hi, {user.name?.split(" ")[0] || "User"}
              </span>

              {user.role === "admin" && (
                <Button
                  onClick={() => navigate("/admin")}
                  variant="outline"
                  className="h-10 rounded-xl border-[#cfe1da] px-3 text-xs font-bold text-[#17695f]"
                >
                  Admin Panel
                </Button>
              )}

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="h-10 rounded-xl px-3 text-xs font-bold text-[#687b74]"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          ) : (
            /* NOT LOGGED IN */
            <div className="flex items-center gap-2">

              <Button
                onClick={goAdminLogin}
                variant="outline"
                className="h-10 rounded-xl border-[#cfe1da] px-3 text-xs font-bold text-[#17695f]"
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Admin Login
              </Button>

              <Button
                onClick={goLogin}
                className="h-10 rounded-xl bg-[#0d6e65] px-4 text-xs font-bold text-white hover:bg-[#09584f]"
              >
                <LogIn className="mr-2 h-3.5 w-3.5" />
                Login
              </Button>

            </div>
          )}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-xl p-2 text-[#557169] md:hidden"
          aria-label="Open menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="border-t border-[#e6e7df] bg-[#f8f7f2] px-5 py-4 md:hidden">
          <div className="grid gap-2">

            {[
              ["Services", "/services"],
              ["Departments", "/departments"],
              ["About Us", "/about"],
              ["Contact Us", "/contact"],
            ].map(([label, path]) => (
              <button
                key={path}
                onClick={() => {
                  close();
                  navigate(path);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#657871]"
              >
                {label}
              </button>
            ))}

            {!loading && user ? (
              <>
                <div className="rounded-lg bg-[#e3f0eb] px-3 py-2 text-sm font-bold text-[#17695f]">
                  Hi, {user.name?.split(" ")[0] || "User"}
                </div>

                {user.role === "admin" && (
                  <Button
                    onClick={() => {
                      close();
                      navigate("/admin");
                    }}
                    className="h-11 rounded-xl bg-[#0d6e65] font-bold text-white"
                  >
                    Admin Panel
                  </Button>
                )}

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="h-11 rounded-xl font-bold"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={goAdminLogin}
                  variant="outline"
                  className="h-11 rounded-xl border-[#cfe1da] font-bold text-[#17695f]"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>

                <Button
                  onClick={goLogin}
                  className="h-11 rounded-xl bg-[#0d6e65] font-bold text-white"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  User Login
                </Button>
              </>
            )}

          </div>
        </div>
      )}
    </header>
  );
}