import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useNavigate } from "@/lib/router-compat";
import {
  Bell,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  Users } from
"lucide-react";
import { usePortal } from "@/lib/portal/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlobalSearch } from "./GlobalSearch";
import { formatDate } from "@/lib/portal/files";
import { cn } from "@/lib/utils";

const NAV = [
{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "student"] },
{ to: "/students", label: "Students", icon: Users, roles: ["admin"] },
{ to: "/marks", label: "Marks", icon: GraduationCap, roles: ["admin", "student"] },
{ to: "/timetable", label: "Timetable", icon: Calendar, roles: ["admin", "student"] },
{ to: "/syllabus", label: "Syllabus", icon: FileText, roles: ["admin", "student"] },
{ to: "/library", label: "Library", icon: Library, roles: ["admin", "student"] },
{ to: "/notices", label: "Notices", icon: Megaphone, roles: ["admin", "student"] },
{ to: "/profile", label: "Profile", icon: User, roles: ["admin", "student"] }];


export function AppShell() {
  const { session, currentStudent, state, logout, theme, toggleTheme, unreadCount, markNoticesRead } =
  usePortal();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = session?.role ?? "student";
  const items = useMemo(() => NAV.filter((n) => n.roles.includes(role)), [role]);

  const displayName = role === "admin" ? state.admin.name : currentStudent?.name ?? "Student";
  const photo = role === "admin" ? state.admin.photo : currentStudent?.photo ?? "";
  const roleLabel =
  role === "admin" ?
  "Administrator" :
  `${currentStudent?.branch ?? ""} ${currentStudent?.section ?? ""} · Sem ${currentStudent?.semester ?? ""}`;

  const notices = [...state.notices].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.createdAt) - +new Date(a.createdAt)
  );

  function openBell(open) {
    setBellOpen(open);
    if (open) markNoticesRead();
  }

  const SidebarBody =
  <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="gradient-primary flex size-10 items-center justify-center rounded-xl shadow-lg">
          <GraduationCap className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">Smart Student</p>
          <p className="text-xs text-muted-foreground">Portal</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ?
                "gradient-primary text-white shadow-md" :
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
              
                <item.icon className="size-4.5" />
                {item.label}
              </Link>);

        })}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-3">
        <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-sm"
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}>
        
          <LogOut className="size-4" /> Logout
        </Button>
      </div>
    </div>;


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {SidebarBody}
        </SheetContent>
      </Sheet>

      <header className="glass fixed inset-x-0 top-0 z-40 h-16">
        <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(true)}>
            
            <Menu className="size-5" />
          </Button>
          <Link to="/dashboard" className="hidden items-center gap-2 sm:flex">
            <span className="gradient-text text-lg font-extrabold tracking-tight">
              Smart Student Portal
            </span>
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-10 min-w-0 flex-1 max-w-md items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 text-sm text-muted-foreground transition hover:border-primary/50">
            
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search students, notices, subjects, books…</span>
          </button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <DropdownMenu open={bellOpen} onOpenChange={openBell}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-5" />
                {unreadCount > 0 &&
                <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-80">
                {notices.slice(0, 6).map((n) =>
                <DropdownMenuItem
                  key={n.id}
                  className="flex-col items-start gap-1 py-2.5"
                  onClick={() => navigate({ to: "/notices" })}>
                  
                    <div className="flex w-full items-center gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {n.pinned &&
                    <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                          Pinned
                        </Badge>
                    }
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {n.category} · {formatDate(n.createdAt)}
                    </span>
                  </DropdownMenuItem>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-secondary/70">
                <Avatar className="size-9 border border-border">
                  <AvatarImage src={photo} alt={displayName} />
                  <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight lg:block">
                  <p className="max-w-36 truncate text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span>{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                <User className="mr-2 size-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/notices" })}>
                <Megaphone className="mr-2 size-4" /> Notices
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}>
                
                <LogOut className="mr-2 size-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-3 pb-10 pt-20 sm:px-6">
        <Outlet />
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p className="font-medium">© Smart Student Portal</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs">
            <BookOpen className="size-3.5" /> Built with React, TanStack Start and a local data layer
          </p>
        </footer>
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>);

}