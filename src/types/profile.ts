export interface Profile {
  id: string
  email: string
  nombre?: string
  apellido?: string
  grado?: string
  nombre_colegio?: string
  ciudad?: string
  pais?: string
  edad?: number
  sexo?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
  nombre: string
  apellido: string
  grado: string
  nombre_colegio: string
  ciudad: string
  pais: string
  edad: number | ''
  sexo: string
}
