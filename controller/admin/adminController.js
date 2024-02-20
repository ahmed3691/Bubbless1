const {AdminModel} = require('../../model/adminModel')
const {PaymentModel} = require('../../model/paymentModel');
const {OrdersModel} = require('../../model/ordersModel');
const {ProductModel} = require('../../model/productModel')
const jwt = require("jsonwebtoken")

const sendAdminPanel = async (req,res)=>{

    const analytics = await OrdersModel.aggregate([
        {$group:{
            _id:null,
            totalRevenue:{
                $sum:{
                    $cond:[
                        {$eq:['$paymentStatus','Completed']},
                        '$totalPrice',
                        0
                    ]
                }
            },
            totalOrders:{$sum:1},
            productsSold:{
                $sum:{
                    $sum:{
                        $map:{
                            input:'$products',
                            as:'product',
                            in:'$$product.quantity'
                        }
                    }
                }
            }
        }}
    ]);
    const allOrders = await OrdersModel.find({}).limit(5);


    res.render('./admin/dashboard',{analytics,allOrders})
}

const adminLogin = (req,res)=>{
    if(req.cookies.adminAccessToken) return res.redirect('/admin')
    res.render("./admin/adminLogin")
}

const adminLogout = (req,res)=>{
    res.clearCookie('adminAccessToken')
    res.redirect('/admin')
}

const adminPanel =async (req,res)=>{

    const {adminName,password}= req.body;
    const admin = await AdminModel.findOne({adminName:adminName})
    if(admin && admin.password == password){
        req.session.admin = admin.adminName
        const adminId = admin._id;
        const accessToken = jwt.sign({adminId}, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });
        console.log(accessToken)
        // const refreshToken = jwt.sign({userEmail : userEmail},process.env.JWT_REFRESH_SECRET,{expiresIn: "7d"})
        await AdminModel.updateOne({adminName:adminName},{$set:{accessToken: accessToken}})
        res.cookie('adminAccessToken',accessToken,{
            httpOnly : true,
            maxAge : 1 * 24 * 60 * 60 * 1000
        })
       
        res.redirect('/admin')
    }else{
        res.send('You are not authorized to access this page')
    }
}

const analytics = async (req,res)=>{
   
    const ordersAnalytics = await OrdersModel.aggregate([
        {
            $facet:{
                totalOrders:[
                    {
                        $group: {
                            _id: { $dayOfMonth: "$createdAt" },
                            orders: { $sum: 1 }
                        }     
                    },
                    {$sort:{_id:1}}
                ],
                deliveredOrders:[
                    {
                        $match:{status:'Delivered'}
                    },
                    {
                        $group:{
                            _id:{$dayOfMonth:'$completionDate'},
                            orders:{$sum:1}
                        }
                    },
                    {$sort:{_id:1}}
                ],
                cancelledOrders:[
                    {
                        $match:{status:'Cancelled'},
                    },
                    {
                        $group:{
                            _id:{$dayOfMonth:'$completionDate'},
                            orders:{$sum:1}
                        }
                    },
                    {$sort:{_id:1}}              
                ],
                returnedOrders:[
                    {
                        $match:{status:'Returned'}
                    },
                    {
                        $group:{
                        _id:{$dayOfMonth:"$completionDate"},
                        orders:{$sum:1}
                        }
                    },
                    {$sort:{_id:1}}
                ],
                pendingOrders:[
                    {
                        $match:{status:'Pending'}
                    },
                    {
                        $group:{
                            _id:{$dayOfMonth:'$createdAt'},
                            orders:{$sum:1}
                        }
                    },
                    {$sort:{_id:1}}
                ]
            }   
         }
    ]);

    const analytics = await OrdersModel.aggregate([
        {$group:{
            _id:{$month:'$createdAt'},
            totalRevenue:{
                $sum:{
                    $cond:[
                        {$eq:['$paymentStatus','Completed']},
                        '$totalPrice',
                        0
                    ]
                }
            },
            totalOrders:{$sum:1},
            productsSold:{
                $sum:{
                    $sum:{
                        $map:{
                            input:'$products',
                            as:'product',
                            in:'$$product.quantity'
                        }
                    }
                }
            }
        }}
    ]);
    console.log(analytics);
    const inventory = await ProductModel.aggregate([
    {
        $group:{
            _id:'$category',
            totalProducts:{
                $sum : '$stockQty'
            }
        }
    },
    {
        $sort:{_id:1}
    }
   ])


    function ordersArray(orders){
        let orderArray  = Array.from({length:(new Date).getDate()},(_,index)=>{
            const orderDate = orders.find((order)=> order._id === index+1);
            return orderDate ? orderDate.orders : 0;
        })
 
        return orderArray;
    }
    const placedOrders = ordersArray(ordersAnalytics[0].totalOrders)
    const deliveredOrders = ordersArray(ordersAnalytics[0].deliveredOrders);
    const cancelledOrders = ordersArray(ordersAnalytics[0].cancelledOrders);
    const returnedOrders  = ordersArray(ordersAnalytics[0].returnedOrders);
    const pendingOrders  = ordersArray(ordersAnalytics[0].pendingOrders)
    // console.log('placed orders',placedOrders);
    // console.log('delveredOrders',deliveredOrders)
    // console.log('cancelledOrders',cancelledOrders)
    // console.log('returndeOrders',returnedOrders)
    // console.log('pendingOrders',pendingOrders)

    res.send({
        placedOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        pendingOrders,
        inventory,
        analytics
    }) 
}



module.exports ={
    adminLogin,
    adminPanel,
    adminLogout,
    sendAdminPanel,
    analytics
}