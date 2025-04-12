import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

interface FacebookResponse {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}

@Injectable()
export class FacebookAuthService {
  async verifyFacebookToken(token: string): Promise<{
    sub: string;
    name: string;
    email: string;
    picture: string;
    provider: string;
  }> {
    let response: AxiosResponse<FacebookResponse | null>;
    try {
      response = await axios.get<FacebookResponse>(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Facebook token verification failed',
          error.response?.data || error.message,
        );
      } else {
        console.error(
          'Unknown error during Facebook token verification',
          error,
        );
      }
      throw new UnauthorizedException('Invalid Facebook access token');
    }

    const { id, name, email, picture } = response.data as FacebookResponse;

    // Validate required fields after successful API call
    if (!id || !name || !email || !picture?.data?.url) {
      throw new UnauthorizedException(
        'Missing required fields in Facebook response',
      );
    }

    return {
      sub: id,
      name,
      email,
      picture: picture.data.url,
      provider: 'facebook',
    };
  }
}
