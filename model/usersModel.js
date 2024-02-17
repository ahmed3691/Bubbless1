const mongoose = require("mongoose")
const Schema = mongoose.Schema
let connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
    console.log(`users DB connected`)
}).catch((err)=>{
    console.log(`user DB error: ${err}`)
})

const userSchema = {
    userName : {type : String, required : true},
    userPh : {type : Number},
    userEmail : {type : String, required : true},
    userPassword : {type : String, required: true},
    refreshToken : {type:String},
    isVerified : {type: Boolean, default: false},
    isBlocked : {type: Boolean, default: false},
    userOtp: {
        type: Number
        
    },
    refferalCode:{
        type: String,
        default:'noRefferals'
    },
    refferalCompleted:{
        type: Number,
        default: 0
    },
    usedCoupons:[{ type: Schema.Types.ObjectId }]  
}



const UserModel = mongoose.model("users",userSchema)

module.exports = {UserModel}