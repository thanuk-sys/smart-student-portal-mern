import { useNavigate } from "@/lib/router-compat";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList } from
"@/components/ui/command";
import { usePortal } from "@/lib/portal/store";

export function GlobalSearch({
  open,
  onOpenChange



}) {
  const { state, session, currentStudent } = usePortal();
  const navigate = useNavigate();
  const isAdmin = session?.role === "admin";

  const students = isAdmin ? state.students : [];
  const subjects = isAdmin ?
  state.subjects :
  state.subjects.filter((s) => s.branch === currentStudent?.branch);
  const library = isAdmin ?
  state.library :
  state.library.filter((l) => l.branch === currentStudent?.branch);

  function go(to, search) {
    onOpenChange(false);
    navigate({ to, search: search });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search students, notices, subjects, books…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {students.length > 0 &&
        <CommandGroup heading="Students">
            {students.slice(0, 50).map((s) =>
          <CommandItem
            key={s.id}
            value={`${s.name} ${s.roll} ${s.branch} ${s.section}`}
            onSelect={() => go("/students", { view: s.id })}>
            
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {s.roll} · {s.branch}-{s.section}
                </span>
              </CommandItem>
          )}
          </CommandGroup>
        }
        <CommandGroup heading="Notices">
          {state.notices.map((n) =>
          <CommandItem
            key={n.id}
            value={`${n.title} ${n.category}`}
            onSelect={() => go("/notices", { view: n.id })}>
            
              <span className="truncate">{n.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{n.category}</span>
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Subjects">
          {subjects.map((s) =>
          <CommandItem
            key={`${s.branch}-${s.code}-${s.semester}`}
            value={`${s.name} ${s.code} ${s.branch}`}
            onSelect={() => go("/marks", { branch: s.branch })}>
            
              <span>{s.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {s.branch} · Sem {s.semester}
              </span>
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Library">
          {library.map((l) =>
          <CommandItem
            key={l.id}
            value={`${l.book} ${l.author} ${l.subject}`}
            onSelect={() => go("/library", { view: l.id })}>
            
              <span>{l.book}</span>
              <span className="ml-2 text-xs text-muted-foreground">{l.author}</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>);

}