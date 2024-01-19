const { ProductModel } = require("../../model/productModel");
const { SubCatModel, CatModel } = require("../../model/categoryModel");
const { CartModel } = require("../../model/cartModel");
const { generateOrderId,placeOrder, razorPayRequest } = require("../../config/userConfig");
const { updateStock,confirmPayment } = require("../../config/userDBHelpers");
const { AddressModel } = require("../../model/addressModel");
const {PaymentModel}  = require('../../model/paymentModel')
const OrdersModel = require("../../model/ordersModel");
const crypto = require("crypto");
const { response } = require("express");
const { truncate } = require("fs");
const { errorMonitor } = require("events");

// await placeOrder(formData,userId,userName,orderId);

const getChekout = async (req, res) => {
    try {
        const isAuthenticated = req.cookies.userAccessToken || false;
        const userId = req.user;
        // cart checkout.........................
        const cartId = req.params.id;
        const userCart = await CartModel.findOne({ _id: cartId }).populate(
            "items.productId",
        );
        //single product checkout.................................
        const cartQty = req.cookies.cartQty;
        const productId = req.params.id;
        const productQty = req.body.productQty;
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
        });
    } catch (err) {
        console.log(err);
    }
};

const orderConfirmation = async (req, res) => {
    try {
        const cartQty = req.cookies.cartQty;
        const isAuthenticated = req.cookies.userAccessToken || false;
        const {paymentMethod,totalPrice} = req.body
        const userId = req.user;
        const userName = req.userName;
        console.log('from orderconfirmation======',req.body)
        if(paymentMethod == 'Online Payment'){
            console.log('online payment')
            const orderId = generateOrderId();
            razorPayRequest(orderId, parseInt(totalPrice))
                .then(response=>{
                    console.log('response for saving',response)
                    const newPayment = new PaymentModel({
                        userId,
                        ...response              
                    })
                 newPayment.save()
                    .then(()=>res.json(response))
                    .catch(()=>res.json(response))                             
                })
                .catch((err)=>{
                    console.log(err)
                    res.status(500)
                })   
        }else{
            console.log('cod')
            const orderId = generateOrderId();
            placeOrder(req.body,userId,userName,orderId)
            res.json({ COD: true });
        }
    } catch (error) {
        console.log(error);
    }
};

const verifyPayment = async  (req,res)=>{
    try {
        const {payment,order,formData} = req.body;
        const userId = req.user;
        const userName = req.userName;
        console.log(typeof req.body.formData)
        console.log('form data from verify patment===',req.body)

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
    }
}

const successOrder = (req,res)=>{
    const cartQty = req.cookies.cartQty;
    const isAuthenticated = req.cookies.userAccessToken || false;

    res.render('./user/orderSummary',{isAuthenticated,cartQty});
}

const cancelOrder = async (req, res) => {
    const orderId = req.params.id;

    const order = await OrdersModel.findOne({ _id: orderId }).populate(
        "products.productId",
    );
    if (order.status !== "Delivered" && order.status !== "Returned") {
        const updateOrderStatus = await OrdersModel.updateOne(
            { _id: orderId },
            { $set: { status: "Cancelled" } },
        );
        req.flash("message", "Order cancellation is successsfull");
    }
    res.redirect(`/order-details/${orderId}`);
};



module.exports = {
    getChekout,
    placeOrder,
    cancelOrder,
    successOrder,
    verifyPayment,
    orderConfirmation
};
