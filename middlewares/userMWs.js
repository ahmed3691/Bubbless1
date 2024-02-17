const jwt = require('jsonwebtoken')
const {UserModel}= require('../model/usersModel');
const{ProductModel} = require('../model/productModel')

const userAuthentication = async (req,res,next)=>{

        const token = req.cookies.userAccessToken;
        const products = await ProductModel.find({}).limit(8).populate('appliedOffer')
        if(token ){
            try {
                console.log('User Authentication checking......')
                const decode = jwt.verify(token,process.env.JWT_ACCESS_SECRET);
                const user = await UserModel.findById(decode?.userId).select('-password');
                if(user){
         
                    req.user = user._id;
                    req.userEmail = user.userEmail;
                    req.userName= user.userName;
                    console.log('User is already logged in');
                    next(); 
                }else{
                    console.log('Token exist, but User credentials doesnot match')
                    res.render('./user/home',{products})
                }
            } catch (error) {
                console.log('hmmm....expired token',error);
                if(error.name == 'TokenExpiredError'){
                    res.clearCookie("userAccessToken");
                    res.clearCookie('userId')
                    res.clearCookie('cartQty')
                    req.session.destroy();
                    res.redirect('/');
                }
            }
           
        }else{
            console.log('User is not logged in');
            let message = req.flash("message");
            
            if(req.path === '/login') return res.render('./user/userLogin',{message});
            if(req.path === '/register') return res.render('./user/userRegister');            
            res.render('./user/home',{products});
        }
}

module.exports = {
    userAuthentication
}