import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GooglePayload } from './types/google-user.type';

@Injectable()
export class GoogleAuthService {
  constructor(private client: OAuth2Client) {}

  async verifyOAuthToken(token: string): Promise<GooglePayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (payload) {
        return {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          provider: 'google',
          sub: payload.sub,
        };
      }
      throw new UnauthorizedException('No payload returned from Google');
    } catch (error) {
      console.error('Invalid or expired token', error);
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
