export type UserRole = 'admin' | 'owner'

export interface Estate {
  id: string
  name: string
  address: string
  description: string | null
  cover_photo_path: string | null
  created_at: string
}

export interface Unit {
  id: string
  estate_id: string
  unit_number: string
  floor: number | null
  area_sqm: number | null
  parking?: string | null
  technical_data: TechnicalData | null
  financial_data: FinancialData | null
  created_at: string
}

export interface TechnicalData {
  rooms_count?: number
  total_area?: number
  living_area?: number
  construction_year?: number
}

export interface FinancialData {
  sale_price?: number
  payment_type?: string
  payment_schedule_notes?: string
  notary_info?: string
}

export interface UnitOwner {
  id: string
  unit_id: string
  user_id: string
  invited_at: string
  accepted_at: string | null
  visible_steps?: string[] | null
  notifications_enabled?: boolean
}

export interface Defect {
  id: string
  unit_id: string
  submitted_by: string
  title: string
  description: string
  status: DefectStatus
  created_at: string
}

export type DefectStatus = 'pateikta' | 'sprendziama' | 'atlikta'

export interface DefectAttachment {
  id: string
  defect_id: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface DefectReply {
  id: string
  defect_id: string
  author_id: string
  body: string
  created_at: string
}

export interface DefectReplyAttachment {
  id: string
  reply_id: string
  storage_path: string
  created_at: string
}

export interface Document {
  id: string
  unit_id: string
  category: string
  photo_category?: 'progress' | 'final' | null
  name: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface DefectWithDetails extends Defect {
  attachments: DefectAttachment[]
  replies: (DefectReply & { attachments: DefectReplyAttachment[] })[]
}

export interface UnitWithOwner extends Unit {
  owner: { email: string; full_name?: string } | null
}

export interface EstateWithUnitCount extends Estate {
  unit_count: number
  cover_image_url: string | null
}

export type ContactCategory =
  | 'windows'
  | 'heating'
  | 'water'
  | 'electrical'
  | 'waste'
  | 'internet'
  | 'general'
  | 'construction'

export interface Contact {
  id: string
  category: ContactCategory
  title: string
  company_name: string | null
  phone: string | null
  email: string | null
  description: string | null
  footnote: string | null
  created_at: string
}

export interface ContactDocument {
  id: string
  contact_id: string
  name: string
  storage_path: string
  created_at: string
}

export interface ContactWithDocuments extends Contact {
  documents: ContactDocument[]
}

export type ServiceCategory = 'electrical' | 'water' | 'heating' | 'waste'

export interface UnitService {
  id: string
  unit_id: string
  category: ServiceCategory
  meter_number: string | null
  description: string | null
  completed_at: string | null
  created_at: string
}
