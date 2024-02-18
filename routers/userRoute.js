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
const refferalController = require('../controller/user/refferalController')

const {userAuthentication,fetchHeaderElements} = require('../middlewares/userMWs');
const {ejsError} = require('../middlewares/errorMW')
const userBuyController = require('../controller/user/userPurchaseController');
const wishlistController = require('../controller/user/wishlistController');

const { route } = require("./adminRoute");


router.use(fetchHeaderElements)

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
    .post(userAuthentication,userController.changePassword);
router.route('/reset-password-email')
    .get(userController.sendResetPasswordEmail)
    .post(userController.resetPasswordOtp)
router.route('/send-OTP')
    .post(userController.sendOTP);
router.route('/reset-password')
    .post(userController.resetPassword)

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
    .get(userAuthentication,userDataController.getUserProfile);
router.route('/user-address')
    .get(userAuthentication,userDataController.getAdress)
    .post(userAuthentication,userDataController.addAdress);
router.route('/delete-adress/:id')
    .get(userAuthentication,userDataController.deleteAddress);
router.route('/edit-address/:id')
    .get(userAuthentication,userDataController.getEditAdress)
    .post(userAuthentication,userDataController.editAddress);

//user cart.................................................
router.route('/user-cart')
    .get(userAuthentication,userDataController.getUserCart)
router.route('/add-to-cart/:productId')
    .all(userAuthentication,userDataController.addToCart);
router.route('/remove-from-cart/:productId')
    .all(userAuthentication,userDataController.removeFromCart)
router.route('/edit-cart-quantity/:productId/:productQuantity')
    .get(userAuthentication,userDataController.editCartQuantity);

//user wishlist..........................................

router.route('/wishlist')
    .get(userAuthentication,wishlistController.getWishlist)
    .post(userAuthentication,wishlistController.addToWishlist)
    .delete(userAuthentication,wishlistController.removeFromWishlist);
//user wallet........................................................

router.route('/wallet-transactions')
    .get(userAuthentication,userDataController.walletTransactions);
router.route('/wallet')
    .get(userAuthentication,userDataController.getWallet);
router.route('/razorpay-request')
    .post(userAuthentication,userDataController.sendRazorpayRequestForWallet);
router.route('/verify-wallet-deposit')
    .post(userAuthentication,userDataController.walletDeposit);

// user order management.............................................

router.route('/orders')
    .get(userAuthentication,userDataController.userOrders);
router.route('/order-details/:id')
    .get(userAuthentication,userDataController.orderDetails);
router.route('/return-order/:id')
    .post(userAuthentication,userDataController.returnOrder);
router.route('/cancel-order/:id')
    .post(userAuthentication,userBuyController.cancelOrder);


//user checkout and Payment options.......................................

router.route('/checkout/:id')
    .all(userAuthentication,userBuyController.getChekout);
router.route('/place-order')
    .post(userAuthentication,userBuyController.orderConfirmation);

router.route('/order-success')
    .get(userAuthentication,userBuyController.successOrder);
router.route('/verify-payment')
    .post(userAuthentication,userBuyController.verifyPayment);

//refferal

router.route('/refferal-code')
    .patch(userAuthentication,refferalController.createRefferalCode);
router.route('/user-signup/:refferalCode')
    .get(refferalController.refferalSignup);

//all other rouuts

router.route('*')
    .get((req,res)=>{
        res.render('./user/404')
    })

router.use(ejsError)




module.exports = router;     