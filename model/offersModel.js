const mongoose = require('mongoose')
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL);

connect.then(()=>{
   
}).catch((err)=>{
    console.log(`Offers model ${err}`)
});

const offersSchema =new Schema ({
    offerTitle:{
        type: String,
        required: true
    },
    offerType:{
        type:String,
        required:true,
        enum:['percentage','fixedAmount','buyXgetY']
    },
    offerAppliedFor:{
        type:String,
        default:null
    },
    percentage:{
        type: Number,
        default: 0
    },
    fixedAmount:{
        type: Number,
        default: 0
    },
    buy: {
        type: Number,
        default: 0
    },
    get: {
        type: Number,
        default: 0
    }
},{timestamps:true});

const OffersModel = mongoose.model('offers',offersSchema);

module.exports = {OffersModel};