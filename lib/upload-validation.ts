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

export function validateStoragePath(path: string): void {
  if (PATH_TRAVERSAL_RE.test(path)) throw new Error('Invalid path')
  if (!ALLOWED_PREFIXES.some((p) => path.startsWith(p))) throw new Error('Invalid path')
}
