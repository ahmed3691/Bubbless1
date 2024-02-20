const pdf = require("pdf-creator-node");
const fs = require('fs');
const {OrdersModel} = require('../../model/ordersModel');
const {PaymentModel} = require('../../model/paymentModel');
const path = require("path");
const {options} = require('../../config/adminConfig');

const salesReport = (req,res)=>{
    res.render('./admin/salesReport')
}

const salesData = async (req,res)=>{
    
    let from = new Date(req.params.from);
    let to = new Date(req.params.to);
    from.setHours(0,0,0,1);
    to.setHours(23,59,59,999);
    
    const report = fs.readFileSync(path.join(__dirname,'../../views/admin/downloadReport.html'),'utf-8');
    const fileName = Date.now() + 'Report' +  '.pdf';
    const orders = await OrdersModel.find({createdAt:{$gte: from ,$lt: to}}).populate('products.productId');

    const summary = orders.reduce((acc,curr)=>{
        acc.totalRevenue += curr.totalPrice;
        acc.productsSold += curr.products.length;
        return acc;
    },{totalRevenue:0,productsSold:0});

    let salesDetails = [];
    orders.forEach((order)=>{
        let obj = {
            orderId: order.orderId,
            deliveryAddress: order.deliveryAddress,
            products: order.products.reduce((acc,curr)=>{
                acc+= curr.productId.productName+', '
                return acc
            },'').replace(/,\s*$/, ''),
            totalPrice: order.totalPrice,
            productsCount: order.products.length,
            orderDate: new Date(order.createdAt),
            paymentMethod: order.paymentMethod
        }
        salesDetails.push(obj);
    });
    
    const document = {
        html: report,
        data:{
            orders:salesDetails,
            summary:summary,
            date:{
                from:from,
                to:to
            }
        },
        path: './public/admin/docs/' + fileName
    }

     pdf.create(document, options)
        .then((res) => {
            console.log(res);
        })
        .catch((error) => {
            console.error(error);
        });

    res.send({orders,summary,fileName})
}



const getTransactions = async (req,res)=>{
    try {
        const pageNumber = req.params.pageNumber;
        const transactionsPerPage = 10;
        const totalPages =  Math.ceil(await( PaymentModel.countDocuments(
            {
                paymentFor:{$in:['Wallet Credit','Product Purchase']},
                paymentIntitatedFor:{$in:['Placed Order','Money added to wallet']},
                status:'success'
            }
        ))/transactionsPerPage);

        console.log('total page: ',totalPages)
        
        const transactions =  await PaymentModel.find(
            {
                paymentFor:{$in:['Wallet Credit','Product Purchase']},
                paymentIntitatedFor:{$in:['Placed Order','Money added to wallet']},
                status:'success'
            }
        )
        .sort({createdAt:-1})
        .skip(pageNumber*transactionsPerPage)
        .limit(transactionsPerPage)
        console.log(transactions)
        res.render('./admin/transactions',{transactions,pageNumber,totalPages})
    } catch (error) {
        console.log(error)
        res.render('./admin/404')
    }
}

module.exports ={
    salesReport,
    salesData,
    getTransactions
}