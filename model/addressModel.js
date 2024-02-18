const mongoose = require("mongoose");
const { stringify } = require("uuid");
const Schema = mongoose.Schema;
let connect = mongoose.connect(process.env.MONGO_URL);

connect
  .then(() => {
   
  })
  .catch((err) => {
    console.log(`Adress model ${err}`);
  });

const addressSchema = {
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  addresses: [
    { 
      title:{
        type: String,
        required:true
      },
      fullName: {
        type: String,
        required: true,
      },
      houseName:{
        type:String,
        rquired:true
      },
      locality: {
        type: String,
        required: true,
      }, 
      city: {
        type: String,
        rquired: true,
      },
      pinCode: {
        type: Number,
        required: true,
      },
      district: { 
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: Number,
        required: true,
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
};

const AddressModel = mongoose.model('userAdress',addressSchema)

module.exports = {AddressModel}
