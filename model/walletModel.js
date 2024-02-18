const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
    
}).catch((err)=>{
    console.log(err)
});

const walletSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        required: true
    },
    amount:{
        type: Number,
        default: 0
    }
});

const WalletModel = mongoose.model('wallet',walletSchema);

module.exports = {WalletModel};