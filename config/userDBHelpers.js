const { ProductModel } = require("../model/productModel");
const {PaymentModel} = require("../model/paymentModel")
const{OrdersModel} = require('../model/ordersModel');
const {CartModel} = require('../model/cartModel')

const updateStock = async (products) => {
    for (const product of products) {
            let qty = parseInt(product.quantity)
             await ProductModel.updateOne(
            { _id: product.productId },
              { $inc:{ stockQty: -qty}}
            );        
    }
  };

const confirmPayment = async (orderId,amount_paid)=>{
    console.log('payment updating.....')
    const pay = await PaymentModel.updateOne(
      {receipt:orderId},
      {$set:
        {
          amount_paid,
          amount_due:0
        }
      }
      )

    const updateOrder = await OrdersModel.updateOne(
      {orderId:orderId},
      {$set:{paymentStatus:'Completed'}}
    )
    return; 
}
console.log('hi')

module.exports = {
    updateStock, 
    confirmPayment,

}