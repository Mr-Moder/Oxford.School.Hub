import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Users, 
  GraduationCap, 
  LayoutDashboard, 
  CalendarCheck, 
  BookOpen, 
  CreditCard,
  LogOut,
  Moon,
  Sun,
  Settings
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Students", href: "/students", icon: Users },
  { title: "Teachers", href: "/teachers", icon: GraduationCap },
  { title: "Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Academics", href: "/academics", icon: BookOpen },
  { title: "Fees", href: "/fees", icon: CreditCard },
  { title: "Security", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("school_auth");
    setLocation("/login");
  };

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2 font-serif font-bold text-lg text-primary">
          <GraduationCap className="h-6 w-6" />
          Oxford Science
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground border-sidebar-border p-0">
            <div className="p-4 flex items-center gap-2 font-serif font-bold text-xl mb-6">
              <GraduationCap className="h-6 w-6" />
              Oxford Science
            </div>
            <div className="px-3 flex flex-col gap-1">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 font-serif font-bold text-xl border-b border-sidebar-border/50">
          <GraduationCap className="h-8 w-8" />
          <div className="leading-tight">
            <div>Oxford Science</div>
            <div className="text-xs font-sans font-normal opacity-70">Public School & College</div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-3 py-6">
          <div className="flex flex-col gap-1">
            <NavLinks />
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-end px-6 bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
