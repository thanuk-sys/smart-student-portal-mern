import { useNavigate } from "@/lib/router-compat";
import {
  Award,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Layers,
  Library,
  Megaphone,
  Pin,

  Users } from
"lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis } from
"recharts";
import { usePortal } from "@/lib/portal/store";
import { EmptyState, GlassCard, StatCard } from "@/components/portal/ui-bits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cgpaFromPercent, grandTotal, midOutOf100 } from "@/lib/portal/calc";
import { formatDate } from "@/lib/portal/files";


const QUICK = [
{ to: "/students", label: "Students", icon: Users, admin: true },
{ to: "/marks", label: "Marks", icon: GraduationCap },
{ to: "/timetable", label: "Timetable", icon: Calendar },
{ to: "/syllabus", label: "Syllabus", icon: FileText },
{ to: "/library", label: "Library", icon: Library },
{ to: "/notices", label: "Notices", icon: Megaphone }];


const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

function Dashboard() {
  const { session } = usePortal();
  return session?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />;
}

function QuickAccess({ isAdmin }) {
  const navigate = useNavigate();
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Quick Access</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK.filter((q) => !("admin" in q && q.admin) || isAdmin).map((q) =>
        <button
          key={q.to}
          onClick={() => navigate({ to: q.to })}
          className="card-hover glass flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
          
            <div className="gradient-primary flex size-11 items-center justify-center rounded-xl shadow">
              <q.icon className="size-5 text-white" />
            </div>
            <span className="text-sm font-semibold">{q.label}</span>
          </button>
        )}
      </div>
    </section>);

}

function RecentNotices({ limit = 2 }) {
  const { state } = usePortal();
  const navigate = useNavigate();
  const notices = [...state.notices].
  sort(
    (a, b) =>
    Number(b.pinned) - Number(a.pinned) || +new Date(b.createdAt) - +new Date(a.createdAt)
  ).
  slice(0, limit);

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Recent Notices</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/notices" })}>
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {notices.map((n) =>
        <button
          key={n.id}
          onClick={() => navigate({ to: "/notices", search: { view: n.id } })}
          className="card-hover w-full rounded-xl border border-border bg-card/60 p-4 text-left">
          
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{n.category}</Badge>
              {n.pinned &&
            <Badge className="gap-1">
                  <Pin className="size-3" /> Pinned
                </Badge>
            }
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(n.createdAt)}
              </span>
            </div>
            <p className="mt-2 font-semibold">{n.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
          </button>
        )}
        {notices.length === 0 && <EmptyState text="No notices published yet." />}
      </div>
    </GlassCard>);

}

function AdminDashboard() {
  const { state, branches, currentSemester } = usePortal();
  const navigate = useNavigate();

  const totalStudents = state.students.length;
  const totalBranches = branches.length;
  const totalSubjects = state.subjects.filter((s) => s.semester === currentSemester).length;

  // Marks distribution across completed semesters (records that have an external mark)
  const completed = state.marks.filter((m) => m.external != null);
  const buckets = [0, 0, 0, 0];
  let sum = 0;
  for (const m of completed) {
    const t = grandTotal(m);
    if (t == null) continue;
    sum += t;
    if (t >= 90) buckets[0]++;else
    if (t >= 75) buckets[1]++;else
    if (t >= 60) buckets[2]++;else
    buckets[3]++;
  }
  const avg = completed.length ? sum / completed.length : 0;
  const pieData = [
  { name: "90% and Above", value: buckets[0] },
  { name: "75% - 89%", value: buckets[1] },
  { name: "60% - 74%", value: buckets[2] },
  { name: "Below 60%", value: buckets[3] }];


  // Top performers (by average across all graded records)
  const perStudent = state.students.
  map((s) => {
    const recs = state.marks.filter((m) => m.studentId === s.id && m.external != null);
    const total = recs.reduce((a, m) => a + (grandTotal(m) ?? 0), 0);
    return { student: s, avg: recs.length ? total / recs.length : 0 };
  }).
  sort((a, b) => b.avg - a.avg).
  slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="gradient-primary relative overflow-hidden rounded-3xl p-7 text-white shadow-xl animate-fade-up sm:p-9">
        <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-3xl" />
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome Back, {state.admin.name.split(" ").slice(-1)[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-white/85">
          Full access to academic modules, student records and resources.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => navigate({ to: "/students" })}>
            
            Manage Students
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={() => navigate({ to: "/profile" })}>
            
            My Profile
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={totalStudents}
          hint="Across all branches"
          icon={Users}
          gradient="bg-gradient-to-br from-blue-600 to-indigo-600" />
        
        <StatCard
          title="Total Branches"
          value={totalBranches}
          hint={branches.map((b) => b.code).join(" · ")}
          icon={Layers}
          gradient="bg-gradient-to-br from-violet-600 to-fuchsia-600" />
        
        <StatCard
          title={`Subjects (Sem ${currentSemester})`}
          value={totalSubjects}
          hint="Across all branches"
          icon={BookOpen}
          gradient="bg-gradient-to-br from-emerald-600 to-teal-600" />
        
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Branch Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => {
            const subs = state.subjects.filter(
              (s) => s.branch === b.code && s.semester === currentSemester
            );
            const students = state.students.filter((s) => s.branch === b.code);
            return (
              <GlassCard key={b.code} className="card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-extrabold">{b.code}</p>
                    <p className="text-xs text-muted-foreground">{b.name}</p>
                  </div>
                  <Badge variant="secondary">Sem {currentSemester}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="text-xs text-muted-foreground">Subjects</p>
                    <p className="text-lg font-bold">{subs.length}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="text-xs text-muted-foreground">Students</p>
                    <p className="text-lg font-bold">{students.length}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {b.sections.map((sec) =>
                  <div
                    key={sec}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    
                      <span className="font-medium">Section {sec}</span>
                      <span className="text-muted-foreground">
                        {students.filter((s) => s.section === sec).length} students
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate({ to: "/students", search: { branch: b.code } })}>
                  
                  View students
                </Button>
              </GlassCard>);

          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-bold">Marks Distribution</h2>
          <p className="text-sm text-muted-foreground">
            Based on {completed.length} graded subject records from completed semesters.
          </p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}>
                  
                  {pieData.map((_, i) =>
                  <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)"
                  }} />
                
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Average score <span className="font-bold text-foreground">{avg.toFixed(1)}%</span>
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold">Top Performers</h2>
          <p className="text-sm text-muted-foreground">Click a student to view full details.</p>
          <div className="mt-4 space-y-2">
            {perStudent.map(({ student, avg: a }, i) =>
            <button
              key={student.id}
              onClick={() =>
              navigate({ to: "/students", search: { view: student.id } })
              }
              className="flex w-full items-center gap-3 rounded-xl border border-border p-2.5 text-left transition hover:border-primary/60 hover:bg-secondary/50">
              
                <span className="w-5 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="size-9">
                  <AvatarImage src={student.photo} alt={student.name} />
                  <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.roll} · {student.branch}-{student.section}
                  </p>
                </div>
                <Badge className="shrink-0">{a.toFixed(1)}%</Badge>
              </button>
            )}
          </div>
        </GlassCard>
      </section>

      <RecentNotices limit={2} />
      <QuickAccess isAdmin />
    </div>);

}

function StudentDashboard() {
  const { currentStudent, state, currentSemester } = usePortal();
  const navigate = useNavigate();
  if (!currentStudent) return null;

  const myMarks = state.marks.filter((m) => m.studentId === currentStudent.id);
  const graded = myMarks.filter((m) => m.external != null);
  const percent = graded.length ?
  graded.reduce((a, m) => a + (grandTotal(m) ?? 0), 0) / graded.length :
  0;
  const cgpa = cgpaFromPercent(percent);

  const currentSubjects = state.subjects.filter(
    (s) => s.branch === currentStudent.branch && s.semester === currentSemester
  );
  const chartData = currentSubjects.map((s) => {
    const rec = myMarks.find((m) => m.subjectCode === s.code && m.semester === currentSemester);
    return {
      subject: s.code.replace(/^[A-Z]+-/, ""),
      score: rec ? midOutOf100(rec) ?? 0 : 0
    };
  });

  return (
    <div className="space-y-8">
      <section className="gradient-primary relative overflow-hidden rounded-3xl p-7 text-white shadow-xl animate-fade-up sm:p-9">
        <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar className="size-16 border-2 border-white/40">
            <AvatarImage src={currentStudent.photo} alt={currentStudent.name} />
            <AvatarFallback>{currentStudent.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome Back, {currentStudent.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-white/85">
              {currentStudent.branch} · Section {currentStudent.section} · Semester{" "}
              {currentStudent.semester}
            </p>
          </div>
          <div className="ml-auto flex gap-3">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => navigate({ to: "/marks" })}>
              
              My Marks
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => navigate({ to: "/profile" })}>
              
              My Profile
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="CGPA"
          value={`${cgpa.toFixed(1)} / 10`}
          hint={`${percent.toFixed(1)}% overall`}
          icon={Award}
          gradient="bg-gradient-to-br from-blue-600 to-indigo-600" />
        
        <StatCard
          title="Semester"
          value={currentStudent.semester}
          hint={`${currentStudent.branch} · Section ${currentStudent.section}`}
          icon={Layers}
          gradient="bg-gradient-to-br from-violet-600 to-fuchsia-600" />
        
        <StatCard
          title="Roll Number"
          value={currentStudent.roll}
          hint={currentStudent.email}
          icon={GraduationCap}
          gradient="bg-gradient-to-br from-emerald-600 to-teal-600" />
        
      </section>

      <GlassCard>
        <h2 className="text-lg font-bold">Current Semester Performance</h2>
        <p className="text-sm text-muted-foreground">
          Mid examination performance scaled to 100 for each subject.
        </p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="subject" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)"
                }} />
              
              <Bar dataKey="score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <QuickAccess isAdmin={false} />
    </div>);

}

export default Dashboard;