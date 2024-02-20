const jwt = require('jsonwebtoken')
const {UserModel}= require('../model/usersModel');
const {ProductModel} = require('../model/productModel');
const {BannerModel} = require('../model/adminBannerModel');
const {CatModel,SubCatModel} = require('../model/categoryModel');

const userAuthentication = async (req,res,next)=>{

        const token = req.cookies.userAccessToken;
        const products = await ProductModel.find({}).limit(8).populate('appliedOffer');
        const banners = await BannerModel.findOne({})
        if(token ){
            try {
               
                const decode = jwt.verify(token,process.env.JWT_ACCESS_SECRET);
                const user = await UserModel.findById(decode?.userId).select('-password');
                if(user){
         
                    req.user = user._id;
                    req.userEmail = user.userEmail;
                    req.userName= user.userName;
                  
                    next(); 
                }else{
                    res.render('./user/userLogin')
                }
            } catch (error) {
                console.log('hmmm....expired token',error);
                if(error.name == 'TokenExpiredError'){
                    res.clearCookie("userAccessToken");
                    res.clearCookie('userId')
                    res.clearCookie('cartQty')
                    req.session.destroy();
                    res.render('/user/userLogin')
                }
            }
           
        }else{
            
            let message = req.flash("message");
            
            if(req.path === '/login') return res.render('./user/userLogin',{message});
            if(req.path === '/register') return res.render('./user/userRegister');            
            // res.render('./user/home',{products,banners});
            res.render('./user/userLogin')
        }
}

const fetchHeaderElements = async (req,res,next)=>{
    try {
        const categories = await SubCatModel.aggregate([
            {
                $facet:{
                    boys:[
                        {$match:{category:'Boys'}},
                        {$group:{_id:'$subCatName'}},
                        {$project:{_id:0,category:"$_id"}}
                    ],
                    girls:[
                        {$match:{category:'Girls'}},
                        {$group:{_id:'$subCatName'}},
                        {$project:{_id:0,category:'$_id'}}
                    ],
                    unisex:[
                        {$match:{category:'Unisex'}},
                        {$group:{_id:'$subCatName'}},
                        {$project:{_id:0,category:'$_id'}}
                    ]
                }
            },
            
        ]);
        
        res.locals.categories = categories[0]
        next();
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }
}


module.exports = {
    userAuthentication,
    fetchHeaderElements
}