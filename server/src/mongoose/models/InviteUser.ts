import mongoose from 'mongoose';

const inviteUserSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    role:{
        type:String,
        required:true,
        enum:["admin","billing_analyst","viewer","finance_lead"],
        default:"viewer"
    },
    organizationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    createdAt: {
        type: Date,
        default:Date.now,
        required: true,
        expires:'1h'
    }
});

export default mongoose.model("InviteUser", inviteUserSchema);