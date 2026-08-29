import { useRef, useState } from "react";

import { Calendar, Download, Eye, Trash2, Upload } from "lucide-react";
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



function TimetablePage() {
  const { state, branches, currentSemester, session, currentStudent, update } = usePortal();
  const isAdmin = session?.role === "admin";
  const fileRef = useRef(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState(branches[0]?.code ?? "CSE");
  const [section, setSection] = useState("A");
  const [file, setFile] = useState(null);
  const [viewing, setViewing] = useState(null);

  const docs = isAdmin ?
  state.timetable :
  state.timetable.filter(
    (t) => t.branch === currentStudent?.branch && t.section === currentStudent?.section
  );

  async function upload() {
    if (!file || !title.trim()) {
      toast.error("Provide a title and choose a PDF file");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const doc = {
      id: crypto.randomUUID(),
      title: title.trim(),
      branch,
      section,
      semester: currentSemester,
      fileName: file.name,
      dataUrl,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
    update((s) => ({ ...s, timetable: [doc, ...s.timetable] }));
    setUploadOpen(false);
    setTitle("");
    setFile(null);
    toast.success("Timetable uploaded");
  }

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle={
        isAdmin ?
        "Upload a timetable PDF with a title for each branch and section" :
        "Your class timetable"
        }
        icon={Calendar}
        action={
        isAdmin ?
        <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 size-4" /> Upload Timetable
            </Button> :
        undefined
        } />
      

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((t) =>
        <GlassCard key={t.id} className="card-hover flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.fileName} · {formatBytes(t.size)} · {formatDate(t.uploadedAt)}
                </p>
              </div>
              <Badge variant="secondary">
                {t.branch}-{t.section}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setViewing(t)}>
                <Eye className="mr-2 size-4" /> View
              </Button>
              <Button
              size="sm"
              variant="outline"
              onClick={() => downloadDataUrl(t.dataUrl, t.fileName)}>
              
                <Download className="mr-2 size-4" /> Download
              </Button>
              {isAdmin &&
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                update((s) => ({ ...s, timetable: s.timetable.filter((x) => x.id !== t.id) }));
                toast.success("Timetable deleted");
              }}>
              
                  <Trash2 className="size-4 text-destructive" />
                </Button>
            }
            </div>
          </GlassCard>
        )}
      </div>
      {docs.length === 0 && <EmptyState text="No timetable has been uploaded yet." />}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Timetable</DialogTitle>
            <DialogDescription>Give the timetable a title and attach the PDF.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={branch}
                  onValueChange={(v) => {
                    setBranch(v);
                    setSection(branches.find((b) => b.code === v)?.sections[0] ?? "A");
                  }}>
                  
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
                <Label>Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(branches.find((b) => b.code === branch)?.sections ?? ["A"]).map((s) =>
                    <SelectItem key={s} value={s}>
                        Section {s}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>PDF file</Label>
              <input
                ref={fileRef}
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
      </Dialog>

      {viewing &&
      <FileViewer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing.title}
        fileName={viewing.fileName}
        dataUrl={viewing.dataUrl} />

      }
    </div>);

}

export default TimetablePage;