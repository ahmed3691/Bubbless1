const { ProductModel } = require("../../model/productModel");
const { SubCatModel, CatModel } = require("../../model/categoryModel");
const { CartModel } = require("../../model/cartModel");
const userConfig = require("../../config/userConfig");
const { AddressModel } = require("../../model/addressModel");
const { UserModel } = require("../../model/usersModel");
const {OrdersModel} = require("../../model/ordersModel");

const session = require("express-session");

const getUserProfile = async (req, res) => {
  const isAuthenticated = req.cookies.userAccessToken || false;
  const cartQty = req.cookies.cartQty;
  const userId = req.user;
  const userData = await UserModel.findOne({_id:userId})
  res.render("./user/userProfile", { isAuthenticated, cartQty,userData });
};

const getUserCart = async (req, res) => {
  const isAuthenticated = req.cookies.userAccessToken || false;
  let cartQty = req.cookies.cartQty;
  const userId = req.user;
  const cartItems = await CartModel.findOne({ userId: userId }).populate("items.productId");
  res.render("./user/cart", { isAuthenticated, cartQty, cartItems });
};

const addToCart = async (req, res) => {
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
};

const removeFromCart = async (req, res) => {

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
};

const editCartQuantity = async (req,res)=>{
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
  } catch (err) {
    console.log(err);
  }
};

const addAdress = async (req, res) => {


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
    console.log("catch err:", err);
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
    console.log(err);
    res.status(500).send(err);
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
    console.log(err);
    res.status(500).send(err);
  }
};

const userOrders = async(req,res)=>{
  const userId = req.user;
  const isAuthenticated = req.cookies.userAccessToken ? true : false;
  const cartQty = req.cookies.cartQty;

  const allOrders = await OrdersModel.find({userId:userId}).populate('products.productId')

  res.render('./user/allOrders',{userId,isAuthenticated,cartQty,allOrders});
}

const orderDetails = async (req,res)=>{
  try{
    const userId = req.user;
    const isAuthenticated = req.cookies.userAccessToken ? true : false;
    const cartQty = req.cookies.cartQty;
    const orderId = req.params.id;
    const order = await OrdersModel.findOne({_id:orderId}).populate('products.productId')
    let message = req.flash('message')
    console.log(message)
    
    res.render('./user/orderDetails',{order,isAuthenticated,cartQty,message})
  }catch(err){
    console.log(err)
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
  editCartQuantity
};
