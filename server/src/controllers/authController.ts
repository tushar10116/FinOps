import User from "../mongoose/models/User.js";
import { ILoginInput, ISignupInput } from "../validations/authValidator.js";
import { Request, Response } from "express";
import { AuthSession, AuthUser } from "@shared/types.js";
import jwt from "jsonwebtoken";
import InviteUser from "../mongoose/models/InviteUser.js";

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
                organizationId:user.organizationId.toString()
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
    signup: async (req:Request<{}, {}, ISignupInput>, res:Response) => {
        try {
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
   
}