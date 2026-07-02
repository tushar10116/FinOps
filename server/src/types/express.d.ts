import { AuthUser } from "@shared/types.js";
declare global{
    namespace Express {
        export interface Request {
            user?: AuthUser;
        }
    }

    interface String{
        isNullOrEmptyString();
        
    }
}