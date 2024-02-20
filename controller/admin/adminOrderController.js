const {AdminModel} = require('../../model/adminModel')
const jwt = require("jsonwebtoken")
const {OrdersModel} = require('../../model/ordersModel')
const { UserModel } = require('../../model/usersModel')

const getOrders = async (req,res)=>{
    const pageNumber = parseInt(req.params.pageNumber);
    const ordersPerPage = 6;
    console.log(pageNumber);
    const totalPages =  Math.ceil(await( OrdersModel.countDocuments())/ordersPerPage)
    const orders = await OrdersModel.find({})
        .skip(pageNumber* ordersPerPage).
        limit(ordersPerPage)
        .sort({createdAt:-1})

    res.render('./admin/adminOrders',{orders,totalPages,pageNumber})
}



const editOrderStatus = async (req,res)=>{
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
        if(action == 'Delivered'){
            await OrdersModel.updateOne({_id:orderId},{$set:{paymentStatus:'Completed'}})
        }

        res.redirect('back')
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
    editOrderStatus,
    singleOrder
}