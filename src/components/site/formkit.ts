export const inputCls = 'field-control'

export async function readEvidence(files: FileList | null): Promise<string[]> {
  if (!files) return []
  const out: string[] = []
  for (const f of Array.from(files).slice(0, 4)) {
    if (f.type.startsWith('image/') && f.size < 1_500_000) {
      out.push(
        await new Promise<string>((resolve) => {
          const fr = new FileReader()
          fr.onload = () => resolve(String(fr.result))
          fr.readAsDataURL(f)
        }),
      )
    } else out.push(`file:${f.name}`)
  }
  return out
}

export const today = () => new Date().toISOString().slice(0, 10)
