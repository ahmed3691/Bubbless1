const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL);

connect
  .then(() => {
    console.log(`product DB connected `);
  })
  .catch((err) => {
    console.log(`DB error ${err}`);
  });

const productSchema = mongoose.Schema({
  productName: { type: String, required: true },
  stockQty: { type: Number, required: true, min: 0 },
  brand : {type: String,required: true},
  color : {type: String,required: true},
  ageGap: {type: String, required:true},
  price: { type: Number, required: true },
  desc: { type: String, default: "Clothes" },
  // size: { type: String, required: true },
  category: { type: String, required: true },
  categoryId: {type: Schema.Types.ObjectId, ref:"categories", required: true},
  subCategory: { type: String, required: true },
  subCategoryId:{type: Schema.Types.ObjectId}, 
  productImages: [String],
  isListed: {type: Boolean, default: true}
});

const ProductModel = mongoose.model("products", productSchema);

module.exports = { ProductModel };
