const pdf = require("pdf-creator-node");
const fs = require('fs');
const {OrdersModel} = require('../../model/ordersModel');
const { getOrders } = require("./adminOrderController");
const path = require("path");
const {options} = require('../../config/adminConfig')

const salesReport = (req,res)=>{
    res.render('./admin/salesReport')
}

const salesData = async (req,res)=>{
    
    let from = new Date(req.params.from);
    let to = new Date(req.params.to);
    console.log('from: ',from,'to: ',to)

    from.setHours(0,0,0,1);
    to.setHours(23,59,59,999);

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    
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
    })

    console.log(salesDetails);
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

    /////////////////////////////////////////////////////////////////////////////////////////////////////////


    console.log(summary)
    res.send({orders,summary,fileName})
}

const generateReport = (req,res) =>{
    const report = fs.readFileSync(path.join(__dirname,'../../views/admin/salesReport.ejs'),'utf-8');
    const fileName = Date.now() + 'Report' +  '.pdf';
    const array = [];


    var options = {
        format: "A3",
        orientation: "portrait",
        border: "10mm",
        header: {
            height: "45mm",
            contents: '<div style="text-align: center;">Sales Report</div>'
        },
        footer: {
            height: "28mm",
            contents: {
                first: 'Cover page',
                2: 'Second page', // Any page number is working. 1-based index
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                last: 'Last Page'
            }
        }
    };

    var data = [
        {
          name: "Shyam",
          age: "26",
        },
        {
          name: "Navjot",
          age: "26",
        },
        {
          name: "Vitthal",
          age: "26",
        },
      ];

    data.forEach((doc)=>{
        const user = {
            name: doc.name,
            age: doc.age
        }
        array.push(user)
    })

    const obj ={
        users: array,
        total: 500
    }

    const document = {
        html: report,
        data:{
            users:obj
        },
        path: './docs/' + fileName
    }
    
     pdf.create(document, options)
        .then((res) => {
            console.log('document created: ',res);
        })
        .catch((error) => {
            console.error('pdf error: ',error);
        });
    
}

module.exports ={
    salesReport,
    salesData
}