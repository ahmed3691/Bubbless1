const mongoose = require("mongoose")
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
    
}).catch((err)=>{
    console.log(`user DB error: ${err}`)
})

const paymentSchema = new Schema({
    userId: Schema.Types.ObjectId,
    paymentFor:String,
    paymentIntitatedFor:String,
    id: String,
    entity: String,
    amount: Number,
    amount_paid: Number,
    amount_due: Number,
    currency: String,
    receipt: String,
    offer_id: String,
    status: String,
    attempts: Number,
    notes: Array,
    created_at: Number

},{timestamps:true})

const PaymentModel = mongoose.model('payments', paymentSchema);

module.exports = {PaymentModel};