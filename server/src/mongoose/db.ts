import mongoose from 'mongoose';


export const connectDB = async ()=>{
    try{
    const conn = await mongoose.connect(process.env.DB_URL)
    console.log(`Connected to database {conn.connection.name}`)
    }
    catch(error)
    {
        console.log(`Error: ${error.message}`)
    }
}


