import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser, getStoredToken } from "../lib/auth";

export const useUser =()=>{
    const token = getStoredToken();
   return useQuery({
    queryKey: ["current-user", token],
    queryFn: () => fetchCurrentUser(token as string),
    
  });
}