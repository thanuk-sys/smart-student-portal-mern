import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@/lib/router-compat";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users } from
"lucide-react";
import { toast } from "sonner";
import { usePortal } from "@/lib/portal/store";
import { PageHeader, GlassCard, EmptyState } from "@/components/portal/ui-bits";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import { downloadCsv, exportPdf, parseCsv } from "@/lib/portal/files";



const PAGE_SIZE = 8;

const emptyForm = (branch, section, semester) => ({
  name: "",
  roll: "",
  email: "",
  mobile: "",
  branch,
  section,
  semester,
  address: "",
  gender: "male",
  photo: ""
});

function StudentsPage() {
  const {
    state,
    branches,
    currentSemester,
    session,
    addStudent,
    updateStudent,
    deleteStudent
  } = usePortal();
  const navigate = useNavigate();
  const search = useSearch();
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(search.branch ?? "all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() =>
  emptyForm(branches[0]?.code ?? "CSE", "A", currentSemester)
  );
  const fileRef = useRef(null);

  if (session?.role !== "admin") {
    return <EmptyState text="Students module is available to administrators only." />;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.students.
    filter((s) => branchFilter === "all" ? true : s.branch === branchFilter).
    filter((s) => sectionFilter === "all" ? true : s.section === sectionFilter).
    filter(
      (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.roll.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    ).
    sort((a, b) => a.roll.localeCompare(b.roll));
  }, [state.students, query, branchFilter, sectionFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const viewing = state.students.find((s) => s.id === search.view) ?? null;

  const sections = branches.find((b) => b.code === branchFilter)?.sections ?? [];

  function openAdd() {
    setEditing(null);
    setForm(emptyForm(branches[0]?.code ?? "CSE", "A", currentSemester));
    setFormOpen(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ ...s });
    setFormOpen(true);
  }

  function save() {
    if (!form.name.trim() || !form.roll.trim()) {
      toast.error("Name and roll number are required");
      return;
    }
    const photo =
    form.photo ||
    `https://randomuser.me/api/portraits/${form.gender === "male" ? "men" : "women"}/${
    Math.abs(hash(form.roll)) % 90}.jpg`;

    const payload = {
      ...form,
      photo,
      email: form.email || `${form.roll.toLowerCase()}@college.edu`
    };
    const res = editing ?
    updateStudent(editing.id, payload) :
    addStudent(payload);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save student");
      return;
    }
    toast.success(editing ? "Student updated" : "Student added");
    setFormOpen(false);
  }

  function exportExcel() {
    downloadCsv(
      [
      ["Roll", "Name", "Email", "Mobile", "Branch", "Section", "Semester", "Address"],
      ...filtered.map((s) => [
      s.roll,
      s.name,
      s.email,
      s.mobile,
      s.branch,
      s.section,
      s.semester,
      s.address]
      )],

      "students.csv"
    );
    toast.success("Excel (CSV) file downloaded");
  }

  function exportPdfReport() {
    const ok = exportPdf(
      "Student Report",
      ["Roll", "Name", "Branch", "Section", "Semester"],
      filtered.map((s) => [s.roll, s.name, s.branch, s.section, s.semester])
    );
    if (!ok) toast.error("Allow pop-ups to export the PDF");else
    toast.success("PDF export opened — use Save as PDF");
  }

  async function bulkImport(file) {
    const text = await file.text();
    const rowsIn = parseCsv(text);
    if (rowsIn.length < 2) {
      toast.error("CSV must contain a header row and at least one student");
      return;
    }
    const header = rowsIn[0].map((h) => h.toLowerCase());
    const idx = (k) => header.indexOf(k);
    let added = 0;
    const skipped = [];
    for (const row of rowsIn.slice(1)) {
      const roll = (row[idx("roll")] ?? "").toUpperCase();
      const name = row[idx("name")] ?? "";
      if (!roll || !name) continue;
      const gender = (row[idx("gender")] ?? "male").toLowerCase() === "female" ? "female" : "male";
      const branch = (row[idx("branch")] ?? branches[0]?.code ?? "CSE").toUpperCase();
      const res = addStudent({
        name,
        roll,
        email: row[idx("email")] || `${roll.toLowerCase()}@college.edu`,
        mobile: row[idx("mobile")] ?? "",
        branch,
        section: (row[idx("section")] ?? "A").toUpperCase(),
        semester: Number(row[idx("semester")]) || currentSemester,
        address: row[idx("address")] ?? "",
        gender,
        photo: `https://randomuser.me/api/portraits/${gender === "male" ? "men" : "women"}/${
        Math.abs(hash(roll)) % 90}.jpg`
      });
      if (res.ok) added++;else
      skipped.push(roll);
    }
    toast.success(
      `Imported ${added} students${skipped.length ? ` · skipped duplicates: ${skipped.join(", ")}` : ""}`
    );
  }

  function downloadTemplate() {
    downloadCsv(
      [
      ["roll", "name", "email", "mobile", "branch", "section", "semester", "gender", "address"],
      [
      "22CSEA007",
      "New Student",
      "22csea007@college.edu",
      "9876543210",
      "CSE",
      "A",
      String(currentSemester),
      "male",
      "Hyderabad, India"]],


      "students-import-template.csv"
    );
  }

  return (
    <div>
      <PageHeader
        title="Students Management"
        subtitle={`${state.students.length} students · listed in roll number order`}
        icon={Users}
        action={
        <>
            <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void bulkImport(f);
              e.target.value = "";
            }} />
          
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 size-4" /> Template
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 size-4" /> Bulk Import
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <FileSpreadsheet className="mr-2 size-4" /> Excel
            </Button>
            <Button variant="outline" onClick={exportPdfReport}>
              <FileText className="mr-2 size-4" /> PDF
            </Button>
            <Button onClick={openAdd}>
              <Plus className="mr-2 size-4" /> Add Student
            </Button>
          </>
        } />
      

      <GlassCard>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, roll or email…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9" />
            
          </div>
          <Select
            value={branchFilter}
            onValueChange={(v) => {
              setBranchFilter(v);
              setSectionFilter("all");
              setPage(1);
            }}>
            
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) =>
              <SelectItem key={b.code} value={b.code}>
                  {b.code}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={!sections.length}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((s) =>
              <SelectItem key={s} value={s}>
                  Section {s}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Student</TableHead>
                <TableHead className="w-[18%]">Roll Number</TableHead>
                <TableHead className="w-[15%]">Branch</TableHead>
                <TableHead className="w-[12%] text-center">Semester</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) =>
              <TableRow key={s.id}>
                  <TableCell className="w-[40%]">
                    <button
                    className="flex items-center gap-3 text-left"
                    onClick={() => navigate({ to: "/students", search: { view: s.id } })}>

                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={s.photo} alt={s.name} />
                        <AvatarFallback>{s.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="w-[18%] font-mono text-sm">{s.roll}</TableCell>
                  <TableCell className="w-[15%]">
                    <span className="inline-flex items-center gap-1">
                      {s.branch}<span className="text-muted-foreground">·</span>{s.section}
                    </span>
                  </TableCell>
                  <TableCell className="w-[12%] text-center">{s.semester}</TableCell>
                  <TableCell className="w-[15%] text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteStudent(s.id);
                      toast.success(`${s.name} removed`);
                    }}>

                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {rows.length === 0 &&
              <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No students match your filters.
                  </TableCell>
                </TableRow>
              }
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Showing {rows.length} of {filtered.length} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}>
              
              Previous
            </Button>
            <span className="px-2">
              Page {current} / {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}>
              
              Next
            </Button>
          </div>
        </div>
      </GlassCard>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Student" : "Add Student"}</DialogTitle>
            <DialogDescription>
              Roll numbers are unique — a duplicate roll will be rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              
            </Field>
            <Field label="Roll number">
              <Input
                value={form.roll}
                onChange={(e) => setForm({ ...form, roll: e.target.value.toUpperCase() })} />
              
            </Field>
            <Field label="College mail">
              <Input
                value={form.email}
                placeholder="auto generated from roll"
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              
            </Field>
            <Field label="Mobile">
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              
            </Field>
            <Field label="Branch">
              <Select
                value={form.branch}
                onValueChange={(v) =>
                setForm({
                  ...form,
                  branch: v,
                  section: branches.find((b) => b.code === v)?.sections[0] ?? "A"
                })
                }>
                
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) =>
                  <SelectItem key={b.code} value={b.code}>
                      {b.code} — {b.name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={form.section}
                onValueChange={(v) => setForm({ ...form, section: v })}>
                
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(branches.find((b) => b.code === form.branch)?.sections ?? ["A"]).map((s) =>
                  <SelectItem key={s} value={s}>
                      Section {s}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Gender">
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v })}>
                
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
                
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewing}
        onOpenChange={(o) => !o && navigate({ to: "/students", search: {} })}>
        
        <DialogContent className="sm:max-w-md">
          {viewing &&
          <>
              <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
                <DialogDescription>{viewing.roll}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={viewing.photo} alt={viewing.name} />
                  <AvatarFallback>{viewing.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold">{viewing.name}</p>
                  <p className="text-sm text-muted-foreground">{viewing.email}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Branch" value={viewing.branch} />
                <Info label="Section" value={viewing.section} />
                <Info label="Semester" value={String(viewing.semester)} />
                <Info label="Mobile" value={viewing.mobile} />
                <Info label="Address" value={viewing.address} />
              </dl>
              <DialogFooter>
                <Button
                variant="outline"
                onClick={() => navigate({ to: "/marks", search: { branch: viewing.branch } })}>
                
                  View marks
                </Button>
                <Button onClick={() => openEdit(viewing)}>Edit</Button>
              </DialogFooter>
            </>
          }
        </DialogContent>
      </Dialog>
    </div>);

}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>);

}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>);

}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

export default StudentsPage;
