import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Define the raw properties interface
export interface IUser {
    name: string;
    email: string;
    password: string;
    organizationId: mongoose.Types.ObjectId;
    role: 'admin' | 'viewer';
}

// 2. Define the instance methods interface
interface IUserMethods {
    comparePassword(userPassword: string): Promise<boolean>;
    generateAuthToken(): Promise<string>;
}

// 3. Combine them into a Document type for Mongoose
export type UserDocument = Document & IUser & IUserMethods;

// 4. Define the Schema using the accurate types
const userSchema = new Schema<UserDocument>(
    {
        name: {
            type: String,
            required: [true, "User name is required"],
        },
        email: {
            type: String,
            trim: true,
            required: [true, "email is required"],
            unique: true,
            index: true
        },
        password: {
            type: String,
            required: [true, "password is required"],
        },
        role: {
            type: String,
            enum: ["admin", "viewer"],
            default: "viewer"
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: [true, "organization is required"]
        }
    },
    {
        timestamps: true // Optional: Gives you createdAt and updatedAt automatically
    }
);

// 5. Implement Instance Methods safely using 'this' assertion
userSchema.methods.comparePassword = async function (this: UserDocument, userPassword: string): Promise<boolean> {
    return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.generateAuthToken = async function (this: UserDocument): Promise<string> {
    const token = jwt.sign(
        { 
            id: this._id, 
            email: this.email, 
            name: this.name, 
            organizationId: this.organizationId,
            role: this.role
        },
        process.env.JWT_SECRET!, 
        { expiresIn: '1h' }
    );
    return token;
};

// 6. Create and Export Model
const User: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
export default User;