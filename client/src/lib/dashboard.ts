import { getStoredToken } from "./auth"

export async function resizeResource(platform: string, actionType: string, resourceName: string, resourceGroupName: string, recommendation: string, targetSize: string | undefined){
    try{
        const response = await fetch('/api/dashboard/resize-resource',{
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${getStoredToken()}`},
            body:JSON.stringify({platform,actionType,resourceName,resourceGroupName,recommendation,targetSize})
        })
        if(!response.ok) throw new Error(`Request failed with status ${response.status}`)
        return await response.json()
    }catch(error:any){
        throw new Error(error?.message||'Internal server error')
    }
}