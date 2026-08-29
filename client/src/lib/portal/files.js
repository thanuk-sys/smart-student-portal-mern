export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function dataUrlToBlobUrl(dataUrl) {
  const [meta = "", b64 = ""] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function downloadCsv(rows, fileName) {
  const csv = rows.
  map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).
  join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Opens a print-ready window so the browser can save it as PDF. */
export function exportPdf(title, headers, rows) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;padding:32px;color:#111}
    h1{font-size:20px;margin:0 0 4px}
    p{color:#666;font-size:12px;margin:0 0 20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#1e293b;color:#fff;text-align:left;padding:8px}
    td{padding:8px;border-bottom:1px solid #e5e7eb}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <h1>${title}</h1><p>Smart Student Portal &middot; generated ${new Date().toLocaleString()}</p>
  <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
  return true;
}

export function parseCsv(text) {
  return text.
  split(/\r?\n/).
  filter((l) => l.trim().length > 0).
  map((line) => {
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') quoted = false;else
        cur += ch;
      } else if (ch === '"') quoted = true;else
      if (ch === ",") {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}