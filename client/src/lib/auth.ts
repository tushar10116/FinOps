import { z } from "zod";
import type { AuthSession, AuthUser, RegisterInput, AuthCredentials, Organization, RegisterOrganizationResponse, InviteUserInput, InviteUserResponse, IInviteUserInput } from "@shared/types";
import { OrganizationMember } from "../pages/OrganizationUsersPage";

const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role:z.string()
});

const authSessionSchema = z.object({
  token: z.string(),
  user: authUserSchema
});

const invitedUser = z.object({
  name: z.string(),
  email: z.string(),
  role: z.string(),
})



const authTokenKey = "finops_auth_token";

export type { AuthUser, AuthSession, RegisterInput, AuthCredentials, InviteUserInput };

export function getStoredToken(): string | null {
  return window.localStorage.getItem(authTokenKey);
}

export function saveStoredToken(token: string): void {
  window.localStorage.setItem(authTokenKey, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(authTokenKey);
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return authSessionSchema.parse(await response.json()) as T;
}

const baseURL=import.meta.env.VITE_BASE_URL

export async function registerUser(input: IInviteUserInput): Promise<any> {
  const response= await fetch(`${baseURL}/api/auth/register`,{ method:"POST", body:JSON.stringify(input),
    headers:{
      "Content-Type": "application/json"  
    }
  })

   if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return await response.json()
}

export async function registerOrganization(input: RegisterInput & Organization ): Promise<RegisterOrganizationResponse> {
  const response = await fetch(`${baseURL}/api/auth/register-organization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return await response.json()

  
 
}

export function loginUser(input: AuthCredentials): Promise<AuthSession> {
  return postAuth<AuthSession>(`${baseURL}/api/auth/login`, input);
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${baseURL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return authUserSchema.parse(await response.json());
}



export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}


export async function addMemberToOrganization(input: InviteUserInput): Promise<InviteUserResponse|string> {

  try{
    const response = await fetch(`${baseURL}/api/organization/invite-member`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getStoredToken()}`
    },
    body: JSON.stringify(input)
  });

  if(!response.ok){
    const message = await readErrorMessage(response);
    throw new Error(message);
  }


  return invitedUser.parse(await response.json()) as InviteUserResponse;
}
catch(error){
  const message = "Internal server error";
  throw new Error(error instanceof Error ? error.message : message);
}

}


export async function getInvitedMembers(): Promise<InviteUserResponse[]> {

  const response = await fetch(`${baseURL}/api/organization/invited-members`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${getStoredToken()}`
    }
  });

  if(!response.ok){
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return invitedUser.array().parse(await response.json()) as InviteUserResponse[];


}

export async function forgetPassword(passwordResetPayload:{email:string,token:string,password:string}): Promise<string> {

  try {
    const response = await fetch(`${baseURL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(passwordResetPayload)
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    return new Promise((resolve, reject) => {
      if (error instanceof Error) {
        reject(error);
      } else {
        reject(new Error("Internal server error"));
      }
    })
  }
}

export async function getResetToken(email:string): Promise<string> {

  try {
    const response = await fetch(`${baseURL}/api/auth/get-reset-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({email})
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    return new Promise((resolve, reject) => {
      if (error instanceof Error) {
        reject(error);
      } else {
        reject(new Error("Internal server error"));
      }
    })
  }
}

export async function getRegisteredUsers(): Promise<InviteUserResponse[]> {

  const response = await fetch(`${baseURL}/api/organization/get-organization-users`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${getStoredToken()}`
    }
  });
   if(!response.ok){
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return invitedUser.array().parse(await response.json()) as InviteUserResponse[];

}

export async function removeInvitedMember(email:string):Promise<string>{

  try {
    const response = await fetch(`${baseURL}/api/organization/remove-invited-member`, {
      method:'DELETE',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getStoredToken()}`
      },
      body: JSON.stringify({email})
      })

      if(!response.ok){
        const message = await readErrorMessage(response);
        throw new Error(message);
      }
      return "Member removed successfully";
  } catch (error) {
      const message = "Internal server error";
        throw new Error(message);
  }
}

export async function deleteRegisteredUser(email:string):Promise<string>{

  try {
    const response = await fetch(`${baseURL}/api/organization/remove-registered-member`, {
      method:'DELETE',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getStoredToken()}`
      },
      body: JSON.stringify({email})
      })

      if(!response.ok){
        const message = await readErrorMessage(response);
        throw new Error(message);
      }
      return "Member removed successfully";
  } catch (error) {
      const message = "Internal server error";
        throw new Error(message);
      }
}

export async function generateInviteTokenForMember(email:string):Promise<OrganizationMember>{

  try {
    const response = await fetch(`${baseURL}/api/organization/generate-invite-token`, {
      method:'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getStoredToken()}`
      },
      body: JSON.stringify({email})
      })

      if(!response.ok){
        const message = await readErrorMessage(response);
        throw new Error(message);
      }
      return await response.json() as OrganizationMember;
  } catch (error) {
      const message = "Internal server error";
        throw new Error(message);  
      }
    }