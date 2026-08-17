import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should register a user', async () => {
    const dto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };
    const result = {
      _id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    authService.register.mockResolvedValue(result);

    await expect(controller.register(dto)).resolves.toEqual(result);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('should login a user', async () => {
    const dto = {
      email: 'john@example.com',
      password: 'password123',
    };
    const result = {
      user: {
        _id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
      },
    };

    authService.login.mockResolvedValue(result);

    await expect(controller.login(dto)).resolves.toEqual(result);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });
});
