const {AdminModel} = require('../../model/adminModel')
const jwt = require("jsonwebtoken")

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

const sendAdminPanel = (req,res)=>{
    res.render('./admin/dashboard')
}

module.exports ={
    adminLogin,
    adminPanel,
    adminLogout,
    sendAdminPanel
}