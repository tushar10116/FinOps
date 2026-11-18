
import mongoose from 'mongoose';


export const connectDB = async ()=>{
    try{
    const uri = process.env.MONGODB_URI ?? process.env.DB_URL
    if(!uri){
        throw new Error("MONGODB_URI is not set")
    }
    const conn = await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME ?? "finops" })
    console.log(`Connected to database ${conn.connection.name}`)
    }
    catch(error:any)
    {
        console.log(`Error: ${error.message}`)
    }
}
