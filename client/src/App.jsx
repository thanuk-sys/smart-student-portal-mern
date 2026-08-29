import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,

  Route,
  Routes,
  useLocation } from
"react-router-dom";
import { PortalProvider, usePortal } from "@/lib/portal/store";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/portal/AppShell";
import LoginPage from "./pages/login";
import Dashboard from "./pages/dashboard";
import StudentsPage from "./pages/students";
import MarksPage from "./pages/marks";
import TimetablePage from "./pages/timetable";
import SyllabusPage from "./pages/syllabus";
import LibraryPage from "./pages/library";
import NoticesPage from "./pages/notices";
import ProfilePage from "./pages/profile";

const TITLES = {
  "/login": "Login",
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/marks": "Marks",
  "/timetable": "Timetable",
  "/syllabus": "Syllabus",
  "/library": "Library",
  "/notices": "Notices",
  "/profile": "Profile"
};

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>);

}

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = TITLES[pathname];
    document.title = page ?
    `${page} · Smart Student Portal` :
    "Smart Student Portal · University ERP";
  }, [pathname]);
  return null;
}

function Protected() {
  const { session, ready } = usePortal();
  if (!ready) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function Root() {
  const { ready, session } = usePortal();
  if (!ready) return <Spinner />;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <PortalProvider>
        <TitleSync />
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/marks" element={<MarksPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </PortalProvider>
    </BrowserRouter>);

}