
export const authorizeRoles =(...roles:string[])=> (req:any,res:any,next:any)=>{
    if(!roles.includes(req.user.role)){
        return res.status(403).json({message:"Unauthorized"});
    }
    next();
}