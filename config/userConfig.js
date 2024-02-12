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
const {PaymentModel} = require('../model/paymentModel')

async function sendOtpMail(userEmail) {
  let randomNumber = Math.floor(1000 + Math.random() * 9000);
  const updateOtp = await UserModel.updateOne(
    { userEmail: userEmail },
    { $set: { userOtp: randomNumber } },
    { upsert: true },
  );
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

const placeOrder = async (body,userId,userName,orderId)=>{


  const {fullName,phoneNUmber,email,house,landMark,city,district,state,pincode,selectedAddress,deliveryInstruction,totalPrice,productId,orderProductQty,
      productPrice,
      paymentMethod,
      cartId,
  } = body;

  console.log('product price',productPrice)

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
    console.log('userCart====>',userCart)
    products =  userCart.items;
    await CartModel.deleteOne({_id:cartId})
  
}else{
  let obj = {
    productId: productId,
    quantity: orderProductQty,
    totalPrice: productPrice
  }
  products.push(obj)
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
      amount:totalPrice,
      amount_paid: totalPrice,
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

module.exports = {
  sendOtpMail,
  getUserId,
  getCartQty,
  generateOrderId,
  convertToArray,
  razorPayRequest,
  placeOrder
};
