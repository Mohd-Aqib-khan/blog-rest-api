import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './local.strategy';
import { GoogleAuthService } from './google-auth/google-auth.service';
import { FacebookAuthService } from './facebook-auth/facebook-auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') }, // or any expiration you want
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleAuthService,
    FacebookAuthService,
    JwtStrategy,
    {
      provide: OAuth2Client,
      useValue: new OAuth2Client(process.env.GOOGLE_CLIENT_ID), // Pass clientId here
    },
  ],
  exports: [JwtModule, JwtStrategy],
})
export class AuthModule {}
