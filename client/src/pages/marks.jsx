import { useMemo, useState } from "react";
import { useSearch } from "@/lib/router-compat";
import { ArrowLeft, GraduationCap, Layers, Pencil, Search, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
"recharts";
import { toast } from "sonner";
import { usePortal } from "@/lib/portal/store";
import { EmptyState, GlassCard, PageHeader } from "@/components/portal/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  gradeOf,
  grandTotal,
  internalTotal,
  isPass,
  midOutOf100,
  midsComponent } from
"@/lib/portal/calc";



function MarksPage() {
  const { session } = usePortal();
  return session?.role === "admin" ? <AdminMarks /> : <StudentMarks />;
}

/* ---------------------------------- Admin --------------------------------- */

function AdminMarks() {
  const { state, branches, currentSemester, upsertMark, deleteMark } = usePortal();
  const search = useSearch();
  const [branch, setBranch] = useState(search.branch ?? null);
  const [semester, setSemester] = useState(currentSemester);
  const [query, setQuery] = useState("");
  const [openStudent, setOpenStudent] = useState(null);
  const [editing, setEditing] = useState(null);

  const subjects = useMemo(
    () => state.subjects.filter((s) => s.branch === branch && s.semester === semester),
    [state.subjects, branch, semester]
  );

  const students = useMemo(
    () =>
    state.students.
    filter((s) => s.branch === branch).
    filter(
      (s) =>
      !query.trim() ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.roll.toLowerCase().includes(query.toLowerCase())
    ).
    sort((a, b) => a.roll.localeCompare(b.roll)),
    [state.students, branch, query]
  );

  const passData = useMemo(
    () =>
    subjects.map((sub) => {
      const recs = state.marks.filter(
        (m) =>
        m.subjectCode === sub.code &&
        m.semester === semester &&
        state.students.some((s) => s.id === m.studentId && s.branch === branch)
      );
      const passed = recs.filter((m) => {
        const t = grandTotal(m);
        if (t != null) return isPass(t);
        const mid = midOutOf100(m);
        return mid != null && mid >= 40;
      }).length;
      return { subject: sub.code.replace(/^[A-Z]+-/, ""), name: sub.name, passed };
    }),
    [subjects, state.marks, state.students, branch, semester]
  );

  if (!branch) {
    return (
      <div>
        <PageHeader
          title="Marks Management"
          subtitle="Select a branch to view its students and subjects"
          icon={GraduationCap} />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) =>
          <button
            key={b.code}
            onClick={() => setBranch(b.code)}
            className="card-hover glass rounded-2xl p-6 text-left">
            
              <div className="gradient-primary mb-4 flex size-12 items-center justify-center rounded-2xl">
                <Layers className="size-6 text-white" />
              </div>
              <p className="text-2xl font-extrabold">{b.code}</p>
              <p className="text-sm text-muted-foreground">{b.name}</p>
              <p className="mt-3 text-sm">
                <span className="font-semibold">
                  {state.students.filter((s) => s.branch === b.code).length}
                </span>{" "}
                students ·{" "}
                <span className="font-semibold">
                  {state.subjects.filter((s) => s.branch === b.code && s.semester === currentSemester).length}
                </span>{" "}
                subjects
              </p>
            </button>
          )}
        </div>
      </div>);

  }

  const student = state.students.find((s) => s.id === openStudent) ?? null;

  return (
    <div>
      <PageHeader
        title={`${branch} · Marks`}
        subtitle="Mid 1 and Mid 2 are out of 40, assignment out of 10, external out of 70"
        icon={GraduationCap}
        action={
        <Button variant="outline" onClick={() => setBranch(null)}>
            <ArrowLeft className="mr-2 size-4" /> All branches
          </Button>
        } />
      

      <div className="space-y-6">
        <GlassCard>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={String(semester)} onValueChange={(v) => setSemester(Number(v))}>
              <TabsList>
                {[1, 2, 3, 4, 5].map((s) =>
                <TabsTrigger key={s} value={String(s)}>
                    Sem {s}
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            <div className="relative ml-auto min-w-52 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search student by name or roll…"
                value={query}
                onChange={(e) => setQuery(e.target.value)} />
              
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Subjects graded</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const recs = state.marks.filter(
                    (m) => m.studentId === s.id && m.semester === semester
                  );
                  const graded = recs.filter((m) => internalTotal(m) != null).length;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={s.photo} alt={s.name} />
                            <AvatarFallback>{s.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{s.roll}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>
                        {graded} / {subjects.length}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setOpenStudent(s.id)}>
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>);

                })}
                {students.length === 0 &&
                <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No students found in this branch.
                    </TableCell>
                  </TableRow>
                }
              </TableBody>
            </Table>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold">Subject wise pass count</h2>
          <p className="text-sm text-muted-foreground">
            Number of students who passed each subject in Semester {semester}.
          </p>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="subject" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  label={{
                    value: "Students passed",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 12
                  }} />
                
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)"
                  }}
                  formatter={(v) => [`${v} students passed`, ""]}
                  labelFormatter={(l) => passData.find((d) => d.subject === l)?.name ?? String(l)} />
                
                <Bar dataKey="passed" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <Dialog open={!!student} onOpenChange={(o) => !o && setOpenStudent(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {student &&
          <>
              <DialogHeader>
                <DialogTitle>
                  {student.name} · Semester {semester}
                </DialogTitle>
                <DialogDescription>
                  Internal (30) = 75% of higher mid + 25% of lower mid scaled to 20, plus assignment
                  (10). Total = Internal + External (70).
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Mid 1</TableHead>
                      <TableHead>Mid 2</TableHead>
                      <TableHead>Assign.</TableHead>
                      <TableHead>Internal</TableHead>
                      <TableHead>External</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((sub) => {
                    const rec = state.marks.find(
                      (m) => m.studentId === student.id && m.subjectCode === sub.code
                    ) ?? {
                      id: `${student.id}-${sub.code}`,
                      studentId: student.id,
                      subjectCode: sub.code,
                      semester,
                      mid1: null,
                      mid2: null,
                      assignment: null,
                      external: null
                    };
                    const total = grandTotal(rec);
                    return (
                      <TableRow key={sub.code}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell>{rec.mid1 ?? "—"}</TableCell>
                          <TableCell>{rec.mid2 ?? "—"}</TableCell>
                          <TableCell>{rec.assignment ?? "—"}</TableCell>
                          <TableCell>{internalTotal(rec) ?? "—"}</TableCell>
                          <TableCell>{rec.external ?? "—"}</TableCell>
                          <TableCell className="font-semibold">{total ?? "—"}</TableCell>
                          <TableCell>
                            {total != null ?
                          <Badge variant={isPass(total) ? "default" : "destructive"}>
                                {gradeOf(total)}
                              </Badge> :

                          "—"
                          }
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <Button variant="ghost" size="icon" onClick={() => setEditing(rec)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              deleteMark(rec.id);
                              toast.success("Marks cleared");
                            }}>
                            
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>);

                  })}
                  </TableBody>
                </Table>
              </div>
            </>
          }
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing &&
          <>
              <DialogHeader>
                <DialogTitle>Update marks</DialogTitle>
                <DialogDescription>
                  {state.subjects.find((s) => s.code === editing.subjectCode)?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <NumField
                label="Mid 1 (40)"
                max={40}
                value={editing.mid1}
                onChange={(v) => setEditing({ ...editing, mid1: v })} />
              
                <NumField
                label="Mid 2 (40)"
                max={40}
                value={editing.mid2}
                onChange={(v) => setEditing({ ...editing, mid2: v })} />
              
                <NumField
                label="Assignment (10)"
                max={10}
                value={editing.assignment}
                onChange={(v) => setEditing({ ...editing, assignment: v })} />
              
                <NumField
                label="External (70)"
                max={70}
                value={editing.external}
                onChange={(v) => setEditing({ ...editing, external: v })} />
              
              </div>
              <div className="rounded-xl bg-secondary/60 p-3 text-sm">
                Mids component: <strong>{midsComponent(editing.mid1, editing.mid2) ?? "—"}</strong> /
                20 · Internal: <strong>{internalTotal(editing) ?? "—"}</strong> / 30 · Total:{" "}
                <strong>{grandTotal(editing) ?? "—"}</strong> / 100
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                onClick={() => {
                  upsertMark(editing);
                  setEditing(null);
                  toast.success("Marks saved");
                }}>
                
                  Save marks
                </Button>
              </DialogFooter>
            </>
          }
        </DialogContent>
      </Dialog>
    </div>);

}

function NumField({
  label,
  value,
  max,
  onChange





}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          onChange(Math.max(0, Math.min(max, Number(raw))));
        }} />
      
    </div>);

}

/* --------------------------------- Student -------------------------------- */

function StudentMarks() {
  const { currentStudent, state, currentSemester } = usePortal();
  const [semester, setSemester] = useState(currentSemester);
  if (!currentStudent) return null;

  const subjects = state.subjects.filter(
    (s) => s.branch === currentStudent.branch && s.semester === semester
  );
  const isCurrent = semester === currentSemester;

  const rows = subjects.map((sub) => {
    const rec = state.marks.find(
      (m) => m.studentId === currentStudent.id && m.subjectCode === sub.code
    );
    return { sub, rec };
  });

  return (
    <div>
      <PageHeader
        title="My Marks"
        subtitle={`${currentStudent.branch} · Section ${currentStudent.section}`}
        icon={GraduationCap} />
      
      <GlassCard>
        <Tabs value={String(semester)} onValueChange={(v) => setSemester(Number(v))}>
          <TabsList>
            {Array.from({ length: currentStudent.semester }, (_, i) => i + 1).map((s) =>
            <TabsTrigger key={s} value={String(s)}>
                Sem {s}
                {s === currentSemester ? " (current)" : ""}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Mid 1 (40)</TableHead>
                <TableHead>Mid 2 (40)</TableHead>
                {isCurrent ?
                <TableHead>Total (100)</TableHead> :

                <>
                    <TableHead>Internal (30)</TableHead>
                    <TableHead>External (70)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Grade</TableHead>
                  </>
                }
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ sub, rec }) => {
                const total = rec ? grandTotal(rec) : null;
                return (
                  <TableRow key={sub.code}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>{rec?.mid1 ?? "—"}</TableCell>
                    <TableCell>{rec?.mid2 ?? "—"}</TableCell>
                    {isCurrent ?
                    <TableCell className="font-semibold">
                        {rec ? midOutOf100(rec) ?? "—" : "—"}
                      </TableCell> :

                    <>
                        <TableCell>{rec ? internalTotal(rec) ?? "—" : "—"}</TableCell>
                        <TableCell>{rec?.external ?? "—"}</TableCell>
                        <TableCell className="font-semibold">{total ?? "—"}</TableCell>
                        <TableCell>
                          {total != null ?
                        <Badge variant={isPass(total) ? "default" : "destructive"}>
                              {gradeOf(total)}
                            </Badge> :

                        "—"
                        }
                        </TableCell>
                      </>
                    }
                  </TableRow>);

              })}
            </TableBody>
          </Table>
        </div>
        {rows.length === 0 && <EmptyState text="No subjects found for this semester." />}
      </GlassCard>
    </div>);

}

export default MarksPage;