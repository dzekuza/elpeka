const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024  // 5 MB
const MAX_DOC_BYTES = 20 * 1024 * 1024   // 20 MB

export function validateImageUpload(file: File): void {
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Failas per didelis (max 5 MB)')
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Leidžiami tik JPEG, PNG, WebP, GIF formatai')
}

export function validateDocumentUpload(file: File): void {
  if (file.size > MAX_DOC_BYTES) throw new Error('Failas per didelis (max 20 MB)')
  if (!ALLOWED_DOC_TYPES.includes(file.type)) throw new Error('Leidžiami tik PDF, Word, Excel ir paveikslėlių formatai')
}

// Validates a storage path for the preview route.
// Allowed prefixes: photos/, documents/, defects/, contacts/, estates/
const ALLOWED_PREFIXES = ['photos/', 'documents/', 'defects/', 'contacts/', 'estates/']
const PATH_TRAVERSAL_RE = /\.\./

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
}

export function sanitizeFileName(name: string): string {
  const ext = name.match(/(\.[^.]+)$/)?.[1]?.toLowerCase() ?? ''
  const base = name.slice(0, name.length - ext.length)
  const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150)
  return safeBase + ext
}

export function validateFileExtension(file: File): void {
  const name = file.name.toLowerCase()
  const allowed = ALLOWED_EXTENSIONS[file.type]
  if (!allowed) throw new Error('Neleistinas failo tipas')
  if (!allowed.some((ext) => name.endsWith(ext))) {
    throw new Error('Failo plėtinys neatitinka failo tipo')
  }
}

export function validateStoragePath(path: string): void {
  if (PATH_TRAVERSAL_RE.test(path)) throw new Error('Invalid path')
  if (!ALLOWED_PREFIXES.some((p) => path.startsWith(p))) throw new Error('Invalid path')
}
