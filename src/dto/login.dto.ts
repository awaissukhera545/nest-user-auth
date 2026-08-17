import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDTO {
    @IsEmail({},{message: 'Please enter a Valid Email Address' })
    email!: string;

    @IsString()
    @MinLength(8, {message: 'Password must be minimum 8 characters long' })
    password!: string;
}