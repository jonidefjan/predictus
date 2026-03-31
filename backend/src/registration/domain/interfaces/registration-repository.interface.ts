import { Registration } from '../entities/registration.entity';

export const REGISTRATION_REPOSITORY = 'REGISTRATION_REPOSITORY';

export interface IRegistrationRepository {
  create(data: Partial<Registration>): Promise<Registration>;
  findById(id: string): Promise<Registration | null>;
  findByEmail(email: string): Promise<Registration | null>;
  update(id: string, data: Partial<Registration>): Promise<Registration>;
  save(registration: Registration): Promise<Registration>;
}
