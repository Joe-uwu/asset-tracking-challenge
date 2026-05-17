"use client";

import { useEffect, useState } from "react";
import { getRole, setRole, type Role } from "@/lib/auth";

export function RoleSwitcher() {
  const [role, setRoleState] = useState<Role>("tech");

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  function handleClick(): void {
    const next: Role = role === "tech" ? "manager" : "tech";
    setRole(next);
    setRoleState(next);
    window.location.reload();
  }

  const label =
    role === "tech" ? "Switch to manager view" : "Switch to tech view";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group min-h-[44px] rounded-md border border-slate-800 bg-white px-3 py-1.5 text-sm text-slate-900 transition hover:bg-slate-900 hover:text-white"
      aria-label={label}
    >
      <span className="mr-2 text-slate-600 transition group-hover:text-slate-200">role: {role}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
