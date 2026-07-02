import { IOrganization, IOrganizationCloudResponse, Organization } from "@shared/types";
import { CloudCredentials } from "../pages/CloudConnectPage";
import { getStoredToken, readErrorMessage } from "./auth";


const baseURL = "https://finops-nxob.onrender.com/";

export async function registerCloud(
  creds: CloudCredentials,
): Promise<string> {
  try {
    const response = await fetch(`${baseURL}/api/organization/register-cloud`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getStoredToken()}`,
      },

      body: JSON.stringify(creds),
    });

    if(!response.ok)
    {
    const message = await readErrorMessage(response);
    throw new Error(message);
    }

    return await response.json();
  } catch (error:any) {
    throw new Error("unable to register");
  }
}


export async function getOrganization()
{
    try {
        
        const response = await fetch(`${baseURL}/api/organization/get-organization`,
            {
                method:"GET",
                headers:{
                    'Authorization':`Bearer ${getStoredToken()}`
                }
            }
        )

        return await response.json().then(response=>response.organization)
    } catch (error) {
        return {}
    }
}

export async function updateConnectionStatus(statusInput:{platform:string,status:string}):Promise<string>{
  try {
   
    const response = await fetch(`${baseURL}/api/organization/update-connection-status`,{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${getStoredToken()}`
      },
      body:JSON.stringify(statusInput)
    })

    if(!response.ok)
    {
      const message = await readErrorMessage(response)

      throw new Error(message)
    }

    return await response.json()
  } catch (error:any) {
    throw new Error(error.message)
  }
}