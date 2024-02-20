const {UserModel} = require('../../model/usersModel');
const {WishlistModel} = require('../../model/wishlistModel');
const { getUserId, getCartQty } = require("../../config/userConfig");
const mongoose = require('mongoose')


const getWishlist = async (req,res)=>{
    try {
        const userId = req.user;
        const isAuthenticated = req.cookies.userAccessToken || false;
        const cartQty = await getCartQty(userId);
        
        const wishlist = await WishlistModel.findOne({userId}).populate('products');
        console.log(wishlist.products)
        res.render('./user/wishlist',{
            isAuthenticated,
            cartQty,
            wishlist:wishlist.products
        })
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }
}

const addToWishlist = async (req,res)=>{
    try {
        const userId = req.user;
        console.log(req.body)
        const {productId} = req.body;
        const updateWishlist = await WishlistModel.updateOne(
            {userId},
            {$addToSet:{products:new mongoose.Types.ObjectId(productId)}},
            {upsert:true}
            )
        res.send({added:true})
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }

}

const removeFromWishlist =  async(req,res)=>{
    try {
        console.log('removing')
        const userId = req.user;
        const {productId} = req.body;
        const updateWishlist = await WishlistModel.updateOne(
            {userId},
            {$pull:{products: new mongoose.Types.ObjectId(productId)}}
        )
        res.send({deleted:true})
    } catch (error) {
        console.log(error);
        res.render('./user/404')
    }
}

const contact = async (req,res)=>{
    const userId = req.user;
    const isAuthenticated = req.cookies.userAccessToken || false;
    const cartQty = await getCartQty(userId);

    res.render('./user/contact',{isAuthenticated,cartQty})
}

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    contact
}