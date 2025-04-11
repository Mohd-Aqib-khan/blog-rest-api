import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthService } from './google-auth/google-auth.service';
import { FacebookAuthService } from './facebook-auth/facebook-auth.service';

interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
  ) {}

  @Post('google-login')
  async googleAuth(
    @Req() req,
    @Body('credential') credential: string,
    @Res() res,
  ) {
    console.log('req.user', req, credential);
    const userDetails =
      await this.googleAuthService.verifyOAuthToken(credential);
    console.log('userDetails', userDetails);
    const user = await this.authService.validateOAuthLogin({
      providerId: userDetails.sub,
      email: userDetails.email || '',
      name: userDetails.name || '',
      provider: userDetails.provider,
    });
    console.log('user ', user);
    const token = this.authService.login({
      id: user.id,
      email: user.email,
    });

    // redirect to frontend with JWT as query param (or cookie)
    return res.redirect(
      `http://localhost:4200/our-blog?token=${token.access_token}`,
    );
  }

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // googleAuthRedirect(@Req() req: { user: { email: string; id: number } }) {
  //   return this.authService.login(req.user);
  // }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req) {
    const token = this.authService.login(req.user);
    return { status: 400, data: { access_token: token.access_token } };
  }
  @Post('registration')
  async register(
    @Body() registerBody: RegisterRequestDto,
  ): Promise<{ data: { access_token } } | BadRequestException> {
    const token = await this.authService.register(registerBody);
    return { status: 400, data: { access_token: token.access_token } };
  }

  @Post('facebook-login')
  async facebookAuth(@Body('authToken') authToken: string, @Res() res) {
    console.log('accessTERE#', authToken);
    const userDetails =
      await this.facebookAuthService.verifyFacebookToken(authToken);
    console.log('userDetails', userDetails);
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
    return res.send({ data: { access_token: token.access_token } });
  }

  // @Get('facebook/callback')
  // @UseGuards(AuthGuard('facebook'))
  // facebookAuthRedirect(@Req() req) {
  //   return this.authService.login(req.user);
  // }
}
