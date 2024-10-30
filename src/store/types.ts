import { JwtPayload } from "jwt-decode"

export interface StringValueName {
  value: string,
  name: string
}

export interface IntValueName {
  value: number
  name: string
}

export interface ExtendedJWTPayload extends JwtPayload {
  username: string
  department: string
  company_code: [number]
}

export interface Column {
  field: string,
  header: string,
}