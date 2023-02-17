import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { bcryptHash } from 'jwt-auth-be/src/common/utils/hash';
import { UserEntity } from 'jwt-auth-be/src/common/entities/user.entity';
import { Repository } from 'typeorm';
import {
  AuthDTO,
  UserLoginDTO,
  ChangePasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';
import {
  CREATE_USER_FAILED,
  LOGIN_FAILED,
  EMAIL_NOT_FOUND,
  PASSWORD_IS_INCORRECT,
} from '../auth/errors';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(authDto: AuthDTO): Promise<AuthResponseDto> {
    try {
      const hashedPassword = await bcryptHash(authDto.password);

      const userData = { ...authDto, password: hashedPassword };

      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);

      const token = await this.signToken(user.id, user.email);

      return token;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        CREATE_USER_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signin(loginDto: UserLoginDTO): Promise<AuthResponseDto> {
    try {
      const { email, password } = loginDto;
      const user = await this.userRepository.findOne({ where: { email } });
      const hashedPassword = await bcryptHash(password);

      if (!user) {
        throw new HttpException(EMAIL_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      if (hashedPassword !== user.password) {
        throw new HttpException(PASSWORD_IS_INCORRECT, HttpStatus.NOT_FOUND);
      }

      const token = await this.signToken(user.id, user.email);

      return token;
    } catch (error) {
      throw new HttpException(LOGIN_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const { oldPassword, newPassword } = changePasswordDto;
      // const user = await this.userRepository.findOne({ where: { email } });
      // const hashedPassword = await argon.hash(password);

      // if (!user) {
      //   throw new HttpException(EMAIL_NOT_FOUND, HttpStatus.NOT_FOUND);
      // }

      // if (hashedPassword !== user.password) {
      //   throw new HttpException(PASSWORD_IS_INCORRECT, HttpStatus.NOT_FOUND);
      // }
    } catch (error) {
      throw new HttpException(LOGIN_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async signToken(
    userId: number,
    userEmail: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email: userEmail,
    };

    const secret = this.configService.get('JWT_SECRET');

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '55m',
      secret,
    });

    return {
      access_token: token,
    };
  }
}
