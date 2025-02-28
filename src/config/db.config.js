import mongoose from 'mongoose'

const db = async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URL);
  }catch(err){
    console.log( `mongoDb connection error: ${err.message}`)
  }
}

export default db;