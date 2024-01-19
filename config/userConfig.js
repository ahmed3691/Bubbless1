const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/usersModel");
const { CartModel } = require("../model/cartModel");
const {OrdersModel} = require('../model/ordersModel');
const {updateStock} = require('../config/userDBHelpers')
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { resolve } = require("path");

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
  console.log('order placement started........')
  console.log('form data in placeOrder as body=====',body)
  const {
      fullName,
      phoneNUmber,
      email,
      house,
      landMark,
      city,
      district,
      state,
      pincode,
      selectedAddress,
      deliveryInstruction,
      totalPrice,
      productId,
      orderProductQty,
      productPrice,
      paymentMethod,
      cartId,
  } = body;
  console.log('body=====',body)
  console.log('totalproce',body.totalPrice)
  const { products } = convertToArray(productId,orderProductQty,productPrice);
  console.log('products====',products)
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

  if (cartId) {
      await CartModel.deleteOne({ _id: cartId });
  }

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
