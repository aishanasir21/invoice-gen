const mongoose = require('mongoose')

async function connectDB() {
   await mongoose.connect(process.env.MONGO_URI)
   .then( () => {
    console.log("database is connected ")
   })
   .catch( (err) => {
    console.log("error in connecting to db : ", err)
    process.exit(1) // if not connected server stops running 
   })
}

module.exports = connectDB