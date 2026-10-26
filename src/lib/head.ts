export type HeadMeta = {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  robots?: string
}

export const defaultHead: Required<Omit<HeadMeta, 'robots'>> = {
  title: 'AUST Student Helpdesk',
  description: 'Complaints, requests and venue booking for AUST students.',
  ogTitle: 'AUST Student Helpdesk',
  ogDescription: 'Complaints, requests and venue booking for AUST students.',
}

function setMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === undefined) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applyHead(head?: HeadMeta) {
  const m = { ...defaultHead, ...head }
  document.title = m.title
  setMeta('name', 'description', m.description)
  setMeta('property', 'og:title', m.ogTitle)
  setMeta('property', 'og:description', m.ogDescription)
  setMeta('name', 'robots', head?.robots)
}
