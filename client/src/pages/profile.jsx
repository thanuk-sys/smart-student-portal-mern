import { useState } from "react";

import { Camera, KeyRound, User } from "lucide-react";
import { toast } from "sonner";
import { usePortal } from "@/lib/portal/store";
import { GlassCard, PageHeader } from "@/components/portal/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { readFileAsDataUrl } from "@/lib/portal/files";


function ProfilePage() {
  const { session, state, currentStudent, update, updateStudent } = usePortal();
  const isAdmin = session?.role === "admin";

  const [adminForm, setAdminForm] = useState(state.admin);
  const [studentForm, setStudentForm] = useState(currentStudent);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  async function pickPhoto(file, target) {
    const dataUrl = await readFileAsDataUrl(file);
    if (target === "admin") setAdminForm((f) => ({ ...f, photo: dataUrl }));else
    setStudentForm((f) => f ? { ...f, photo: dataUrl } : f);
  }

  function saveAdmin() {
    update((s) => ({ ...s, admin: { ...s.admin, ...adminForm } }));
    toast.success("Profile updated");
  }

  function saveStudent() {
    if (!studentForm || !currentStudent) return;
    const res = updateStudent(currentStudent.id, {
      name: studentForm.name,
      email: studentForm.email,
      mobile: studentForm.mobile,
      address: studentForm.address,
      photo: studentForm.photo
    });
    if (!res.ok) toast.error(res.error ?? "Could not save");else
    toast.success("Profile updated");
  }

  function changePassword() {
    if (pwd.current !== state.admin.password) {
      toast.error("Current password is incorrect");
      return;
    }
    if (pwd.next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    update((s) => ({ ...s, admin: { ...s.admin, password: pwd.next } }));
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Password updated");
  }

  if (isAdmin) {
    return (
      <div>
        <PageHeader title="My Profile" subtitle="Administrator account" icon={User} />
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                <Avatar className="size-24 border-2 border-primary/40">
                  <AvatarImage src={adminForm.photo} alt={adminForm.name} />
                  <AvatarFallback>{adminForm.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Camera className="size-4" />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void pickPhoto(f, "admin");
                    }} />
                  
                </label>
              </div>
              <div>
                <p className="text-xl font-bold">{adminForm.name}</p>
                <Badge className="mt-1">Administrator</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input
                  value={adminForm.mobile}
                  onChange={(e) => setAdminForm({ ...adminForm, mobile: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value="Administrator" disabled />
              </div>
            </div>
            <Button className="mt-5" onClick={saveAdmin}>
              Save changes
            </Button>
          </GlassCard>

          <GlassCard>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="size-4" /> Change Password
            </h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
                
              </div>
              <div className="space-y-2">
                <Label>Confirm new password</Label>
                <Input
                  type="password"
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                
              </div>
              <Button className="w-full" onClick={changePassword}>
                Update password
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>);

  }

  if (!studentForm) return null;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Student account" icon={User} />
      <GlassCard className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <Avatar className="size-24 border-2 border-primary/40">
              <AvatarImage src={studentForm.photo} alt={studentForm.name} />
              <AvatarFallback>{studentForm.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Camera className="size-4" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickPhoto(f, "student");
                }} />
              
            </label>
          </div>
          <div>
            <p className="text-xl font-bold">{studentForm.name}</p>
            <p className="text-sm text-muted-foreground">{studentForm.roll}</p>
            <Badge className="mt-1">
              {studentForm.branch} · Section {studentForm.section} · Semester {studentForm.semester}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
            
          </div>
          <div className="space-y-2">
            <Label>College mail</Label>
            <Input
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
            
          </div>
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input
              value={studentForm.mobile}
              onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })} />
            
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={studentForm.address}
              onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })} />
            
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input value={studentForm.branch} disabled />
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Input value={studentForm.section} disabled />
          </div>
          <div className="space-y-2">
            <Label>Semester</Label>
            <Input value={studentForm.semester} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value="Student" disabled />
          </div>
        </div>
        <Button className="mt-5" onClick={saveStudent}>
          Save changes
        </Button>
      </GlassCard>
    </div>);

}

export default ProfilePage;