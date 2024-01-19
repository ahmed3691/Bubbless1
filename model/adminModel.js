const mongoose = require('mongoose')

let connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
    console.log(`admin DB connected`)
}).catch((err)=>{
    console.log(` admin DB error ${err}`)
})

const adminSchema = {
    adminName :{
        type : String,
        required : true
    },
    password : {
        type : Number,
        required : true
    },
    accessToken : {
        type : String
    }
}

const AdminModel = mongoose.model("admins",adminSchema)

module.exports =  {AdminModel}