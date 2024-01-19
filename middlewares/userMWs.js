const jwt = require('jsonwebtoken')
const {UserModel}= require('../model/usersModel')

const userAuthentication = async (req,res,next)=>{
    // try{
        const token = req.cookies.userAccessToken;
        
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
                    res.render('./user/home')
                }
            } catch (error) {
                console.log('hmmm....expired token',error.name);
                if(error.name == 'TokenExpiredError'){
                    res.clearCookie("userAccessToken");
                    res.clearCookie('userId')
                    res.clearCookie('cartQty')
                    req.session.destroy();
                    res.redirect('/')
                    // res.render('./user/userLogin')
                }
            }
           
        }else{
            console.log('User is not logged in');
            let message = req.flash("message");
            
            if(req.path === '/login') return res.render('./user/userLogin',{message});
            if(req.path === '/register') return res.render('./user/userRegister');            
            res.render('./user/home');
        }
    // }catch(err){
    //     console.log('error from admin Auth: ',err) 
    // }
}

module.exports = {
    userAuthentication
}