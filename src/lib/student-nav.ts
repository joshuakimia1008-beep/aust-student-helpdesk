import {
  BookOpen,
  CircleUserRound,
  FilePlus2,
  LayoutDashboard,
  MessagesSquare,
} from "lucide-vue-next";
import type { Component } from "vue";

export type StudentSection = {
  to: string;
  label: string;
  icon: Component;
  exact: boolean;
};

export const studentSections: StudentSection[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    to: "/complaint",
    label: "Lodge a complaint",
    icon: MessagesSquare,
    exact: false,
  },
  {
    to: "/facility-request",
    label: "Request an item",
    icon: FilePlus2,
    exact: false,
  },
  { to: "/venue-request", label: "Book a venue", icon: BookOpen, exact: false },
  {
    to: "/student/profile",
    label: "My profile",
    icon: CircleUserRound,
    exact: true,
  },
];

export function isStudentSectionActive(
  pathname: string,
  to: string,
  exact: boolean,
) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  // A single submission belongs to the dashboard.
  if (to === "/student")
    return p === "/student" || p.startsWith("/student/submissions");
  return exact ? p === to : p === to || p.startsWith(`${to}/`);
}
