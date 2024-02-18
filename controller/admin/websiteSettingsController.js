const {BannerModel} = require('../../model/adminBannerModel');
const fs = require('fs');
const path = require('path')

const getBanners =  async (req,res)=>{
    try {
        const banners = await BannerModel.findOne({});
        console.log(banners)
        res.render('./admin/banner',{banners})
    } catch (error) {
        console.log(error);
        res.render('./admin/404')
    }
    
}

const editBanner = async (req,res)=>{

    console.log(req.files.bannerImage);
    const banners = await BannerModel.findOne({})
    let newImagePath= banners.images;
    for(let i=0;i<req.files.bannerImage.length;i++){
        let imagePath = path.join(__dirname,'../../public',banners.images[i]);
        console.log(imagePath);
        fs.unlink(imagePath,(err)=>{
          if(err){
            console.log( 'error deleting image',err);
            return;
          }
        })
        newImagePath[i] = '/admin/uploads/'+req.files.bannerImage[i].filename;
      }

    await BannerModel.updateOne({},{
        images:newImagePath
    })

    res.redirect('/admin/banners')
}
module.exports = {
    getBanners,
    editBanner
}