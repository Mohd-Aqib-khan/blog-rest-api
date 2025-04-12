import { Test, TestingModule } from '@nestjs/testing';
import { FacebookAuthService } from './facebook-auth.service';
import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

// Mock the axios module
jest.mock('axios');

describe('FacebookAuthService', () => {
  let service: FacebookAuthService;
  let axiosGetMock: jest.Mock;

  beforeEach(async () => {
    // Create a mock for axios.get
    axiosGetMock = jest.fn();
    (axios.get as jest.Mock) = axiosGetMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [FacebookAuthService],
    }).compile();

    service = module.get<FacebookAuthService>(FacebookAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should verify a valid Facebook token and return the expected payload', async () => {
    // Mock a successful API response
    const mockResponse = {
      data: {
        id: 'facebook-user-id',
        name: 'Test User',
        email: 'test@example.com',
        picture: {
          data: {
            url: 'http://example.com/picture.jpg',
          },
        },
      },
    };
    axiosGetMock.mockResolvedValue(mockResponse);

    const token = 'valid-facebook-token';
    const result = await service.verifyFacebookToken(token);

    expect(axiosGetMock).toHaveBeenCalledWith(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
    );
    expect(result).toEqual({
      sub: 'facebook-user-id',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'http://example.com/picture.jpg',
      provider: 'facebook',
    });
  });

  it('should throw UnauthorizedException if no data is returned', async () => {
    // Mock an API response with no data
    const mockResponse = {
      data: {}, // Empty response
    };
    axiosGetMock.mockResolvedValue(mockResponse);

    const token = 'valid-facebook-token';
    await expect(service.verifyFacebookToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.verifyFacebookToken(token)).rejects.toThrow(
      'Missing required fields in Facebook response',
    );
  });

  it('should throw UnauthorizedException for an invalid or failed token', async () => {
    // Mock an API error response
    const mockError = {
      isAxiosError: true,
      response: {
        data: { error: { message: 'Invalid token' } },
      },
      message: 'Request failed with status code 401',
    };
    axiosGetMock.mockRejectedValue(mockError);

    const token = 'invalid-facebook-token';
    await expect(service.verifyFacebookToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.verifyFacebookToken(token)).rejects.toThrow(
      'Invalid Facebook access token',
    );
    expect(axiosGetMock).toHaveBeenCalledWith(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
    );
  });
});
