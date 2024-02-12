const mongoose = require("mongoose")

let connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
    console.log(`users DB connected`)
}).catch((err)=>{
    console.log(`user DB error: ${err}`)
})

const userSchema = {
    userName : {type : String, reuired : true},
    userPh : {type : Number, default: 0},
    userEmail : {type : String, required : true},
    userPassword : {type : String, required: true},
    refreshToken : {type:String},
    isVerified : {type: Boolean, default: false},
    isBlocked : {type: Boolean, default: false},
    userOtp: {
        type: Number,
        required: true
    }
}

// userSchema.virtual("id").get(function(){     creates a virtual id field in the document , which is not actually stored it the collection.
//     return this._id.toHexString();           this _id field is converted to a hexadecimal form which is more user readable than mongo objectIds.
// })
// productSchema.set("toJSON",{
//     virtuals: true
// })

const UserModel = mongoose.model("users",userSchema)

module.exports = {UserModel}