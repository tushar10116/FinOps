import z from "zod";

export const registerOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().refine((data: any)=>data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  }),
  domain: z.string().min(1, "Domain is required").min(3, "Domain must be at least 3 characters long"),
  organizationName: z.string().min(1, "Organization name is required").min(3, "Organization name must be at least 3 characters long")
});