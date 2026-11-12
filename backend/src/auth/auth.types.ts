import { Role } from '../database/enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  staffId?: string;
}
