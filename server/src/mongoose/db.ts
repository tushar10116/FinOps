
import mongoose from 'mongoose';

const uriHasDatabase = (uri: string) => {
    const path = uri.replace(/^[^:]+:\/\/[^/]*/, "").split("?")[0] ?? "";
    return path.replace(/^\//, "").length > 0;
}

export const connectDB = async ()=>{
    try{
    const uri = process.env.MONGODB_URI ?? process.env.DB_URL
    if(!uri){
        throw new Error("MONGODB_URI is not set")
    }
    const dbName = process.env.MONGODB_DB_NAME ?? (uriHasDatabase(uri) ? undefined : "finops")
    const conn = await mongoose.connect(uri, dbName ? { dbName } : {})
    console.log(`Connected to database ${conn.connection.name}`)
    }
    catch(error:any)
    {
        console.log(`Error: ${error.message}`)
    }
}
