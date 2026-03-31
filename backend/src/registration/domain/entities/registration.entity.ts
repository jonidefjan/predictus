import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RegistrationStatus } from '../enums/registration-status.enum';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  cpf!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  cep!: string | null;

  @Column({ type: 'varchar', nullable: true })
  street!: string | null;

  @Column({ type: 'varchar', nullable: true })
  number!: string | null;

  @Column({ type: 'varchar', nullable: true })
  complement!: string | null;

  @Column({ type: 'varchar', nullable: true })
  neighborhood!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status!: RegistrationStatus;

  @Column({ type: 'int', default: 1 })
  currentStep!: number;

  @Column({ type: 'varchar', nullable: true })
  mfaCode!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mfaExpiresAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  mfaVerifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
