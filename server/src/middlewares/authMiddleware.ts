import { Request,Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {

        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET!) as { id: string,role:string, email: string, name: string ,organizationId:string};
    } catch {
        return res.status(401).json({ message: "Unauthorized" });
    }
   return next();
};

export default authMiddleware;