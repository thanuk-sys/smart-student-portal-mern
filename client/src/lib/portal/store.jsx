import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState } from

"react";
import { api, setToken, getToken } from "@/lib/api";
import { BRANCHES, CURRENT_SEMESTER, DEFAULT_ADMIN } from "./data";












const SESSION_KEY = "ssp-session-v1";













const EMPTY = {
  admin: DEFAULT_ADMIN,
  students: [],
  subjects: [],
  marks: [],
  notices: [],
  library: [],
  syllabus: [],
  timetable: [],
  readNoticeIds: []
};






















const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const dirty = useRef(false);
  const timer = useRef(null);

  /* ------------------------------ initial load ----------------------------- */
  useEffect(() => {
    const t = localStorage.getItem("ssp-theme");
    if (t === "light" || t === "dark") setTheme(t);

    const raw = localStorage.getItem(SESSION_KEY);
    const stored = raw ? JSON.parse(raw) : null;

    (async () => {
      try {
        if (stored && getToken()) {
          const data = await api("/state");
          setState(data);
          setSession(stored);
        }
      } catch {
        setToken(null);
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  /* --------------------------- persist to MongoDB -------------------------- */
  useEffect(() => {
    if (!ready || !session || !dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dirty.current = false;
      api("/state", { method: "PUT", body: JSON.stringify(state) }).catch((e) =>
      console.error("Failed to save:", e)
      );
    }, 400);
  }, [state, ready, session]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("ssp-theme", theme);
  }, [theme]);

  const update = useCallback((fn) => {
    dirty.current = true;
    setState((prev) => fn(prev));
  }, []);

  /* ---------------------------------- auth --------------------------------- */
  const login = useCallback(async (username, password) => {
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password })
      });
      setToken(res.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(res.session));
      const data = await api("/state");
      setState(data);
      setSession(res.session);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setState(EMPTY);
  }, []);

  /* -------------------------------- students ------------------------------- */
  const addStudent = useCallback((s) => {
    const roll = s.roll.trim().toUpperCase();
    let error;
    dirty.current = true;
    setState((prev) => {
      if (prev.students.some((x) => x.roll.toUpperCase() === roll)) {
        error = `Roll number ${roll} is already present`;
        return prev;
      }
      const student = { ...s, roll, id: roll };
      const subs = prev.subjects.filter((x) => x.branch === s.branch);
      const newMarks = subs.map((sub) => ({
        id: `${student.id}-${sub.code}`,
        studentId: student.id,
        subjectCode: sub.code,
        semester: sub.semester,
        mid1: null,
        mid2: null,
        assignment: null,
        external: null
      }));
      return {
        ...prev,
        students: [...prev.students, student].sort((a, b) => a.roll.localeCompare(b.roll)),
        marks: [...prev.marks, ...newMarks]
      };
    });
    return error ? { ok: false, error } : { ok: true };
  }, []);

  const updateStudent = useCallback((id, patch) => {
    let error;
    dirty.current = true;
    setState((prev) => {
      if (patch.roll) {
        const roll = patch.roll.trim().toUpperCase();
        if (prev.students.some((x) => x.id !== id && x.roll.toUpperCase() === roll)) {
          error = `Roll number ${roll} is already present`;
          return prev;
        }
      }
      return {
        ...prev,
        students: prev.students.
        map((x) => x.id === id ? { ...x, ...patch } : x).
        sort((a, b) => a.roll.localeCompare(b.roll))
      };
    });
    return error ? { ok: false, error } : { ok: true };
  }, []);

  const deleteStudent = useCallback((id) => {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      students: prev.students.filter((x) => x.id !== id),
      marks: prev.marks.filter((m) => m.studentId !== id)
    }));
  }, []);

  /* ---------------------------------- marks -------------------------------- */
  const upsertMark = useCallback((m) => {
    dirty.current = true;
    setState((prev) => {
      const exists = prev.marks.some((x) => x.id === m.id);
      return {
        ...prev,
        marks: exists ? prev.marks.map((x) => x.id === m.id ? m : x) : [...prev.marks, m]
      };
    });
  }, []);

  const deleteMark = useCallback((id) => {
    dirty.current = true;
    setState((prev) => ({ ...prev, marks: prev.marks.filter((x) => x.id !== id) }));
  }, []);

  const markNoticesRead = useCallback(() => {
    dirty.current = true;
    setState((prev) => ({ ...prev, readNoticeIds: prev.notices.map((n) => n.id) }));
  }, []);

  const currentStudent = useMemo(
    () =>
    session?.role === "student" ?
    state.students.find((s) => s.id === session.studentId) ?? null :
    null,
    [session, state.students]
  );

  const unreadCount = state.notices.filter((n) => !state.readNoticeIds.includes(n.id)).length;

  const value = {
    state,
    ready,
    session,
    currentStudent,
    branches: BRANCHES,
    currentSemester: CURRENT_SEMESTER,
    login,
    logout,
    update,
    addStudent,
    updateStudent,
    deleteStudent,
    upsertMark,
    deleteMark,
    markNoticesRead,
    unreadCount,
    theme,
    toggleTheme: () => setTheme((t) => t === "dark" ? "light" : "dark")
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}