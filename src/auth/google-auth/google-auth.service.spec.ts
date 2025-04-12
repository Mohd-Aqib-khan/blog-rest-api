import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthService } from './google-auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GooglePayload } from './types/google-user.type';
import { LoginTicket } from 'google-auth-library';

// Mock the GooglePayload type for testing
const mockGooglePayload: GooglePayload = {
  name: 'Test User',
  email: 'test@example.com',
  picture: 'http://example.com/picture.jpg',
  provider: 'google',
  sub: 'google-user-id',
};

// Custom type to extend OAuth2Client with Jest mocking
interface MockOAuth2Client extends OAuth2Client {
  verifyIdToken: jest.Mock<
    Promise<LoginTicket>,
    [options: { idToken: string; audience: string }]
  >;
}

// Mock LoginTicket interface
const mockLoginTicket = {
  getPayload: jest.fn(),
  getEnvelope: jest.fn().mockReturnValue({}),
  getUserId: jest.fn().mockReturnValue('user-id'),
  getAttributes: jest.fn().mockReturnValue({}),
};

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let oauth2Client: MockOAuth2Client;

  beforeEach(async () => {
    // Create a mock for OAuth2Client with proper typing
    const mockOAuth2Client: MockOAuth2Client = {
      verifyIdToken: jest.fn(),
    } as unknown as MockOAuth2Client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        {
          provide: OAuth2Client,
          useValue: mockOAuth2Client,
        },
      ],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
    oauth2Client = module.get<OAuth2Client>(OAuth2Client) as MockOAuth2Client;

    // Set environment variable for the client initialization
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GOOGLE_CLIENT_ID; // Clean up environment variable
  });

  it('should verify a valid OAuth token and return GooglePayload', async () => {
    // Mock the verifyIdToken response with a valid payload
    mockLoginTicket.getPayload.mockReturnValue({
      name: mockGooglePayload.name,
      email: mockGooglePayload.email,
      picture: mockGooglePayload.picture,
      sub: mockGooglePayload.sub,
    });
    oauth2Client.verifyIdToken.mockResolvedValueOnce(mockLoginTicket);

    const token = 'valid-token';
    const result = await service.verifyOAuthToken(token);

    expect(oauth2Client.verifyIdToken).toHaveBeenCalledWith({
      idToken: token,
      audience: 'test-client-id',
    });
    expect(result).toEqual(mockGooglePayload);
    expect(mockLoginTicket.getPayload).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for an invalid or expired token', async () => {
    oauth2Client.verifyIdToken.mockRejectedValueOnce(
      new Error('Invalid token'),
    );

    const token = 'invalid-token';
    await expect(service.verifyOAuthToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.verifyOAuthToken(token)).rejects.toThrow(
      'Token verification failed',
    );
  });
});
