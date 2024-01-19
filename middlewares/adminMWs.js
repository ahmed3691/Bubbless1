const jwt = require('jsonwebtoken')
const {AdminModel}= require('../model/adminModel')

const adminAuth = async (req,res,next)=>{
    try{
        const token = req.cookies.adminAccessToken;
        
        if(token ){
            console.log('admin authenetication')
            const decode = jwt.verify(token,process.env.JWT_ACCESS_SECRET);
            const admin = await AdminModel.findById(decode?.adminId).select('-password');
            if(admin){
                req.admin = admin;
                next();
            }else{
            res.redirect('/admin/login')
            }
        }else{
            
            res.redirect('/admin/login')
        }
    }catch(err){
        console.log('error from admin Auth: ',err) 
    }
    
}



module.exports = {
    adminAuth
}