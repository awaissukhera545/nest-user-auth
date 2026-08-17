import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    setRefreshTokenHash: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      setRefreshTokenHash: jest.fn(),
    };

    jwtService = {
      sign: jest.fn((payload: any) => `signed.${payload.sub}.${payload.email}`),
      signAsync: jest.fn(async (payload: any) => `signed.${payload.sub}.${payload.email}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_ACCESS_TTL: '15m',
                JWT_REFRESH_TTL: '7d',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash the password and omit it from the returned user', async () => {
    const dto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    usersService.create.mockResolvedValue({
      _id: 'user-1',
      email: dto.email,
      name: dto.name,
      password: '$2b$10$abcdefghijklmnopqrstuv',
      toObject: () => ({
        _id: 'user-1',
        email: dto.email,
        name: dto.name,
        password: '$2b$10$abcdefghijklmnopqrstuv',
      }),
    });

    const result = await service.register(dto);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        name: dto.name,
        password: expect.stringMatching(/^\$2[aby]\$\d{2}\$/),
      }),
    );
    expect(result.user).toEqual({
      _id: 'user-1',
      email: dto.email,
      name: dto.name,
    });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.password).toBeUndefined();
  });

  it('should throw ConflictException when a duplicate email is registered', async () => {
    const dto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    usersService.create.mockRejectedValue({ code: 11000 });

    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });

  it('should reject login when the password does not match', async () => {
    const dto = {
      email: 'john@example.com',
      password: 'wrong-pass',
    };

    const hashedPassword = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({
      email: dto.email,
      password: hashedPassword,
      toObject: () => ({
        email: dto.email,
        password: hashedPassword,
      }),
    });

    await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('should return jwt tokens for a successful login', async () => {
    const dto = {
      email: 'john@example.com',
      password: 'password123',
    };

    const hashedPassword = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({
      _id: 'user-1',
      email: dto.email,
      name: 'John Doe',
      password: hashedPassword,
      toObject: () => ({
        _id: 'user-1',
        email: dto.email,
        name: 'John Doe',
        password: hashedPassword,
      }),
    });

    const result = await service.login(dto);

    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(result.accessToken).toContain('signed.');
    expect(result.refreshToken).toContain('signed.');
    expect(result.user.email).toBe(dto.email);
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      expect.stringMatching(/^\$2[aby]\$\d{2}\$/),
    );
  });
});
