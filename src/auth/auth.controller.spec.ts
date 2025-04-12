import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth/google-auth.service';
import { FacebookAuthService } from './facebook-auth/facebook-auth.service';
import { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { AuthToken } from './interfaces/auth.interface';
import { SubscriptionType } from '../users/dto/create-user.dto';
import { GooglePayload } from './google-auth/types/google-user.type';
import { AuthGuard } from '@nestjs/passport';

// Define RegisterRequest interface (adjust based on your actual interface)
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

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

// Mock the AuthToken
const mockToken: AuthToken = { access_token: 'mock-jwt-token' };

// Mock the Google user details
const mockGoogleUserDetails = {
  sub: 'google-user-id',
  email: 'test@example.com',
  name: 'Test User',
  provider: 'google',
};

// Mock the Facebook user details
const mockFacebookUserDetails = {
  sub: 'facebook-user-id',
  email: 'test@example.com',
  name: 'Test User',
  provider: 'facebook',
};

// Mock Request object with authenticated user
const mockRequest = {
  user: { id: mockUser.id, email: mockUser.email },
};

// Mock RegisterRequest
const mockRegisterRequest: RegisterRequest = {
  email: 'new@example.com',
  password: 'password123',
  name: 'New User',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let googleAuthService: jest.Mocked<GoogleAuthService>;
  let facebookAuthService: jest.Mocked<FacebookAuthService>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    // Mock dependencies
    authService = {
      validateOAuthLogin: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    googleAuthService = {
      verifyOAuthToken: jest.fn(),
    } as unknown as jest.Mocked<GoogleAuthService>;

    facebookAuthService = {
      verifyFacebookToken: jest.fn(),
    } as unknown as jest.Mocked<FacebookAuthService>;

    // Mock Response object
    mockResponse = {
      redirect: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: GoogleAuthService, useValue: googleAuthService },
        { provide: FacebookAuthService, useValue: facebookAuthService },
      ],
    })
      .overrideGuard(AuthGuard('local'))
      .useValue({ canActivate: jest.fn(() => true) }) // Mock AuthGuard to always allow
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Existing tests for googleAuth
  it('should authenticate with Google and redirect with token', async () => {
    const credential = 'mock-credential';
    googleAuthService.verifyOAuthToken.mockResolvedValue(
      mockGoogleUserDetails as unknown as GooglePayload,
    );
    authService.validateOAuthLogin.mockResolvedValue(mockUser);
    authService.login.mockReturnValue(mockToken);

    await controller.googleAuth(credential, mockResponse);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(googleAuthService.verifyOAuthToken).toHaveBeenCalledWith(credential);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
      providerId: mockGoogleUserDetails.sub,
      email: mockGoogleUserDetails.email,
      name: mockGoogleUserDetails.name,
      provider: 'google',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.login).toHaveBeenCalledWith({
      id: mockUser.id,
      email: mockUser.email,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockResponse.redirect).toHaveBeenCalledWith(
      `http://localhost:4200/our-blog?token=${mockToken.access_token}`,
    );
  });

  it('should handle error if verifyOAuthToken fails', async () => {
    const credential = 'mock-credential';
    const error = new Error('Invalid token');
    googleAuthService.verifyOAuthToken.mockRejectedValue(error);

    await expect(
      controller.googleAuth(credential, mockResponse),
    ).rejects.toThrow(error);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(googleAuthService.verifyOAuthToken).toHaveBeenCalledWith(credential);
    expect(authService.validateOAuthLogin).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
    expect(mockResponse.redirect).not.toHaveBeenCalled();
  });

  // Existing test for login
  it('should return access token for authenticated user', () => {
    authService.login.mockReturnValue(mockToken);

    const result = controller.login(mockRequest);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.login).toHaveBeenCalledWith(mockRequest.user);
    expect(result).toEqual({ access_token: mockToken.access_token });
  });

  // Existing tests for register
  it('should return access token for successful registration', async () => {
    authService.register.mockResolvedValue(mockToken);

    const result = await controller.register(mockRegisterRequest);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.register).toHaveBeenCalledWith(mockRegisterRequest);
    expect(result).toEqual({ access_token: mockToken.access_token });
  });

  it('should throw BadRequestException for registration failure', async () => {
    const error = new BadRequestException('email already exists');
    authService.register.mockRejectedValue(error);

    await expect(controller.register(mockRegisterRequest)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.register(mockRegisterRequest)).rejects.toThrow(
      'email already exists',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.register).toHaveBeenCalledWith(mockRegisterRequest);
  });

  // New tests for facebookAuth
  it('should authenticate with Facebook and return token with status 200', async () => {
    const authToken = 'mock-facebook-token';
    facebookAuthService.verifyFacebookToken.mockResolvedValue(
      mockFacebookUserDetails as unknown as {
        sub: string;
        name: string;
        email: string;
        picture: string;
        provider: string;
      },
    );
    authService.validateOAuthLogin.mockResolvedValue(mockUser);
    authService.login.mockReturnValue(mockToken);

    await controller.facebookAuth(authToken, mockResponse);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(facebookAuthService.verifyFacebookToken).toHaveBeenCalledWith(
      authToken,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
      providerId: mockFacebookUserDetails.sub,
      email: mockFacebookUserDetails.email,
      name: mockFacebookUserDetails.name,
      provider: mockFacebookUserDetails.provider,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.login).toHaveBeenCalledWith({
      id: mockUser.id,
      email: mockUser.email,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockResponse.send).toHaveBeenCalledWith({
      data: { access_token: mockToken.access_token },
      status: 200,
    });
  });

  it('should handle error if verifyFacebookToken fails', async () => {
    const authToken = 'mock-facebook-token';
    const error = new Error('Invalid token');
    facebookAuthService.verifyFacebookToken.mockRejectedValue(error);

    await expect(
      controller.facebookAuth(authToken, mockResponse),
    ).rejects.toThrow(error);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(facebookAuthService.verifyFacebookToken).toHaveBeenCalledWith(
      authToken,
    );
    expect(authService.validateOAuthLogin).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });
});
