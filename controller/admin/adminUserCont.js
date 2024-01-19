const {UserModel} = require('../../model/usersModel')

const getUsers = async (req,res) =>{
    try{
        const allUsers =  await UserModel.find({})
        res.render('./admin/usersInfo',{allUsers:allUsers})
    }catch(err){
        console.log(err)
    } 
}

const blockUser = async (req,res)=>{
    try{
        userToBLock = req.query.userEmail;
        
        const blockUser = await UserModel.updateOne({userEmail: userToBLock},{$set:{isBlocked:true}})
        res.redirect('/admin/users')
    }catch(error){
        console.log(err)
    }
}

const unblockUser = async(req,res)=>{
    try{
        userToUnblock = req.query.userEmail;
       
        const unblockUser = await UserModel.updateOne({userEmail: userToUnblock},{$set:{isBlocked:false}})
        res.redirect('/admin/users')
    }catch(error){
        console.log(err)
    }
}

module.exports ={
    getUsers,
    blockUser,
    unblockUser
}