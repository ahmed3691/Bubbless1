const mongoose = require('mongoose')
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL);

connect.then(()=>{ console.log(`Category DB connected`)
}).catch((err)=>{
    console.log(`Coupon model ${err}`)
})

const couponSchema = new Schema({
    couponTitle:{
        type: String,
        required: true
    },
    couponAmount:{
        type: Number,
        required: true
    },
    couponType:{
        type:String,
        required: true
    },
    isListed:{
        type: Boolean,
        default: true
    }
},{timestamps:true});

const CouponModel = mongoose.model('coupons',couponSchema)


module.exports = {
    CouponModel
}