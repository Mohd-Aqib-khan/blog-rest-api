import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthService } from './google-auth/google-auth.service';
import { FacebookAuthService } from './facebook-auth/facebook-auth.service';
import { Response } from 'express';
import { AuthToken } from './interfaces/auth.interface';
import { RegisterRequest } from './interfaces/register-request-interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
  ) {}

  @Post('google-login')
  async googleAuth(
    @Body('credential') credential: string,
    @Res() res: Response,
  ) {
    const userDetails =
      await this.googleAuthService.verifyOAuthToken(credential);
    const user = await this.authService.validateOAuthLogin({
      providerId: userDetails.sub,
      email: userDetails.email || '',
      name: userDetails.name || '',
      provider: userDetails.provider,
    });
    const token: AuthToken = this.authService.login({
      id: user.id,
      email: user.email,
    });

    // redirect to frontend with JWT as query param (or cookie)
    return res.redirect(
      `http://localhost:4200/our-blog?token=${token.access_token}`,
    );
  }

  @Post('registration')
  async register(
    @Body() registerBody: RegisterRequest,
  ): Promise<{ access_token } | BadRequestException> {
    const token = await this.authService.register(registerBody);
    return { access_token: token.access_token };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req: { user: { id: number; email: string } }): {
    access_token: string;
  } {
    const token = this.authService.login(req.user);
    return { access_token: token.access_token };
  }

  @Post('facebook-login')
  async facebookAuth(
    @Body('authToken') authToken: string,
    @Res() res: Response,
  ) {
    console.log('dfdff#$', authToken);
    const userDetails =
      await this.facebookAuthService.verifyFacebookToken(authToken);
    const user = await this.authService.validateOAuthLogin({
      providerId: userDetails.sub,
      email: userDetails.email || '',
      name: userDetails.name || '',
      provider: userDetails.provider,
    });
    const token = this.authService.login({
      id: user.id,
      email: user.email,
    });

    // redirect to frontend with JWT as query param (or cookie)
    return res.send({
      data: { access_token: token.access_token },
      status: 200,
    });
  }
}
