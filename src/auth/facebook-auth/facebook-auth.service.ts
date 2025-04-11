// facebook-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FacebookAuthService {
  async verifyFacebookToken(token: string): Promise<{
    sub: string;
    name: string;
    email: string;
    picture: string;
    provider: string;
  }> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
      );

      const { id, name, email, picture } = response.data;

      return {
        sub: id,
        name,
        email,
        picture: picture?.data?.url,
        provider: 'facebook',
      };
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
  }
}
