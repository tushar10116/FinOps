import {z} from 'zod';

export const LoginValidationSchema = z.object({
    email: z.string()
            .email("invalid email format")
            .trim()
            .toLowerCase(),
    password: z.string()
            .min(6, "Password must be at least 6 characters long")
})

export type ILoginInput = z.infer<typeof LoginValidationSchema>;

export const SignupValidationSchema = z.object({
    name: z.string()
            .trim(),
    email: z.string()
            .email("invalid email format")
            .trim()
            .toLowerCase(),
    password: z.string(),
     
    inviteToken: z.string().trim()
})

export type ISignupInput = z.infer<typeof SignupValidationSchema>;