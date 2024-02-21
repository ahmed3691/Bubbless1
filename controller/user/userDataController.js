const { ProductModel } = require("../../model/productModel");
const { CartModel } = require("../../model/cartModel");
const { AddressModel } = require("../../model/addressModel");
const { UserModel } = require("../../model/usersModel");
const {OrdersModel} = require("../../model/ordersModel");
const {WalletModel} = require('../../model/walletModel');
const {PaymentModel} = require('../../model/paymentModel')
const{razorPayRequest,generateOrderId} = require('../../config/userConfig');
const {confirmPayment} = require('../../config/userDBHelpers')
 
const session = require("express-session");
const { response } = require("express");

const getUserProfile = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    const cartQty = req.cookies.cartQty;
    const userId = req.user;
    const userData = await UserModel.findOne({_id:userId})
  res.render("./user/userProfile", { isAuthenticated, cartQty,userData });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const getUserCart = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    let cartQty = req.cookies.cartQty;
    const userId = req.user;
    const cartItems = await CartModel.findOne({ userId: userId }).populate("items.productId");
    res.render("./user/cart", { isAuthenticated, cartQty, cartItems });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;

    const quantity = req.body.cartQuantity ?? 1;

    const userId = req.user;

    const product = await ProductModel.findOne({_id:productId})

    const productPrice = product.price
    
    const totalPrice = productPrice * quantity

      await CartModel.updateOne(
        { userId: userId },
        {
          $addToSet: { items:
            { productId, quantity,totalPrice }
            },
          $inc:{
            totalPrice:totalPrice,
            totalProducts:1,
            totalQuantity:quantity
          }
        },
        { upsert: true }, 
      );

    res.redirect("back");
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user
  
    // const product = await ProductModel.findOne({_id:productId})
    
    const productMatch = await CartModel.findOne({userId:userId,'items.productId':productId},{'items.$':1})
  
    const removeQuantity = productMatch.items[0].quantity;
    const productPrice = productMatch.items[0].totalPrice;
   
    const updateCart = await CartModel.updateOne(
      { userId: userId },
      { 
        $pull: {items: { productId: productId }},
        $inc:{totalPrice:-productPrice,totalProducts:-1,totalQuantity:-removeQuantity} 
      },
    );
  
    res.redirect("back");
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }

 
};

const editCartQuantity = async (req,res)=>{
  try {
    const userId = req.user;
    let productId = req.params.productId;
    let newProductQuantity = parseInt(req.params.productQuantity);
    const cart = await CartModel.findOne({userId,'items.productId':productId},{'items.$':1,totalPrice:1,totalQuantity:1,totalProducts:1})
  
    const initialProductQty = cart.items[0].quantity;
    const initialProductPrice = cart.items[0].totalPrice;
    const initialCartPrice = cart.totalPrice;
    const initialCartQty = cart.totalQuantity;
    const pricePerProduct = initialProductPrice/initialProductQty;
    const newProductPrice = newProductQuantity * pricePerProduct
    const newCartPrice = initialCartPrice - initialProductPrice + newProductPrice
    const newCartQty = initialCartQty - initialProductQty + newProductQuantity;

    await CartModel.updateOne(
      {userId:userId,'items.productId':productId},
      {$set:{
        totalPrice:newCartPrice,
        totalQuantity:newCartQty,
        'items.$.quantity':newProductQuantity,
        'items.$.totalPrice': newProductPrice
      }}
      );


    res.send({newCartPrice,newCartQty})
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
}


const getAdress = async (req, res) => {
  try {
    const userId = req.user;
    console.log(userId);
    const isAuthenticated = req.cookies.userAccessToken? true : false;
    let cartQty = req.cookies.cartQty;
    let message = req.flash('message')
    const userAdress = await AddressModel.findOne(
      { userId: userId },
      { addresses: true },
    );
    res.render("./user/adresses", { isAuthenticated, cartQty, userAdress,message });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
};

const addAdress = async (req, res) => {
  try {
    const {title,receiverName,phoneNumber,house,locality,city,district,state,pincode} = req.body;
    const userId = req.user;

    const newAddress = {
      title: title,
      fullName: receiverName,
      houseName: house,
      locality: locality,
      city: city,
      pinCode: pincode,
      district: district,
      state: state,
      phoneNumber: phoneNumber,
    };

    const updateAddress = await AddressModel.updateOne(
      { userId: userId },
      { $addToSet: { addresses: newAddress } },
      { upsert: true },
    );
    const address = await AddressModel.find();
    req.flash('message','Addres added')
    res.redirect("/user-address");
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
};

const deleteAddress = async (req, res) => {
  try {
    addressId = req.params.id;
    const userId = req.user;

    await AddressModel.updateOne(
      { userId: userId },
      { $pull: { addresses: { _id: addressId } } },
    );
    req.flash('message','Address removed')
    res.redirect("/user-address");
  } catch (err) {
    console.log(error);
    res.render('./user/404')
  }
};

const getEditAdress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const isAuthenticated = req.cookies.userAccessToken ? true : false;
    let cartQty = req.cookies.cartQty;
    let userId = req.user;
    const addressToEdit = await AddressModel.findOne(
        {userId:userId,addresses:{$elemMatch:{_id:addressId}}},
        {'addresses.$':1}
        );
    res.render("./user/editAddress", {isAuthenticated,cartQty,addressToEdit,});
  } catch (err) {
    console.log(error);
    res.render('./user/404')
  }
};

const editAddress = async (req, res) => {
  try {
    addressId = req.params.id;   
    const userId = req.user;

    const {title,receiverName,phoneNumber,house,locality,city,district,state,pincode,} = req.body;
    const user = await AddressModel.findOne({userId:userId,"addresses._id":addressId},{'addresses.$':1})

    const updateAdress = await AddressModel.updateOne(
      { userId: userId, "addresses._id": addressId },
      {
        $set: {
          "addresses.$.title": title,
          "addresses.$.fullName": receiverName,
          "addresses.$.houseName": house,
          "addresses.$.locality": locality,
          "addresses.$.city": city,
          "addresses.$.pinCode": pincode,
          "addresses.$.district": district,
          "addresses.$.state": state,
          "addresses.$.phoneNumber": phoneNumber,
        },
      },
    );
    req.flash('message','Address edited successfully')
    res.redirect('/user-address')
  } catch (err) {
    console.log(error);
    res.render('./user/404')
  }
};

const userOrders = async(req,res)=>{
  try {
    const userId = req.user;
    const isAuthenticated = req.cookies.userAccessToken ? true : false;
    const cartQty = req.cookies.cartQty;
  
    const allOrders = await OrdersModel.find({userId:userId}).sort({createdAt:-1}).populate('products.productId');
  
    res.render('./user/allOrders',{userId,isAuthenticated,cartQty,allOrders});
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
 
}

const orderDetails = async (req,res)=>{
  try{
    const userId = req.user;
    const isAuthenticated = req.cookies.userAccessToken ? true : false;
    const cartQty = req.cookies.cartQty;
    const orderId = req.params.id;
    const order = await OrdersModel.findOne({_id:orderId}).populate('products.productId')
    let message = req.flash('message')

    
    res.render('./user/orderDetails',{order,isAuthenticated,cartQty,message})
  }catch(err){
    console.log(err)
    res.render('./user/404')
  }
}

const returnOrder = async (req,res)=>{
  try {
    const orderId = req.params.id;
    const userId = req.user;
    const order = await OrdersModel.findOne({_id:orderId})

    const price = order.totalPrice;
    
    const updateOrder = await OrdersModel.updateOne({_id: orderId},{$set:{status:'Returned'}});
    const updateWallet = await WalletModel.updateOne(
      {userId:userId},
      {$inc:{amount:price}},
      {upsert: true}) 
    const newPayment = new PaymentModel({
      userId,
      paymentFor: 'Wallet Credit',
      paymentIntitatedFor:'Returned Order',
      entity: 'order',
      amount:price*100,
      amount_paid: price,
      amount_due: 0,
      currenc: 'INR',
      receipt: orderId,
      offer_id: null,
      status: 'success',
      attempts: 0
    });

    newPayment.save()
      .then(()=>{
        console.log('Payment saved for returned order');
      })
      .catch((error)=>{
        console.log('Error in saving payment info for returned order', error)
      })
    req.flash('message', 'Order return request has been processed!');
    res.redirect(`/order-details/${orderId}`)
  } catch (error) {
    console.log(error)
    res.render('./user/404')
  } 
}

const getWallet = async (req,res)=>{
  try {
    const isAuthenticated = req.cookies.userAccessToken ? true : false;
    const cartQty = req.cookies.cartQty;
    const userId = req.user;
    console.log(userId);
    const wallet = await WalletModel.findOne({userId:userId});
    
    if(!wallet){
      const newWallet = new WalletModel({ userId, amount:0})
      await newWallet.save();
      res.render('./user/wallet',{wallet:newWallet,isAuthenticated,cartQty});
    }else{
      res.render('./user/wallet',{wallet,isAuthenticated,cartQty});
    }
  } catch (error) {
    console.log(error)
    res.render('./user/404')
  }
  
  
}

const sendRazorpayRequestForWallet = (req,res)=>{
  try {
    const userId = req.user;
    const amount = parseInt(req.body.amount);
    const transactionId = generateOrderId();

    razorPayRequest(transactionId,amount)
      .then((response)=>{
        
        const newPayment = new PaymentModel({
          userId,
          paymentIntitatedFor: 'Money added to wallet',
          paymentFor:'Wallet Credit',
          ...response
        })

      newPayment.save()
        .then(()=>res.json(response))
        .catch(()=>res.json(response));

      })
      .catch(err=>{
        console.log(err);
        res.status(500);
      })
  } catch (error) {
    console.log(error)
    res.render('./user/404')
  }
  
}

const walletDeposit = async (req,res)=>{
  try {
    const userId = req.user;
    console.log('updating wallet....');
    if(req.body.response.razorpay_signature){

      const depositAmount = req.body.responseOrder.amount / 100;
      await WalletModel.updateOne({userId},{$inc:{amount:depositAmount}});
      confirmPayment(req.body.responseOrder.receipt,req.body.responseOrder.amount); 
      res.send({wallet_updated:true})
    }else{
      res.send({wallet_updated: false})
    }
    
  } catch (error) {
    console.log(error)
    res.render('./user/404')
  }
  
}

const walletTransactions =  async (req,res)=>{
  try {
    const userId = req.user;

    const userWallet = await WalletModel.findOne({userId});

    const transactions = await PaymentModel.find(
      {
        userId,
        paymentFor:{$in:['Wallet Debit','Wallet Credit']}
      }
    ).sort({createdAt:-1})



    res.send({transactions,userWallet})
  } catch (error) {
    console.log(error)
    res.render('./user/404')
  }
  
}

module.exports = {
  getUserProfile,
  getUserCart,
  addToCart,
  removeFromCart,
  getAdress,
  addAdress,
  deleteAddress,
  getEditAdress,
  editAddress,
  userOrders,
  orderDetails,
  editCartQuantity,
  returnOrder,
  getWallet,
  sendRazorpayRequestForWallet,
  walletDeposit,
  walletTransactions
};

