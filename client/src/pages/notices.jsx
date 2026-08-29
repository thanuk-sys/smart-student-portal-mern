import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@/lib/router-compat";
import { Download, Eye, Megaphone, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePortal } from "@/lib/portal/store";
import { EmptyState, GlassCard, PageHeader } from "@/components/portal/ui-bits";
import { FileViewer } from "@/components/portal/FileViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { downloadDataUrl, formatDate, readFileAsDataUrl } from "@/lib/portal/files";


const CATEGORIES = [
"Academic",
"Examination",
"Holiday",
"Placement",
"General"];



function NoticesPage() {
  const { state, session, update } = usePortal();
  const navigate = useNavigate();
  const search = useSearch();
  const isAdmin = session?.role === "admin";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "Academic"
  });
  const [file, setFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

  const notices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.notices].
    filter((n) => category === "all" ? true : n.category === category).
    filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)).
    sort(
      (a, b) =>
      Number(b.pinned) - Number(a.pinned) || +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, [state.notices, query, category]);

  const opened = state.notices.find((n) => n.id === search.view) ?? null;

  async function create() {
    if (!form.title.trim()) {
      toast.error("Notice title is required");
      return;
    }
    const notice = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      pinned: false,
      createdAt: new Date().toISOString(),
      file: file ? { fileName: file.name, dataUrl: await readFileAsDataUrl(file) } : null
    };
    update((s) => ({ ...s, notices: [notice, ...s.notices] }));
    setCreateOpen(false);
    setForm({ title: "", body: "", category: "Academic" });
    setFile(null);
    toast.success("Notice published");
  }

  return (
    <div>
      <PageHeader
        title="Notices"
        subtitle={isAdmin ? "Publish and pin institute announcements" : "Latest institute announcements"}
        icon={Megaphone}
        action={
        isAdmin ?
        <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Notice
            </Button> :
        undefined
        } />
      

      <GlassCard>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search notices…"
              value={query}
              onChange={(e) => setQuery(e.target.value)} />
            
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) =>
              <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-3">
          {notices.map((n) =>
          <div key={n.id} className="card-hover rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex flex-wrap items-center gap-2">
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
              <p className="mt-2 text-lg font-bold">{n.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: "/notices", search: { view: n.id } })}>
                
                  <Eye className="mr-2 size-4" /> View
                </Button>
                {n.file &&
              <>
                    <Button size="sm" variant="outline" onClick={() => setViewingFile(n)}>
                      <Eye className="mr-2 size-4" /> View PDF
                    </Button>
                    <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadDataUrl(n.file.dataUrl, n.file.fileName)}>
                  
                      <Download className="mr-2 size-4" /> Download PDF
                    </Button>
                  </>
              }
                {isAdmin &&
              <>
                    <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                  update((s) => ({
                    ...s,
                    notices: s.notices.map((x) =>
                    x.id === n.id ? { ...x, pinned: !x.pinned } : x
                    )
                  }))
                  }>
                  
                      {n.pinned ?
                  <>
                          <PinOff className="mr-2 size-4" /> Unpin
                        </> :

                  <>
                          <Pin className="mr-2 size-4" /> Pin
                        </>
                  }
                    </Button>
                    <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    update((s) => ({ ...s, notices: s.notices.filter((x) => x.id !== n.id) }));
                    toast.success("Notice deleted");
                  }}>
                  
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </>
              }
              </div>
            </div>
          )}
        </div>
        {notices.length === 0 && <EmptyState text="No notices match your search." />}
      </GlassCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Notice</DialogTitle>
            <DialogDescription>Optionally attach a PDF to the announcement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })} />
              
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}>
                
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) =>
                  <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attach PDF (optional)</Label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
              
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()}>Publish notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!opened} onOpenChange={(o) => !o && navigate({ to: "/notices", search: {} })}>
        <DialogContent className="sm:max-w-lg">
          {opened &&
          <>
              <DialogHeader>
                <DialogTitle>{opened.title}</DialogTitle>
                <DialogDescription>
                  {opened.category} · {formatDate(opened.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm">{opened.body}</p>
              {opened.file &&
            <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setViewingFile(opened)}>
                    <Eye className="mr-2 size-4" /> View attachment
                  </Button>
                  <Button
                variant="outline"
                onClick={() => downloadDataUrl(opened.file.dataUrl, opened.file.fileName)}>
                
                    <Download className="mr-2 size-4" /> Download
                  </Button>
                </div>
            }
            </>
          }
        </DialogContent>
      </Dialog>

      {viewingFile?.file &&
      <FileViewer
        open
        onClose={() => setViewingFile(null)}
        title={viewingFile.title}
        fileName={viewingFile.file.fileName}
        dataUrl={viewingFile.file.dataUrl} />

      }
    </div>);

}

export default NoticesPage;