import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { SubscriptionType } from '../dto/create-user.dto';


@Entity('users') // Optional: specify table name
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  profileImageLink: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  providerId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.FREE,
  })
  subscriptionType: SubscriptionType;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @Column({ default: true })
  isActive: boolean;
}
