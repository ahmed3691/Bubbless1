const express = require("express")
const router = express.Router()
const mongoose = require('mongoose')
const {ProductModel} = require("../model/productModel");
const userController = require("../controller/user/userAuthCont")
const {UserModel} = require("../model/usersModel")
const bcrypt = require("bcrypt");
const session = require("express-session");
const validator = require("validator")
const userProdCont = require('../controller/user/userProdCont')
const userDataController = require('../controller/user/userDataController')

const path = require("path")
const {userAuthentication} = require('../middlewares/userMWs')
const userBuyController = require('../controller/user/userPurchaseController');
const { route } = require("./adminRoute");

 

//User login signup....................................................................

router.route(`/`)
    .get(userAuthentication,userController.home);
router.route("/login")
    .get(userAuthentication,userController.login)
    .post(userController.loginUser);
router.route("/logout")
    .get(userController.logout);
router.route('/register')
    .get(userAuthentication,userController.getRegister)
    .post(userController.registerUser);
router.route("/verify-otp")
    .post(userController.verifyOtp);
router.route("/otp")
    .get(userController.loadOtp);
router.route("/resend-otp")
    .post(userController.resendOtp);
router.route('/forgot-password')
    .get(userAuthentication,userController.sendOtpForNewPassword)
    .post(userAuthentication,userController.verifyOtpForNewPassword)
router.route('/change-password')
    .post(userAuthentication,userController.changePassword)

//user products management..............................................................

router.route('/products/:pageNumber')
    .get(userProdCont.viewAllProducts);
router.route('/single-product/:prodId')
    .get(userProdCont.singleProduct);
router.route('/categorised-products/:catName/:subCatName')
    .get(userProdCont.categorisedProduct);
router.route('/search-products/:searchKey')
    .get(userProdCont.searchProducts)
router.route('/search-products')
    .get(userProdCont.viewAllProducts)

//user Profile and details..........................................................................

router.route('/user-profile')
    .get(userAuthentication,userDataController.getUserProfile)
router.route('/user-cart')
    .get(userAuthentication,userDataController.getUserCart)
router.route('/add-to-cart/:productId')
    .all(userAuthentication,userDataController.addToCart);
router.route('/remove-from-cart/:productId')
    .all(userAuthentication,userDataController.removeFromCart)
router.route('/edit-cart-quantity/:productId/:productQuantity')
    .get(userAuthentication,userDataController.editCartQuantity)
router.route('/user-address')
    .get(userAuthentication,userDataController.getAdress)
    .post(userAuthentication,userDataController.addAdress)
router.route('/delete-adress/:id')
    .get(userAuthentication,userDataController.deleteAddress)
router.route('/edit-address/:id')
    .get(userAuthentication,userDataController.getEditAdress)
    .post(userAuthentication,userDataController.editAddress)
router.route('/orders')
    .get(userAuthentication,userDataController.userOrders)
router.route('/order-details/:id')
    .get(userAuthentication,userDataController.orderDetails)

//user checkout and Payment options.......................................

router.route('/checkout/:id')
    .all(userAuthentication,userBuyController.getChekout)
router.route('/place-order')
    .post(userAuthentication,userBuyController.orderConfirmation)
router.route('/cancel-order/:id')
    .post(userAuthentication,userBuyController.cancelOrder)
router.route('/order-success')
    .get(userAuthentication,userBuyController.successOrder)
router.route('/verify-payment')
    .post(userAuthentication,userBuyController.verifyPayment)



module.exports = router;     