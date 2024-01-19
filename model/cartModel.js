const mongoose = require('mongoose')
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
    console.log(`Cart DB connected`)
}).catch((err)=>{
    console.log(`Cart model ${err}`)
})

const cartSchema = {
    userId:{
        type: Schema.Types.ObjectId,
        ref: "users",
        required:true,
        unique: true
    },
    items:[{
        productId:{
            type: Schema.Types.ObjectId,
            ref: "products",
            required: true
        },
        quantity:{
            type: Number,
            required: true,
            default: 1
        },
        totalPrice:{
            type: Number,
            required: true
        }      
    }],
    totalPrice:{
        type:Number,
        default:0
    },
    totalProducts:{
        type:Number,
        default:1
    },
    totalQuantity:{
        type:Number,
        default:1
    }
}

const CartModel = mongoose.model('userCarts',cartSchema)

module.exports ={CartModel}