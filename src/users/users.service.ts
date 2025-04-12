import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    return await this.userRepository.save(createUserDto);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    return await this.userRepository.findOneBy({ id });
  }

  async findOrCreate(userDetails: {
    email: string;
    providerId: string;
    name: string;
    provider: string;
  }): Promise<User> {
    const user = await this.userRepository.findOneBy({
      email: userDetails.email,
    });
    console.log('user@#@#', user);
    if (user) {
      return user;
    }
    return await this.userRepository.save(userDetails);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.userRepository.update(id, updateUserDto);
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOneBy({
      email,
      isActive: true,
    });
  }

  async remove(id: number) {
    return await this.userRepository.delete(id);
  }
}
