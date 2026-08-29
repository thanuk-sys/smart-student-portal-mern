import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { dataUrlToBlobUrl, downloadDataUrl } from "@/lib/portal/files";

export function FileViewer({
  open,
  onClose,
  title,
  fileName,
  dataUrl






}) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!open || !dataUrl) return;
    const u = dataUrlToBlobUrl(dataUrl);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [open, dataUrl]);

  const isImage = dataUrl.startsWith("data:image");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8 truncate">{title}</DialogTitle>
        </DialogHeader>
        <div className="h-[65vh] overflow-hidden rounded-xl border border-border bg-secondary/40">
          {url ?
          isImage ?
          <img src={url} alt={title} className="size-full object-contain" /> :

          <iframe src={url} title={title} className="size-full" /> :

          null}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => downloadDataUrl(dataUrl, fileName)}>
            <Download className="mr-2 size-4" /> Download
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>);

}