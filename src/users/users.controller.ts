import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('public-check')
  publicCheck() {
    return { ok: true };
  }

  @Get('me')
  async getMe(@CurrentUser() user: { userId: string; email: string }) {
    const foundUser = await this.usersService.findById(user.userId);

    if (!foundUser) {
      throw new NotFoundException('User profile not found');
    }

    return {
      _id: foundUser._id,
      email: foundUser.email,
      name: foundUser.name,
    };
  }

  @Get('all-users')
  async getAllUsers() {
    const allUsers = await this.usersService.findAll();

    return allUsers.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
    }));
  }
}


