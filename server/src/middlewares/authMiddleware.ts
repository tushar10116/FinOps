import { Request,Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {

        return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = jwt.decode(token) as { id: string,role:string, email: string, name: string ,organizationId:string};
   return next();
};

export default authMiddleware;