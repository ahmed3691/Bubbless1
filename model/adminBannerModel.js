const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const connect = mongoose.connect(process.env.MONGO_URL);

connect.then(()=>{

}).catch((error)=>{
    console.log('error in connecting banner DB',error)
})

const bannerSchema = new Schema({
    images:[{type:String}]
});

const BannerModel = mongoose.model('banners',bannerSchema);

module.exports ={BannerModel}