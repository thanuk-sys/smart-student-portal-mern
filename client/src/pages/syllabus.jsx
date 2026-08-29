import { useMemo, useState } from "react";

import { ArrowLeft, Download, Eye, FileText, Layers, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { usePortal } from "@/lib/portal/store";
import { EmptyState, GlassCard, PageHeader } from "@/components/portal/ui-bits";
import { FileViewer } from "@/components/portal/FileViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { downloadDataUrl, formatBytes, formatDate, readFileAsDataUrl } from "@/lib/portal/files";



function SyllabusPage() {
  const { state, branches, currentSemester, session, currentStudent, update } = usePortal();
  const isAdmin = session?.role === "admin";
  const [branch, setBranch] = useState(isAdmin ? null : currentStudent?.branch ?? null);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState(currentSemester);
  const [uploadBranch, setUploadBranch] = useState(branches[0]?.code ?? "CSE");
  const [file, setFile] = useState(null);
  const [viewing, setViewing] = useState(null);

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.syllabus.
    filter((d) => d.branch === branch).
    filter(
      (d) =>
      !q ||
      d.title.toLowerCase().includes(q) ||
      String(d.semester).includes(q) ||
      `semester ${d.semester}`.includes(q)
    ).
    sort((a, b) => b.semester - a.semester);
  }, [state.syllabus, branch, query]);

  async function upload() {
    if (!file || !title.trim()) {
      toast.error("Provide a title and choose a file");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const doc = {
      id: crypto.randomUUID(),
      title: title.trim(),
      branch: uploadBranch,
      semester,
      fileName: file.name,
      dataUrl,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
    update((s) => ({ ...s, syllabus: [doc, ...s.syllabus] }));
    setUploadOpen(false);
    setTitle("");
    setFile(null);
    setBranch(uploadBranch);
    toast.success("Syllabus uploaded");
  }

  if (!branch) {
    return (
      <div>
        <PageHeader
          title="Syllabus"
          subtitle="Select a branch to open its semester syllabus files"
          icon={FileText}
          action={
          isAdmin ?
          <Button onClick={() => setUploadOpen(true)}>
                <Upload className="mr-2 size-4" /> Upload Syllabus
              </Button> :
          undefined
          } />
        
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
                  {state.syllabus.filter((s) => s.branch === b.code).length}
                </span>{" "}
                syllabus files
              </p>
            </button>
          )}
        </div>
        <UploadDialog />
      </div>);

  }

  return (
    <div>
      <PageHeader
        title={`${branch} · Syllabus`}
        subtitle="One syllabus file per semester"
        icon={FileText}
        action={
        <>
            {isAdmin &&
          <>
                <Button variant="outline" onClick={() => setBranch(null)}>
                  <ArrowLeft className="mr-2 size-4" /> All branches
                </Button>
                <Button
              onClick={() => {
                setUploadBranch(branch);
                setUploadOpen(true);
              }}>
              
                  <Upload className="mr-2 size-4" /> Upload Syllabus
                </Button>
              </>
          }
          </>
        } />
      

      <GlassCard>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title or semester…"
            value={query}
            onChange={(e) => setQuery(e.target.value)} />
          
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {docs.map((d) =>
          <div key={d.id} className="card-hover rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.fileName} · {formatBytes(d.size)} · {formatDate(d.uploadedAt)}
                  </p>
                </div>
                <Badge variant="secondary">Sem {d.semester}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setViewing(d)}>
                  <Eye className="mr-2 size-4" /> View
                </Button>
                <Button
                size="sm"
                variant="outline"
                onClick={() => downloadDataUrl(d.dataUrl, d.fileName)}>
                
                  <Download className="mr-2 size-4" /> Download
                </Button>
                {isAdmin &&
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  update((s) => ({ ...s, syllabus: s.syllabus.filter((x) => x.id !== d.id) }));
                  toast.success("Syllabus deleted");
                }}>
                
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
              }
              </div>
            </div>
          )}
        </div>
        {docs.length === 0 && <EmptyState text="No syllabus files found." />}
      </GlassCard>

      <UploadDialog />

      {viewing &&
      <FileViewer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing.title}
        fileName={viewing.fileName}
        dataUrl={viewing.dataUrl} />

      }
    </div>);


  function UploadDialog() {
    return (
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Syllabus</DialogTitle>
            <DialogDescription>
              Upload one file per semester and give it a clear title.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={uploadBranch} onValueChange={setUploadBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) =>
                    <SelectItem key={b.code} value={b.code}>
                        {b.code}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={String(semester)} onValueChange={(v) => setSemester(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) =>
                    <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
              
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void upload()}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>);

  }
}

export default SyllabusPage;