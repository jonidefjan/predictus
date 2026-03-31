import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { Registration } from '../../domain/entities/registration.entity';
import { IRegistrationRepository } from '../../domain/interfaces/registration-repository.interface';
import { RegistrationStatus } from '../../domain/enums/registration-status.enum';

@Injectable()
export class TypeOrmRegistrationRepository implements IRegistrationRepository {
  constructor(
    @InjectRepository(Registration)
    private readonly repo: Repository<Registration>,
  ) {}

  async create(data: Partial<Registration>): Promise<Registration> {
    const registration = this.repo.create(data);
    return this.repo.save(registration);
  }

  async findById(id: string): Promise<Registration | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Registration | null> {
    return this.repo.findOne({ where: { email } });
  }

  async update(id: string, data: Partial<Registration>): Promise<Registration> {
    await this.repo.update(id, data);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Registration with id ${id} not found after update`);
    }
    return updated;
  }

  async save(registration: Registration): Promise<Registration> {
    return this.repo.save(registration);
  }

  async findAbandoned(olderThan: Date, limit: number = 50): Promise<Registration[]> {
    return this.repo.find({
      where: {
        status: In([RegistrationStatus.PENDING, RegistrationStatus.MFA_SENT]),
        updatedAt: LessThan(olderThan),
        abandonmentEmailSentAt: IsNull(),
      },
      take: limit,
      order: { updatedAt: 'ASC' },
    });
  }
}
