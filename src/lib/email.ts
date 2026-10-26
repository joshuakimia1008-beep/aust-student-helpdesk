import { KIND_LABEL, type Submission } from './store'

export type AcceptAnswers = { action: string; resolutionDate: string; approvedDateTime: string; message: string }
export type DeclineAnswers = { reason: string; nextSteps: string; canAppeal: 'Yes' | 'No' }
export type MeetingAnswers = { office: string; date: string; time: string; location: string; documents: string; instructions: string }

const header = (s: Submission) =>
  `Dear ${s.applicant.fullName},\n\nApplicant ID: ${s.applicant.idNumber}\nReference: ${s.id}\nSubject: ${KIND_LABEL[s.kind]} — ${s.title}\n\n`
const sign = '\n\nKind regards,\nAUST Administration\nAfrican University of Science and Technology, Abuja'

export function acceptEmail(s: Submission, a: AcceptAnswers) {
  const lines = [header(s) + `We are pleased to inform you that your ${KIND_LABEL[s.kind].toLowerCase()} has been ACCEPTED.`]
  if (a.action) lines.push(`Action to be taken: ${a.action}`)
  if (s.kind === 'venue' && a.approvedDateTime) lines.push(`Approved date and time: ${a.approvedDateTime}`)
  if (s.kind !== 'venue' && a.resolutionDate) lines.push(`Expected resolution date: ${a.resolutionDate}`)
  if (a.message) lines.push(a.message)
  return { subject: `[${s.id}] Your ${KIND_LABEL[s.kind].toLowerCase()} has been accepted`, body: lines.join('\n\n') + sign }
}

export function declineEmail(s: Submission, d: DeclineAnswers) {
  const lines = [header(s) + `After careful review, we regret to inform you that your ${KIND_LABEL[s.kind].toLowerCase()} has been DECLINED.`]
  if (d.reason) lines.push(`Reason: ${d.reason}`)
  if (d.nextSteps) lines.push(`Next steps: ${d.nextSteps}`)
  lines.push(d.canAppeal === 'Yes' ? 'You may appeal this decision or resubmit your request.' : 'This decision is final and cannot be appealed.')
  return { subject: `[${s.id}] Update on your ${KIND_LABEL[s.kind].toLowerCase()}`, body: lines.join('\n\n') + sign }
}

export function meetingEmail(s: Submission, m: MeetingAnswers) {
  const body = `Dear ${s.applicant.fullName},

Regarding your hall/venue request (${s.id}), a meeting has been scheduled with the ${m.office} team to discuss your proposed event and requirements in more detail.

Meeting Details
- Date: ${m.date}
- Time: ${m.time}
- Location: ${m.location}
- Supporting Documents: ${m.documents || 'None'}
${m.instructions ? `\n${m.instructions}\n` : ''}
Please attend the meeting with the relevant documents so we can review your request and discuss the next steps.

Regards,
AUST Administration`
  return { subject: `[${s.id}] Meeting scheduled for your venue request`, body }
}
