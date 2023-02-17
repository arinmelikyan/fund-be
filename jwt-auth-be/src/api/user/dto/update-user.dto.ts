import { PartialType } from '@nestjs/mapped-types';
import { AuthDTO } from '../../auth/dto/auth.dto';

export class UpdateUserDto extends PartialType(AuthDTO) {}
