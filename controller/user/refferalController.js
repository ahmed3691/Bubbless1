const bcrypt = require("bcrypt");
const {UserModel} = require('../../model/usersModel');
const SHA256 = require('crypto-js/sha256');

const createRefferalCode = async (req,res)=>{
    try {
        
        const userId = req.user;
        const hashKey = userId.toString();
        const code = SHA256(hashKey).toString()
        const refferalCode = code.substring(0,10)
        console.log(refferalCode);
        await UserModel.updateOne({_id:userId},{$set:{refferalCode}},{upsert:true});
        res.send({refferalCode});
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }
    
}

const refferalSignup = async (req,res) =>{
    try {
        const refferalCode = req.params.refferalCode;
       
        console.log(refferalCode)
        res.render('./user/userRegister',{refferalCode})
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }
}

module.exports = {
    createRefferalCode,
    refferalSignup
}