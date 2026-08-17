import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getjwtSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET');
  }

  private async getTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'access-secret',
        expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'refresh-secret',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_TTL') ?? '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const hash = await bcrypt.hash(registerDto.password, 10);

    try {
      const user = await this.usersService.create({
        ...registerDto,
        password: hash,
      });

      const userObject: any = user.toObject();
      const {
        password,
        refreshTokenHash,
        __v,
        createdAt,
        updatedAt,
        ...safeUser
      } = userObject;

      const { accessToken, refreshToken } = await this.getTokens(
        String(safeUser._id),
        safeUser.email,
      );

      await this.usersService.setRefreshTokenHash(
        String(safeUser._id),
        await bcrypt.hash(refreshToken, 10),
      );

      return {
        user: safeUser,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDTO) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const userObject: any = user.toObject();
    const {
      password,
      refreshTokenHash,
      __v,
      createdAt,
      updatedAt,
      ...safeUser
    } = userObject;

    const { accessToken, refreshToken } = await this.getTokens(
      String(safeUser._id),
      safeUser.email,
    );

    await this.usersService.setRefreshTokenHash(
      String(safeUser._id),
      await bcrypt.hash(refreshToken, 10),
    );

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string, rawRefreshToken: string) {
    const user = await this.usersService.findByIdWithRefreshHash(userId);

    if (!user?.refreshTokenHash) {
      throw new ForbiddenException('Access denied');
    }

    const matches = await bcrypt.compare(rawRefreshToken, user.refreshTokenHash);

    if (!matches) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.getTokens(String(user._id), user.email);
    await this.usersService.setRefreshTokenHash(
      String(user._id),
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { success: true };
  }
}
