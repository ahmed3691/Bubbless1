const { response } = require('express')
const {SubCatModel,CatModel} = require('../../model/categoryModel')
const { ProductModel } = require("../../model/productModel");

const viewCat = async (req,res)=>{
    const categoryToDisplay = req.query.mainCategory ?? "All";
    let subCategory;
    if(categoryToDisplay == "All"){
        subCategory = await SubCatModel.find({});
    }else{
        subCategory = await SubCatModel.find({category:categoryToDisplay})
    }
    res.render('./admin/categoryList',{subCategory:subCategory})
}

const sendAddCat = async (req,res)=>{
    let message = req.session.message
    req.session.message=''
    console.log(message)
    res.render('./admin/addCategory',{message})
}

const addCat = async (req,res)=>{
    console.log('add category')
    let {subCategory,categoryDescription,mainCategory} = req.body;
    let mainCategoryId = await CatModel.findOne({catName:mainCategory}).select('_id')
    let categoryExists = await SubCatModel.findOne({
        subCatName:{ $regex: new RegExp(subCategory, 'i') },
        category:{ $regex: new RegExp(mainCategory, 'i') }
    })
    
    if(categoryExists){
        req.session.message = "This category already exists";
        return res.redirect('/admin/add-category')
    } 
    let newCategory = new SubCatModel({
        subCatName : subCategory,
        category: mainCategory,
        catId:mainCategoryId,
        catDesc : categoryDescription
    })
    
    newCategory.save().then(()=>{
        console.log(`${newCategory.subCatName} is saved`)
        res.redirect('/admin/categories');
    }).catch((err)=>{
        console.log(err)
    })
}

const listCat = async (req,res)=>{
    try{
        const {subCategoryId} = req.query;
        const subCat = await SubCatModel.updateOne({_id: subCategoryId},{$set:{isListed:true}})
        const prod = await ProductModel.updateMany({subCategoryId:subCategoryId},{$set:{isListed:true}})
        if(subCat.matchedCount){
            console.log("subCategory listed");
            res.redirect('/admin/categories')
        }else{
            console.log('subCat listing failed')
        }
    }
    catch(err){
        console.log(err)
    }
}

const unlistCat = async (req,res)=>{
    try{
        // console.log(req.query.subCatId)
        const {subCatId} = req.query
        const subCat = await SubCatModel.updateOne({_id: subCatId},{$set:{isListed:false}})
        const prod = await ProductModel.updateMany({subCategoryId:subCatId},{$set:{isListed:false}})
        console.log(subCat)
        if(subCat.matchedCount){
            console.log("subCategory Unlisted");
            res.redirect('/admin/categories')
        }else{
            console.log('subCat unlisting failed')
        }
    }
    catch(err){
        console.log(err)
    }
} 

const deleteCat = async (req,res)=>{
    try{

    }
    catch(err){
        console.log(err)
    }
}
const sendEditCategory = async(req,res)=>{
    try{
        let message = req.session.message
        req.session.message = ''
        subCatId= req.query.subCatId ?? req.session.subCatId;
        const subCat = await SubCatModel.findOne({_id:subCatId})
        console.log(subCat)
        res.render('./admin/editCategory',{subCat:subCat,message})
    }
    catch(err){
        console.log(err)
    }
}
const editCat = async (req,res)=>{
    try{
       const {subCatId,productCat,catName,catDesc} = req.body
       
       console.log(catName,productCat)
       let subCategory = await SubCatModel.findOne({
        _id:{ $ne: subCatId },
        subCatName: { $regex: new RegExp(`^${catName}$`, 'i') },
        category: { $regex: new RegExp(`^${productCat}$`, 'i') }
      });
       console.log(subCategory)
       if(subCategory){
        req.session.subCatId = subCatId;
        req.session.message = "This category already exists"
        console.log(' editing category already exist')
        return res.redirect('/admin/edit-category')
       } 
       const upProdcat = await ProductModel.updateMany({subCategoryId:subCatId},{$set:{category:productCat,subCategory:catName}})
       const upCat = await SubCatModel.updateOne({_id:subCatId},{$set:{subCatName:catName,category:productCat,catDesc:catDesc}})
       console.log(upProdcat)
       res.redirect('/admin/categories')
    }
    catch(err){
        console.log(err)
    }
}


module.exports = {
    viewCat,
    sendAddCat,
    addCat,
    listCat,
    unlistCat,
    editCat,
    deleteCat,
    sendEditCategory
}