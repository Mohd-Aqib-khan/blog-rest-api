import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AuthToken } from './interfaces/auth.interface'; // Ensure this import matches your project structure
import { SubscriptionType } from '../users/dto/create-user.dto';

// Mock the User entity
const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  profileImageLink: '',
  provider: '',
  providerId: '',
  posts: [],
  createdAt: new Date(),
  subscriptionType: SubscriptionType.FREE,
  subscriptionEnd: new Date(),
  isActive: true,
};

// Mock the bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedpassword'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let bcryptCompareSpy: jest.SpyInstance;
  let bcryptHashSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock dependencies
    usersService = {
      findOneByEmail: jest.fn(),
      findOrCreate: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    // Create spies on the mock methods
    bcryptCompareSpy = jest.spyOn(jest.requireMock('bcrypt'), 'compare');
    bcryptHashSpy = jest.spyOn(jest.requireMock('bcrypt'), 'hash');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Existing OAuth login tests
  it('should validate OAuth login and return a user', async () => {
    const profile = {
      providerId: 'google-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google',
    };
    usersService.findOrCreate.mockResolvedValue(mockUser);

    const result = await service.validateOAuthLogin(profile);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOrCreate).toHaveBeenCalledWith(profile);
    expect(result).toEqual(mockUser);
  });

  it('should handle error if findOrCreate fails', async () => {
    const profile = {
      providerId: 'google-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google',
    };
    const error = new Error('Database error');
    usersService.findOrCreate.mockRejectedValue(error);

    await expect(service.validateOAuthLogin(profile)).rejects.toThrow(error);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOrCreate).toHaveBeenCalledWith(profile);
  });

  // Existing validateNormalLogin tests
  it('should validate normal login and return a user', async () => {
    usersService.findOneByEmail.mockResolvedValue(mockUser);
    bcryptCompareSpy.mockResolvedValue(true);

    const result = await service.validateNormalLogin(
      'test@example.com',
      'password123',
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOneByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bcryptCompareSpy).toHaveBeenCalledWith(
      'password123',
      mockUser.password,
    );
    expect(result).toEqual(mockUser);
  });

  it('should throw BadRequestException for invalid login (user not found)', async () => {
    usersService.findOneByEmail.mockResolvedValue(null);

    await expect(
      service.validateNormalLogin('nonexistent@example.com', 'password123'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.validateNormalLogin('nonexistent@example.com', 'password123'),
    ).rejects.toThrow('User not found');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOneByEmail).toHaveBeenCalledWith(
      'nonexistent@example.com',
    );
  });

  it('should throw BadRequestException for invalid login (password mismatch)', async () => {
    usersService.findOneByEmail.mockResolvedValue(mockUser);
    bcryptCompareSpy.mockResolvedValue(false);

    await expect(
      service.validateNormalLogin('test@example.com', 'wrongpassword'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.validateNormalLogin('test@example.com', 'wrongpassword'),
    ).rejects.toThrow('Password does not match');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOneByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bcryptCompareSpy).toHaveBeenCalledWith(
      'wrongpassword',
      mockUser.password,
    );
  });

  // Existing login test
  it('should generate and return an AuthToken for a valid user', () => {
    const user = { id: 1, email: 'test@example.com' };
    const mockToken = 'mock-jwt-token';
    jwtService.sign.mockReturnValue(mockToken);

    const result: AuthToken = service.login(user);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jwtService.sign).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
    });
    expect(result).toEqual({ access_token: mockToken });
  });

  // Updated register tests
  it('should register a new user and return an AuthToken', async () => {
    const userData = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    };
    usersService.findOneByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 2,
      email: userData.email,
      name: userData.name,
      password: 'hashedpassword',
      profileImageLink: '',
      provider: '',
      providerId: '',
      posts: [],
      createdAt: new Date(),
      subscriptionType: SubscriptionType.FREE,
      subscriptionEnd: new Date(),
      isActive: true,
    } as unknown as User);
    jwtService.sign.mockReturnValue('new-jwt-token');
    bcryptHashSpy.mockResolvedValue('hashedpassword');

    const result: AuthToken = await service.register(userData);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOneByEmail).toHaveBeenCalledWith(userData.email);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bcryptHashSpy).toHaveBeenCalledWith(userData.password, 10);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.create).toHaveBeenCalledWith({
      email: userData.email,
      name: userData.name,
      password: 'hashedpassword',
    } as unknown as User);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jwtService.sign).toHaveBeenCalledWith({
      id: 2,
      email: userData.email,
    });
    expect(result).toEqual({ access_token: 'new-jwt-token' });
  });

  it('should throw BadRequestException for registration with existing email', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'New User',
    };
    usersService.findOneByEmail.mockResolvedValue(mockUser);

    await expect(service.register(userData)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.register(userData)).rejects.toThrow(
      'email already exists',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersService.findOneByEmail).toHaveBeenCalledWith(userData.email);
  });
});
