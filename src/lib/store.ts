// DATA LAYER
// Every read and write in the app goes through this module, and no component touches
// localStorage directly. Today it keeps demo data in localStorage. To move to Supabase,
// replace the bodies of the exported functions below (keep the names and types) and the
// pages will not need to change. See README.md, "Connecting Supabase".
import { computed, reactive, watch, type ComputedRef } from 'vue'

export type Kind = 'complaint' | 'venue' | 'facility'
export type Status = 'pending' | 'accepted' | 'declined' | 'meeting'
export type Role = 'Super Admin' | 'Complaint Admin' | 'Venue Admin' | 'Read-Only Admin'

export type Applicant = {
  fullName: string
  email: string
  idNumber: string
  phone: string
  applicantType?: string
}

export type SentEmail = { to: string; subject: string; body: string; sentAt: string; by: string }

export type Submission = {
  id: string
  kind: Kind
  status: Status
  createdAt: string
  applicant: Applicant
  title: string
  location?: string
  fields: Record<string, string>
  evidence?: string[]
  adminResponse?: string
  emails: SentEmail[]
}

export type Admin = { id: string; name: string; email: string; role: Role; active: boolean }
export type LogEntry = { id: string; admin: string; action: string; recordId: string; at: string }
export type Notice = { id: string; text: string; at: string; read: boolean }

export type State = {
  submissions: Submission[]
  admins: Admin[]
  logs: LogEntry[]
  notices: Notice[]
  currentAdminId: string
}

const KEY = 'aust-helpdesk-v1'
const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

function makeSeed(): State {
  return {
    currentAdminId: 'a1',
    admins: [
      { id: 'a1', name: 'Super Admin', email: 'studentaffairs@aust.edu.ng', role: 'Super Admin', active: true },
      { id: 'a2', name: 'Operations Desk', email: 'operations@aust.edu.ng', role: 'Complaint Admin', active: true },
      { id: 'a3', name: 'Venue Office', email: 'venues@aust.edu.ng', role: 'Venue Admin', active: true },
    ],
    submissions: [
      {
        id: 'CMP-1001', kind: 'complaint', status: 'pending', createdAt: day(1),
        applicant: { fullName: 'Sample Student', email: 'sample.student@aust.edu.ng', idNumber: 'AUST/2024/001', phone: '08000000000' },
        title: 'Ceiling fan not working', location: 'Kwame Nkrumah Hall, Room 12',
        fields: { 'Date of Complaint': day(1).slice(0, 10), 'Complaint Details': 'The ceiling fan in my room stopped working two days ago.', 'Desired Resolution': 'Repair or replace the fan.' },
        emails: [],
      },
      {
        id: 'VEN-2001', kind: 'venue', status: 'pending', createdAt: day(2),
        applicant: { fullName: 'Sample Club Lead', email: 'club.lead@aust.edu.ng', idNumber: 'AUST/2023/014', phone: '08000000001', applicantType: 'Club' },
        title: 'Tech Club Hackathon', location: 'Main Auditorium',
        fields: { 'Venue Type': 'Hall', 'Event Purpose': 'Student hackathon', 'Event Date': day(-10).slice(0, 10), 'Start Time': '09:00', 'End Time': '17:00', 'Expected Attendance': '120', 'Facilities Needed': 'Projector, PA system', 'External Guests': 'Yes', 'Faculty Adviser': '—' },
        emails: [],
      },
      {
        id: 'FAC-3001', kind: 'facility', status: 'accepted', createdAt: day(4),
        applicant: { fullName: 'Sample Postgrad', email: 'pg.student@aust.edu.ng', idNumber: 'AUST/PG/2024/007', phone: '08000000002' },
        title: 'Request: Air conditioner', location: 'Julius Nyerere Hall, Room 4',
        fields: { 'Item Requested': 'Air conditioner', Quantity: '1', Reason: 'Room gets very hot at night.' },
        adminResponse: 'Approved. Installation scheduled.', emails: [],
      },
    ],
    logs: [{ id: 'l1', admin: 'Super Admin', action: 'Accepted request', recordId: 'FAC-3001', at: day(3) }],
    notices: [
      { id: 'n1', text: 'New complaint CMP-1001 submitted', at: day(1), read: false },
      { id: 'n2', text: 'New venue request VEN-2001 submitted', at: day(2), read: false },
    ],
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* fall through to demo data */
  }
  return makeSeed()
}

export const state = reactive<State>(load())

watch(
  state,
  () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable */
    }
  },
  { deep: true },
)

/** Read part of the state reactively, e.g. `const subs = useStore((s) => s.submissions)`. */
export function useStore<T>(sel: (s: State) => T): ComputedRef<T> {
  return computed(() => sel(state))
}

const uid = () => Math.random().toString(36).slice(2, 9)
const prefix: Record<Kind, string> = { complaint: 'CMP', venue: 'VEN', facility: 'FAC' }

export function currentAdmin(s: State): Admin {
  return (s.admins.find((a) => a.id === s.currentAdminId) ?? s.admins[0])!
}

export function submit(input: Omit<Submission, 'id' | 'status' | 'createdAt' | 'emails'>): string {
  const id = `${prefix[input.kind]}-${Math.floor(1000 + Math.random() * 9000)}`
  const at = new Date().toISOString()
  state.submissions.unshift({ ...input, id, status: 'pending', createdAt: at, emails: [] })
  state.notices.unshift({ id: uid(), text: `New ${input.kind} ${id} from ${input.applicant.fullName}`, at, read: false })
  return id
}

export function decide(id: string, status: Status, response: string, email: Omit<SentEmail, 'sentAt' | 'by'>) {
  const admin = currentAdmin(state).name
  const at = new Date().toISOString()
  const label = status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Scheduled meeting for'
  const sub = state.submissions.find((x) => x.id === id)
  if (sub) {
    sub.status = status
    sub.adminResponse = response
    sub.emails.push({ ...email, sentAt: at, by: admin })
  }
  state.logs.unshift({ id: uid(), admin, action: `${label} & emailed`, recordId: id, at })
  state.notices.unshift({ id: uid(), text: `${id} marked ${status} by ${admin}`, at, read: false })
}

export function markAllRead() {
  state.notices.forEach((n) => {
    n.read = true
  })
}

export function upsertAdmin(a: Omit<Admin, 'id'> & { id?: string }) {
  const by = currentAdmin(state).name
  const existing = a.id ? state.admins.find((x) => x.id === a.id) : undefined
  if (existing) Object.assign(existing, a)
  else state.admins.push({ ...a, id: uid() })
  state.logs.unshift({
    id: uid(),
    admin: by,
    action: existing ? `Updated admin ${a.name}` : `Added admin ${a.name}`,
    recordId: a.email,
    at: new Date().toISOString(),
  })
}

export function setCurrentAdmin(id: string) {
  state.currentAdminId = id
}

export function canHandle(role: Role, kind: Kind) {
  if (role === 'Super Admin') return true
  if (role === 'Complaint Admin') return kind === 'complaint' || kind === 'facility'
  if (role === 'Venue Admin') return kind === 'venue'
  return false
}

export const KIND_LABEL: Record<Kind, string> = {
  complaint: 'Complaint',
  venue: 'Venue request',
  facility: 'Facility request',
}

/** Clear demo data and restore the seed (used by Settings, "Reset demo data"). */
export function resetDemoData() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  location.reload()
}
