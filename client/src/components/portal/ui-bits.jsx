
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action





}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 animate-fade-up">
      {Icon &&
      <div className="gradient-primary flex size-11 items-center justify-center rounded-2xl shadow-lg">
          <Icon className="size-5 text-white" />
        </div>
      }
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto flex flex-wrap gap-2">{action}</div>}
    </div>);

}

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  gradient






}) {
  return (
    <div
      className={cn(
        "card-hover relative overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-lg",
        gradient
      )}>
      
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/15 blur-xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
          {hint && <p className="mt-1 text-xs text-white/80">{hint}</p>}
        </div>
        <div className="rounded-xl bg-white/20 p-2.5">
          <Icon className="size-5" />
        </div>
      </div>
    </div>);

}

export function GlassCard({
  className,
  children



}) {
  return (
    <div className={cn("glass rounded-2xl p-5 shadow-sm", className)}>{children}</div>);

}

export function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>);

}