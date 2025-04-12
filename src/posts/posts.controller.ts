import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Req,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() postDetails: { title: string; content: string; category: string },
    @Req() req: { user: { id: number } },
  ) {
    console.log('req#$#', req.user);
    const createPostDto = { ...postDetails, userId: req.user.id };
    const newPostData = await this.postsService.create(createPostDto);
    return newPostData;
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: { user: { id: number } }) {
    const data = await this.postsService.findAll({ userId: req.user.id });
    return data;
  }

  @Get('trending')
  async findTrendingPosts(@Query('isTrending') isTrending: boolean) {
    console.log('dfdfdf', isTrending);
    const data = await this.postsService.findAll({ isTrending });
    return data;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const postDetails = await this.postsService.findOne(+id);
    return postDetails;
  }
}
