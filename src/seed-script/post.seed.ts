import { DataSource } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

// You can configure your data source here or import from a shared config
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Post, User],
  synchronize: false,
  logging: false,
});

const seedPosts = async () => {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const postRepo = AppDataSource.getRepository(Post);

  let users = await userRepo.find();

  // If no users, seed 2 dummy users with hashed passwords
  if (users.length === 0) {
    const password = await bcrypt.hash('password123', 10);

    const dummyUsers = [
      userRepo.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: password,
      }),
      userRepo.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: password,
      }),
    ];

    await userRepo.save(dummyUsers);
    console.log('✅ Seeded 2 dummy users.');

    users = await userRepo.find(); // Re-fetch for post assignment
  }

  const posts: Post[] = [];

  for (let i = 0; i < 1000; i++) {
    const user = faker.helpers.arrayElement(users);

    const post = postRepo.create({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      category: faker.helpers.arrayElement([
        'Tech',
        'Travel',
        'Food',
        'Health',
      ]),
      image: `https://picsum.photos/seed/${faker.string.uuid()}/600/400`,
      userId: user.id,
      isActive: true,
      isTrending: i <= 10,
    });

    posts.push(post);
  }

  await postRepo.save(posts);

  console.log(`✅ Seeded ${posts.length} posts.`);
  await AppDataSource.destroy();
};

seedPosts().catch((error) => {
  console.error('❌ Failed to seed posts:', error);
});
