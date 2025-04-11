import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
  ) {}
  async create(createPostDto: CreatePostDto) {
    return await this.postRepository.save(createPostDto);
  }
  async findAll(filter: {
    userId?: number | undefined;
    isTrending?: boolean | undefined;
  }) {
    console.log('dffdf', filter);
    return await this.postRepository.find({
      where: { ...filter, isActive: true },
      relations: ['user'],
    });
  }
  async findOne(id: number) {
    return await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }
  async update(id: number, updatePostDto: UpdatePostDto) {
    return await this.postRepository.update(id, updatePostDto);
  }
  async remove(id: number) {
    return await this.postRepository.delete(id);
  }
}
