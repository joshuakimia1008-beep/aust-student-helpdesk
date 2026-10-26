import { Bell, Inbox, LayoutDashboard, ScrollText, Settings, Users } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { Status } from './store'

export type AdminSection = { to: string; label: string; icon: Component; exact: boolean }

export const adminSections: AdminSection[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/requests', label: 'Requests', icon: Inbox, exact: false },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell, exact: true },
  { to: '/admin/admins', label: 'Team & Roles', icon: Users, exact: true },
  { to: '/admin/logs', label: 'Activity Log', icon: ScrollText, exact: true },
  { to: '/admin/settings', label: 'Settings', icon: Settings, exact: true },
]

export function isSectionActive(pathname: string, to: string, exact: boolean) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return exact ? p === to : p.startsWith(to)
}

export const statusStyle: Record<Status, string> = {
  pending: 'bg-warning/15 text-warning-foreground',
  accepted: 'bg-success/15 text-success',
  declined: 'bg-destructive/15 text-destructive',
  meeting: 'bg-info/15 text-info',
}
