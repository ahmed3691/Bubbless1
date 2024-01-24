const {AdminModel} = require('../../model/adminModel')
const jwt = require("jsonwebtoken")
const {OrdersModel} = require('../../model/ordersModel')
const { UserModel } = require('../../model/usersModel')

const getOrders = async (req,res)=>{
    const orders = await OrdersModel.find({})
    console.log(orders)
    res.render('./admin/adminOrders',{orders})
}

const orderDetails = (req,res)=>{

    res.render('./admin/orderDetails')
}

const cancelOrder = async (req,res)=>{
    try{
        const orderId = req.params.id;
        const action = req.params.action;
        const updateOrder = await OrdersModel.updateOne(
            {_id:orderId},
            {$set:{
                status:action,
                completionDate:Date.now()
                }
            },
            {upsert:true}
            );

        res.redirect('/admin/orders')
    }catch(error){
        console.log(error)
    }
   
}

const singleOrder = async  (req,res)=>{
    try {

        const orderId = req.params.id
        const order = await OrdersModel.findOne({_id:orderId}).populate('products.productId')
        const userId = order.userId;
        const user = await UserModel.findOne({_id:userId}).select('-userPassword');
        console.log(order.products) 
        res.render('./admin/singleOrder',{order,user})
        
    } catch (error) {
        console.log(error)
    }
    
}
module.exports ={
    getOrders,
    orderDetails,
    cancelOrder,
    singleOrder
}