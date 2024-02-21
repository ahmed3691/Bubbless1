const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/usersModel");
const { CartModel } = require("../model/cartModel");
const {OrdersModel} = require('../model/ordersModel');
const {updateStock} = require('../config/userDBHelpers')
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { resolve } = require("path");
const { WalletModel } = require("../model/walletModel");
const {PaymentModel} = require('../model/paymentModel');
const {ProductModel} = require('../model/productModel')

async function sendOtpMail(userEmail) {
  let randomNumber = Math.floor(1000 + Math.random() * 9000);
  console.log('eamil for send otp',userEmail);
  const updateOtp = await UserModel.updateOne(
    { userEmail },
    { $set: { userOtp: randomNumber } },
    
  );
  console.log(updateOtp)
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.MAIL_SECRET,
    },
  });

  const mailBody = {
    from: "Bubbles Kids Store",
    to: userEmail,
    subject: "OTP Verification",
    text: `Please enter this OTP number on your verification page
                OTP : ${randomNumber}`,
  };

  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

const getUserId = (userAccesToken) => {
  if (userAccesToken) {
    const decode = jwt.verify(userAccesToken, process.env.JWT_ACCESS_SECRET);
    return decode.userId;
  }
};

const getCartQty = async (userId) => {
  const cartItems = await CartModel.find({ userId: userId }).select(
    "items -_id",
  );
  return cartItems[0]?.items.length;
};

function generateOrderId() {
  const randomString = crypto.randomBytes(4).toString("hex");
  const timestamp = Date.now().toString();
  const orderId = `${randomString}${timestamp}`;
  return orderId;
}

function convertToArray(productId, orderProductQty, productPrice) {
  if (!Array.isArray(productId)) productId = [productId];
  if (!Array.isArray(orderProductQty)) orderProductQty = [orderProductQty];
  if (!Array.isArray(productPrice)) productPrice = [productPrice];

  let products = [];
  for (let i = 0; i < productId.length; i++) {
    const prod = {
      productId: productId[i],
      quantity: orderProductQty[i],
      price: productPrice[i],
    };
    products.push(prod);
  }
  return { products };
}

function razorPayRequest(orderId, amount) {

  return new Promise((resolve, reject) => {
    const instance = new Razorpay({
      key_id: "rzp_test_EbOxVRcWySzIRR",
      key_secret: "Pd5wwK2HIBnksACTJoB8Ssny",
    });

    const options = {
      amount: amount*100,
      currency: "INR",
      receipt: orderId,
    };

    instance.orders.create(options, function (err, order) {
    
      if (err) {
        reject(err);
      } else {
        resolve(order);
      }
    });
  })
}

async function checkForStock(products){
  for(product of products){
    prod = await ProductModel.findOne({_id:product.productId});
    if(prod.stockQty < product.quantity){
      console.log('out of stock');
      return false
    }else{
      console.log('stock is ok')
    }
  }
  return true;
}

const placeOrder = async (body,userId,userName,orderId)=>{

  const {fullName,phoneNUmber,email,house,landMark,city,district,state,pincode,selectedAddress,deliveryInstruction,totalPrice,productId,orderProductQty,
      productPrice,
      paymentMethod,
      cartId,
  } = body;



  let products = [];

  if (cartId) {
    
    const userCart = await CartModel.findOne(
      { _id: cartId },
      {
         'items._id':0,
          _id: 0,
          userId:0, 
      }
    );
      
    products =  userCart.items;
    const stock = await checkForStock(products);
    if(!stock) return false;
    console.log('products===>',products)
    await CartModel.deleteOne({_id:cartId})
  
}else{
  let obj = {
    productId: productId,
    quantity: orderProductQty,
    totalPrice: productPrice
  }
  products.push(obj);
  const stock = await checkForStock(products);
  console.log('stock',stock)
  if(!stock) return false;
}


  const addedAddress =
      fullName +
      "\n" +
      phoneNUmber +
      "\n" +
      house +
      "\n" +
      landMark +
      "\n" +
      city +
      "\n" +
      district +
      "\n" +
      state +
      "\n" +
      pincode;
  let deliveryAddress = addedAddress.trim() || selectedAddress;

  if(paymentMethod == 'Wallet Payment'){
    const updateWallet = await WalletModel.updateOne(
      {userId},
      {$inc:{amount:-totalPrice}}
    )
    
    const newPayment = new PaymentModel({
      userId,
      paymentFor: 'Wallet Debit',
      paymentIntitatedFor:'Placed Order',
      entity: 'order',
      amount:(totalPrice*100),
      amount_paid: (totalPrice*100),
      amount_due: 0,
      currenc: 'INR',
      receipt: orderId,
      offer_id: null,
      status: 'success',
      attempts: 0
    })

    newPayment.save()
      .then(()=>{
        console.log('Wallet payment saved')
      })
      .catch((error)=>{
        console.log('Error saving wallet Payment ',error)
      })
  }

  const newOrder = new OrdersModel({
      userId: userId,
      userName: userName,
      orderId: orderId,
      products: products,
      totalPrice: totalPrice,
      deliveryAddress: deliveryAddress,
      deliveryInstructions: deliveryInstruction,
      paymentMethod: paymentMethod,
  });


  newOrder.save()
      .then(() =>{
          console.log('order saved')
          updateStock(products)
          console.log('stock updated')
      })
      .catch((error) => {
          console.log(error)
      })
  return orderId;
}

async function getFilters(catName,subCatName){

  filters = await ProductModel.aggregate([
    {
      $match:{
        category:catName,
        subCategory:subCatName
      }
    },
    {
      $facet:{
        brand:[
          {$group:{_id:'$brand'}},
          {$project:{_id:0,brand:"$_id"}}
        ],
        size:[
          {$group:{_id:'$ageGap'}},
          {$project:{_id:0,size:"$_id"}}
        ],
        color:[
          {$group:{_id:"$color"}},
          {$project:{_id:0,color:"$_id"}}
        ]
      }
    }
  ]);
  
  return filters[0];
}

module.exports = {
  sendOtpMail,
  getUserId,
  getCartQty,
  generateOrderId,
  convertToArray,
  razorPayRequest,
  placeOrder,
  getFilters,
  checkForStock
};
