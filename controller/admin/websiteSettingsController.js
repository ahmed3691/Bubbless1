const {BannerModel} = require('../../model/adminBannerModel')

const getBanners =  async (req,res)=>{
    const banners = await BannerModel.findOne({});
    res.render('./admin/banner')
}

const editBanner = async (req,res)=>{

    console.log(req.files.bannerImages)
    // await BannerModel.insertOne({
    //     images: imagePath
    // })
}
module.exports = {
    getBanners,
    editBanner
}