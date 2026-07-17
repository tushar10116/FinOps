import User from "../mongoose/models/User.js";
import { ILoginInput, ISignupInput } from "../validations/authValidator.js";
import { Request, Response } from "express";
import { AuthSession, AuthUser } from "@shared/types.js";
import jwt from "jsonwebtoken";
import InviteUser from "../mongoose/models/InviteUser.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { ResetToken } from "../mongoose/models/ResetToken.js";

export const authController = {
    login: async (req:Request<{}, {}, ILoginInput>, res:Response) => {
        try {  
            const {email, password}  = req.body;
            const user = await User.findOne({email});
            if(!user){
                
                return res.status(400).json({message:"Invalid email or password"});
            }
            const isMatch = await user.comparePassword(password);
            if(!isMatch){
                return res.status(400).json({message:"Invalid email or password"});

            }
            const authUser: AuthUser = {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                organizationId:user.organizationId.toString(),
                role:user.role
            }
            const token =await user.generateAuthToken();
            const authSession: AuthSession = {
                token,
                user: authUser
            }
           return res.status(200).json(authSession);
           

        } catch (error:any) {
           return res.status(500).json({error:error.message});
        }
    },
    register: async (req:Request<{}, {}, ISignupInput>, res:Response) => {
        try {
            const {email,name,password,inviteToken} = req.body;
            const invitedUser = await InviteUser.findOne({token:inviteToken,email:email});
           
            if(!invitedUser){
                return res.status(400).json({message:"Invalid invite token or email"});
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({name,email,password:hashedPassword,organizationId:invitedUser.organizationId, role: invitedUser.role });
            await user.save();
            await InviteUser.findByIdAndDelete(invitedUser._id);
           return res.json({message:"Signup successful"});
        } catch (error) {
            return res.status(500).json({message:"Internal server error"});
        }
    },


    getMe: async (req:Request, res:Response) => {
        try {
           
            const user = req.user;
            if(!user){
                return res.status(401).json({message:"Unauthorized"});
            }
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({message:"Internal server error"});
        }
    },



    getPasswordResetToken: async (req:Request, res:Response) => {
        try {
            const {email} = req.body;
            const user = await User.findOne({email});
            if(!user){
                return res.status(400).json({message:"User not found"});
            }
            await ResetToken.deleteMany({email});
            const token =Math.random().toString(36).slice(2);
            const resetToken = new ResetToken({email,token});
            await resetToken.save();
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.EMAIL,
                  pass: process.env.PASSWORD
                }
            })
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Password Reset',
                text: `Your password reset token is ${token}`
              }
            await transporter.sendMail(mailOptions);
            return res.status(200).json({message:"Email sent successfully"});
        } catch (error) {
            return res.status(500).json({message:error?error.message:"Internal server error"});
        }
    },

    resetPassword: async (req:Request, res:Response) => {
        try {
            const {email,token,password} = req.body;
            const isValid = await ResetToken.findOne({email,token});
            if(!isValid){
                return res.status(400).json({message:"Invalid token"});
            }
            const user = await User.findOne({email});
            if(!user){
                return res.status(400).json({message:"User not found"});
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();
            return res.status(200).json({message:"Password reset successful"});
        } catch (error) {
            return res.status(500).json({message:"Internal server error"});
        }
    }
   
}