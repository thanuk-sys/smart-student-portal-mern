import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { GraduationCap, Lock, Mail, ShieldCheck } from "lucide-react";
import { usePortal } from "@/lib/portal/store";
import { STUDENT_DEMO_PASSWORD } from "@/lib/portal/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";


function LoginPage() {
  const { login, session, ready, state } = usePortal();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin@college.edu");
  const [password, setPassword] = useState("admin@123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && session) navigate({ to: "/dashboard" });
  }, [ready, session, navigate]);

  function submit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(async () => {
      const res = await login(username, password);
      setLoading(false);
      if (!res.ok) toast.error(res.error ?? "Login failed");else
      {
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    }, 350);
  }

  const demoStudent = state.students[0];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="gradient-primary relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute -left-16 top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 bottom-10 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20">
            <GraduationCap className="size-6" />
          </div>
          <span className="text-xl font-extrabold">Smart Student Portal</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">
            The complete university ERP experience.
          </h2>
          <p className="mt-4 text-white/85">
            Students, marks, timetables, syllabus, library materials and notices — all in one
            secure, role based portal.
          </p>
        </div>
        <p className="relative text-sm text-white/70">
          © Smart Student Portal · Built with React and TanStack Start
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="gradient-primary flex size-10 items-center justify-center rounded-xl">
              <GraduationCap className="size-5 text-white" />
            </div>
            <span className="gradient-text text-lg font-extrabold">Smart Student Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your college mail to access the portal.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">College mail / Roll number</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  autoComplete="username" />
                
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password" />
                
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember me
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() =>
                toast.info("Contact the administrator to reset your portal password.")
                }>
                
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4 text-primary" /> Demo credentials
            </p>
            <div className="mt-3 grid gap-2 text-xs">
              <button
                className="rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary"
                onClick={() => {
                  setUsername(state.admin.email);
                  setPassword(state.admin.password);
                }}>
                
                <span className="font-semibold">Admin</span> — {state.admin.email} /{" "}
                {state.admin.password}
              </button>
              {demoStudent &&
              <button
                className="rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary"
                onClick={() => {
                  setUsername(demoStudent.email);
                  setPassword(STUDENT_DEMO_PASSWORD);
                }}>
                
                  <span className="font-semibold">Student</span> — {demoStudent.email} /{" "}
                  {STUDENT_DEMO_PASSWORD}
                </button>
              }
              <p className="text-muted-foreground">
                Every student added by the admin can sign in with their college mail and the shared
                demo password <strong>{STUDENT_DEMO_PASSWORD}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

export default LoginPage;