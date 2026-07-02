
import  'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './mongoose/db.js';
import authRoutes from './routes/authRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';


const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
connectDB();
app.use(express.json());

app.use('/api/auth',authRoutes);
app.use('/api/organization',organizationRoutes)
app.use('/api/dashboard',dashboardRoutes)


app.listen(port,()=>{console.log(`Server is running on port ${port}`)})

