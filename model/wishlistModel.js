const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let connect = mongoose.connect(process.env.MONGO_URL);

connect.then(()=>{

}).catch((error)=>console.log('error on wishlistDB: ',error))

const wishlistSchema = new Schema({
    userId:{
        type: mongoose.Types.ObjectId,
        ref:'users',
        required: true,
        unique: true
    },
    products:[{
        type:mongoose.Types.ObjectId,
        ref: 'products'
    }]
})

const WishlistModel = mongoose.model('wishlist',wishlistSchema)

module.exports = {
    WishlistModel
}