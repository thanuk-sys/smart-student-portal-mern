import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@/lib/router-compat";
import { Download, Eye, Library, Plus, Search, Trash2 } from "lucide-react";
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



function LibraryPage() {
  const { state, branches, session, currentStudent, update } = usePortal();
  const navigate = useNavigate();
  const search = useSearch();
  const isAdmin = session?.role === "admin";
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : currentStudent?.branch ?? "all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    book: "",
    author: "",
    subject: "",
    branch: branches[0]?.code ?? "CSE"
  });
  const [file, setFile] = useState(null);
  const [viewing, setViewing] = useState(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.library.
    filter((l) => isAdmin ? true : l.branch === currentStudent?.branch).
    filter((l) => branchFilter === "all" ? true : l.branch === branchFilter).
    filter(
      (l) =>
      !q ||
      l.book.toLowerCase().includes(q) ||
      l.author.toLowerCase().includes(q) ||
      l.subject.toLowerCase().includes(q)
    );
  }, [state.library, query, branchFilter, isAdmin, currentStudent]);

  const deepLinked = state.library.find((l) => l.id === search.view) ?? null;

  async function add() {
    if (!form.book.trim() || !file) {
      toast.error("Book name and material file are required");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const item = {
      id: crypto.randomUUID(),
      ...form,
      title: form.book.trim(),
      fileName: file.name,
      dataUrl,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
    update((s) => ({ ...s, library: [item, ...s.library] }));
    setAddOpen(false);
    setFile(null);
    setForm({ book: "", author: "", subject: "", branch: branches[0]?.code ?? "CSE" });
    toast.success("Material added to the library");
  }

  return (
    <div>
      <PageHeader
        title="Library"
        subtitle={isAdmin ? "Books and study materials for all branches" : "Materials for your branch"}
        icon={Library}
        action={
        isAdmin ?
        <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 size-4" /> Add Material
            </Button> :
        undefined
        } />
      

      <GlassCard>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by book, author or subject…"
              value={query}
              onChange={(e) => setQuery(e.target.value)} />
            
          </div>
          {isAdmin &&
          <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
          }
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((l) =>
          <div key={l.id} className="card-hover rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{l.book}</p>
                  <p className="text-sm text-muted-foreground">{l.author}</p>
                </div>
                <Badge variant="secondary">{l.branch}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {l.subject} · {formatBytes(l.size)} · {formatDate(l.uploadedAt)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setViewing(l)}>
                  <Eye className="mr-2 size-4" /> View
                </Button>
                <Button
                size="sm"
                variant="outline"
                onClick={() => downloadDataUrl(l.dataUrl, l.fileName)}>
                
                  <Download className="mr-2 size-4" /> Download
                </Button>
                {isAdmin &&
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  update((s) => ({ ...s, library: s.library.filter((x) => x.id !== l.id) }));
                  toast.success("Material removed");
                }}>
                
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
              }
              </div>
            </div>
          )}
        </div>
        {items.length === 0 && <EmptyState text="No materials found." />}
      </GlassCard>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Library Material</DialogTitle>
            <DialogDescription>Attach notes or a book PDF for a branch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Book / material name</Label>
              <Input value={form.book} onChange={(e) => setForm({ ...form, book: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                
              </div>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
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
              <Label>File</Label>
              <input
                type="file"
                accept="application/pdf,image/*,text/plain"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-border bg-secondary/50 p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
              
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void add()}>Add material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(viewing || deepLinked) &&
      <FileViewer
        open
        onClose={() => {
          setViewing(null);
          if (deepLinked) navigate({ to: "/library", search: {} });
        }}
        title={(viewing ?? deepLinked).book}
        fileName={(viewing ?? deepLinked).fileName}
        dataUrl={(viewing ?? deepLinked).dataUrl} />

      }
    </div>);

}

export default LibraryPage;