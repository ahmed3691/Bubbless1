const mongoose = require('mongoose')
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL)

connect.then(()=>{
   
}).catch((err)=>{
    console.log(`Category model ${err}`)
})

const catSchema = {
    subCatName :{
        type : String,
        required : true
    },
    category:{
        type : String,
        required: true
    },
    catId:{
        type: Schema.Types.ObjectId,
        ref:"categories",
        required: true
    },
    catDesc:{
        type: String,
        default:"This category falls in kids clothes"
    },
    isListed:{
        type: Boolean,
        default: true
    }
}

const mainCatSchema = {
    catName : String,
    catDesc : String
}

const SubCatModel = mongoose.model("subcategories",catSchema)
const CatModel = mongoose.model("categories",mainCatSchema)
module.exports = {CatModel,SubCatModel}