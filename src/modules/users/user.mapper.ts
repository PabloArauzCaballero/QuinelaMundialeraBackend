import { UserModel } from './models/user.model';

export interface SafeUserResponse {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function mapUser(user: UserModel): SafeUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    roles: user.roles?.map((role) => role.name) ?? [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
