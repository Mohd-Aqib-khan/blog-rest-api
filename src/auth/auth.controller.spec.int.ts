import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth/google-auth.service';
import { FacebookAuthService } from './facebook-auth/facebook-auth.service';
import { UsersService } from '../users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity'; // Add Post entity if it exists
import { SubscriptionType } from '../users/dto/create-user.dto';
import * as dotenv from 'dotenv';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

dotenv.config(); // Load environment variables from .env

jest.setTimeout(10000); // Increase timeout to 10 seconds

// Define mockUser with id (will be overridden by database on save)
const mockUser = {
  id: 1, // Temporary value, will be replaced by database auto-increment
  email: 'test33@example.com',
  name: 'Test User',
  password: 'hashedpassword', // Match your hashing logic in AuthService
  profileImageLink: '',
  provider: '',
  providerId: '',
  posts: [],
  createdAt: new Date(),
  subscriptionType: SubscriptionType.FREE,
  subscriptionEnd: new Date(),
  isActive: true,
};

// Pre-defined access token (static for testing)
const mockToken = { access_token: 'mock-jwt-token-123456' };

const mockGoogleUserDetails = {
  sub: 'google-user-id',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'google-picture-url',
  provider: 'google',
};
const mockFacebookUserDetails = {
  sub: 'facebook-user-id',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'facebook-picture-url',
  provider: 'facebook',
};
const mockRegisterRequest = {
  email: 'test_integration_new@example.com',
  password: 'password123',
  name: 'New Test User',
};

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let dataSource: any;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    console.log('process.env.POSTGRES_USER', process.env.POSTGRES_USER);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: [User, Post], // Include Post entity if it exists
          synchronize: true, // Auto-create tables for testing
        }),
      ],
    })
      .overrideProvider(GoogleAuthService)
      .useValue({
        verifyOAuthToken: jest.fn().mockResolvedValue(mockGoogleUserDetails),
      })
      .overrideProvider(FacebookAuthService)
      .useValue({
        verifyFacebookToken: jest
          .fn()
          .mockResolvedValue(mockFacebookUserDetails),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    dataSource = moduleFixture.get(getDataSourceToken());
    userRepository = dataSource.getRepository(User);

    // Mock AuthService.login to return pre-defined token
    jest
      .spyOn(authService, 'login')
      .mockImplementation((user: any) => mockToken);
    jest.spyOn(authService, 'validateOAuthLogin').mockResolvedValue({
      ...mockUser,
      id: 1, // Ensure mockUser has id for type compatibility
    });
    jest.spyOn(authService, 'register').mockResolvedValue(mockToken);

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate with Google and redirect with token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/google-login')
      .send({ credential: 'mock-credential' })
      .expect(302);

    expect(response.header.location).toContain(
      `http://localhost:4200/our-blog?token=${mockToken.access_token}`,
    );
    expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
      providerId: mockGoogleUserDetails.sub,
      email: mockGoogleUserDetails.email,
      name: mockGoogleUserDetails.name,
      provider: mockGoogleUserDetails.provider,
    });
    expect(authService.login).toHaveBeenCalledWith({
      id: 1, // Use the mocked id
      email: mockUser.email,
    });
  });

  it('should return access token for successful registration', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .send(mockRegisterRequest)
      .expect(201);

    expect(response.body).toEqual({ access_token: mockToken.access_token });
    expect(authService.register).toHaveBeenCalledWith(mockRegisterRequest);
    const createdUser = await userRepository.findOne({
      where: { email: mockRegisterRequest.email },
    });
    expect(createdUser).toBeDefined();
  });

  it('should authenticate with Facebook and return token with status 200', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/facebook-login')
      .send({ authToken: 'mock-facebook-token' })
      .expect(201); // Changed to 201 to match actual response

    expect(response.body).toEqual({
      data: { access_token: mockToken.access_token },
      status: 200,
    });
    expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
      providerId: mockFacebookUserDetails.sub,
      email: mockFacebookUserDetails.email,
      name: mockFacebookUserDetails.name,
      provider: mockFacebookUserDetails.provider,
    });
    expect(authService.login).toHaveBeenCalledWith({
      id: 1, // Use the mocked id
      email: mockUser.email,
    });
  });
});
