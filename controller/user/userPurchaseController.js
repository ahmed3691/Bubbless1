const { ProductModel } = require("../../model/productModel");
const { CartModel } = require("../../model/cartModel");
const { generateOrderId,placeOrder, razorPayRequest } = require("../../config/userConfig");
const { updateStock,confirmPayment } = require("../../config/userDBHelpers");
const { AddressModel } = require("../../model/addressModel");
const {PaymentModel}  = require('../../model/paymentModel');
const {OrdersModel} = require("../../model/ordersModel");
const {WalletModel} = require('../../model/walletModel')
const crypto = require("crypto");
const { response } = require("express");
const { truncate } = require("fs");
const { errorMonitor } = require("events");
const { CouponModel } = require("../../model/couponModel");
const {UserModel} = require('../../model/usersModel');
const { default: mongoose } = require("mongoose");

// await placeOrder(formData,userId,userName,orderId);

const getChekout = async (req, res) => {
    try {
        console.log(req.body)
        const {productQty,selectedCoupon} = req.body;
        const isAuthenticated = req.cookies.userAccessToken || false;
        const userId = req.user;

        let user = await UserModel.findOne({_id:userId})
        const usedCoupons = user.usedCoupons;
        
        if( user?.refferalCompleted !== 0){
            var coupons = await CouponModel.find({_id:{$nin:usedCoupons}})
        }else{
            var coupons = await CouponModel.find({_id:{$nin:usedCoupons},couponType:"General"})
        }
        
        
        // cart checkout.........................
        const cartId = req.params.id;
        const userCart = await CartModel.findOne({ _id: cartId }).populate(
            "items.productId",
        );
        
        
        const userWallet = await WalletModel.findOne({userId})
        //single product checkout.................................
        const cartQty = req.cookies.cartQty;
        const productId = req.params.id;
  
        const product = await ProductModel.findOne({ _id: productId });
        const savedAddress = await AddressModel.findOne(
            { userId: userId },
            { "addresses._id": 0, "addresses.isDefault": 0 },
        );
        res.render("./user/checkout", {
            isAuthenticated,
            cartQty,
            savedAddress,
            productQty,
            product,
            userCart,
            userWallet,
            coupons
        });
    } catch (err) {
        console.log(err);
        res.render('./user/404')
    }
};

const orderConfirmation = async (req, res) => {
    try {
        const {paymentMethod,totalPrice,selectedCoupon} = req.body 
        
        
        const userId = req.user;
        async function manageCoupon(selectedCoupon){
            if(selectedCoupon){
                const coupon = await CouponModel.findOne({_id:new mongoose.Types.ObjectId(selectedCoupon)})
                if(coupon.couponType != 'Refferal'){
                    const updateUser = await UserModel.updateOne(
                        {_id:userId},
                        {$push:{usedCoupons: new mongoose.Types.ObjectId(selectedCoupon)}}
                        )
                console.log('coupon used');
                }else{
                    const updateUser = await UserModel.updateOne({_id:userId},{$inc:{refferalCompleted:-1}})
                }
            }
        }
        
        const userName = req.userName;
        if(paymentMethod == 'Online Payment'){
            const orderId = generateOrderId();
            razorPayRequest(orderId, parseInt(totalPrice))
                .then(async response=>{
                    const newPayment = new PaymentModel({
                        userId,
                        paymentFor: 'Product Purchase',
                        paymentIntitatedFor:'Placed Order',
                        ...response              
                    });
                    await manageCoupon(selectedCoupon)
                 newPayment.save()
                    .then(()=>res.json(response))
                    .catch(()=>res.json(response))                             
                })
                .catch((err)=>{
                    console.log(err)
                    res.status(500)
                })   
        }else{
            const orderId = generateOrderId();
            const orderPlace = await placeOrder(req.body,userId,userName,orderId);
            console.log('orderPlaced',orderPlace)
            if(!orderPlace) return res.json({COD:false})
            await manageCoupon(selectedCoupon);
            res.json({ COD: true });
        }
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }
};

const verifyPayment = async  (req,res)=>{
    try {
        const {payment,order,formData} = req.body;
        const userId = req.user;
        const userName = req.userName;
  
        if(payment.error){
            return res.json({payment_failed: true})
        }
        if(payment.razorpay_payment_id){
            try {
                const orderId = order.receipt;
                confirmPayment(orderId,order.amount_due);
                await placeOrder(formData,userId,userName,orderId);
                return res.json({payment_success: true});
            } catch (error) {
                console.log(error);
                res.json({payment_failed: true});
            }      
        }  
    } catch (error) {
        res.send(error);
        res.render('./user/404')
    }
}

const successOrder = (req,res)=>{
    
    try {
        const cartQty = req.cookies.cartQty;
        const isAuthenticated = req.cookies.userAccessToken || false;

        res.render('./user/orderSummary',{isAuthenticated,cartQty});
    } catch (error) {
        res.send(error);
        res.render('./user/404')
    }
    
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user;
    
        const order = await OrdersModel.findOne({ _id: orderId }).populate(
            "products.productId",
        );
        const price = order.totalPrice;
        if (order.status !== "Delivered" && order.status !== "Returned") {
            const updateOrderStatus = await OrdersModel.updateOne(
                { _id: orderId },
                { $set:
                    { status: "Cancelled",completionDate: Date.now()}
                },
            );
            req.flash("message", "Order cancellation is successsfull");
        }
        if(order.paymentMethod == 'Online Payment' || order.paymentMethod == 'Wallet Payment'){
            
            const updateWallet = await WalletModel.updateOne(
                {userId:userId},
                {$inc:{amount:price}},
                {upsert: true});
    
            const newPayment = new PaymentModel({
                userId,
                paymentFor: 'Wallet Credit',
                paymentIntitatedFor:'Cancelled Order',
                entity: 'order',
                amount:price,
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
                console.log('Payment saved for cancelled order');
            })
            .catch((error)=>{
                console.log('Error in saving payment info for cancelled order: ',error)
            })
        }
        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        res.send(error);
        res.render('./user/404')
    }
   
};



module.exports = {
    getChekout,
    placeOrder,
    cancelOrder,
    successOrder,
    verifyPayment,
    orderConfirmation
};
