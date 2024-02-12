const {OffersModel} = require('../../model/offersModel');
const {SubCatModel} = require('../../model/categoryModel');

const mongoose = require('mongoose');
const { ProductModel } = require('../../model/productModel');


const getOffers = async (req,res)=>{

    try {
        const offers = await OffersModel.find({})
        res.render('./admin/offers',{offers})
    } catch (error) {
        console.log(error)
    }
    
}

const getCreateOffer = async (req,res)=>{
    try {
        const subcategories = await SubCatModel.distinct("subCatName");
        console.log(subcategories);
        const message = req.flash('message');
        req.flash('message','')
        res.render('./admin/createOffer',{subcategories,message})
        
    } catch (error) {
        console.log(error)
    }
    
}

const createOffer = (req,res)=>{
    try {
        const {offerTitle,offerType,percentage,fixedAmount,buy,get,mainCategory,subCategory} = req.body;
    
        const newOffer  = new OffersModel({
            offerTitle,
            offerType,
            percentage,
            fixedAmount,
            buy,
            get
        })

        newOffer.save()
            .then(()=>{
                console.log('offer saved successfully')
            })
            .catch(err=>{
                console.log('error on saving offer',err)
            })
        req.flash('message','Offer addedd successfully')
        res.redirect('back');

    } catch (error) {
        console.log(error)
    }
    
}

const getEditOffer = async (req,res)=>{

    try {
        const offerId = req.params.id;
    
        const offer = await OffersModel.findOne({_id:offerId});
        res.render('./admin/editOffer',{offer})
    } catch (error) {
        console.log(error)
    }
   
}

const editOffer = async (req,res)=>{
    try {
        const {offerId,offerTitle,offerType,percentage,fixedAmount,buy,get} = req.body.formData;
   
        const updateOffer = await OffersModel.updateOne(
            {_id:offerId},
            {$set:{
                offerTitle,
                offerType,
                percentage,
                fixedAmount,
                get,
                buy
            }}
            )
        
        if(updateOffer.modifiedCount == 1){
            res.send({updated: true})
        }else{
            res.send({updated: false})
        }
    } catch (error) {
        console.log(error)
    }
    
   
}

const deleteOffer = async (req,res)=>{
  try {
    const {offerId} = req.body;
    console.log(offerId);
    const deleteOffer = await OffersModel.deleteOne({_id: offerId});
    console.log(deleteOffer);

    if(deleteOffer.deletedCount==1){
        res.send({deleted: true})
    }else{
        res.send({deleted: false})
    }
    
  } catch (error) {
    console.log(error)
  }
   
}

const getApplyOffer = async (req,res)=>{
    try {
        const offerId = req.params.id;
      
        const categories = await SubCatModel.find({}).sort({category: 1});
        const products = await ProductModel.find()
        
        res.render('./admin/useOffer',{categories,products,offerId})
    } catch (error) {
        console.log(error)
    }
}

const applyOffer = async (req,res)=>{
    try {
        const offerId = req.params.id;
        const{productIds,subCategoryIds,mainCategory} = req.body;
        let offerAppliedFor;
        let key;
        let values=[];
        const offer = await OffersModel.findOne({_id:offerId});
      
        const offerType = offer.offerType;
        const offerValue = offer.offerType == 'percentage' ? (offer.percentage)/100 : offer.fixedAmount;
        
        if(productIds){
            key = '_id'
            values = Array.isArray(productIds) ?
                productIds.map(id=> new mongoose.Types.ObjectId(id)) :
                [new mongoose.Types.ObjectId(productIds)];
            offerAppliedFor = 'products'
        } else if(subCategoryIds){
            key = 'subCategoryId';
            values = Array.isArray(subCategoryIds) ?
                subCategoryIds.map(id=> new mongoose.Types.ObjectId(id)) :
                [new mongoose.Types.ObjectId(subCategoryIds) ];
            offerAppliedFor = 'subCategory';
        } else if(mainCategory){
            key = 'category';
            values = Array.isArray(mainCategory) ? mainCategory : [mainCategory];
            offerAppliedFor = 'mainCategory'
        } else {
            console.log('no IDs received')
        }
        console.log(key,values)

        const applyOffer = await ProductModel.aggregate([
            {$match:{[key]:{$in:values}}},
            {$set:{appliedOffer:new mongoose.Types.ObjectId(offerId)}},
            {$addFields:{
                offerPrice:{
                    $cond:{
                        if:{$eq:[offerType,'fixedAmount']},
                        then:{$subtract:['$price',offerValue]},
                        else:{$subtract:['$price',{$multiply:['$price',offerValue]}]}
                    }
                }
            }},
            {$merge:{
                into:'products',
                on: '_id',
                whenMatched:'merge'
            }}
        ]);

        const updateOffer = await OffersModel.updateOne({_id:offerId},{$set:{offerAppliedFor}},{upsert:true})
        res.redirect('/admin/offers')

    } catch (error) {
        console.log(error);
    }
    
}

const removeOffer = async (req,res)=>{
    try {
        const offerId = req.params.id;
        console.log(offerId)
        const produt = await ProductModel.find({appliedOffer: new mongoose.Types.ObjectId(offerId)})
        console.log(produt)
        const removeOffer = await ProductModel.updateMany(
            {appliedOffer:new mongoose.Types.ObjectId(offerId)},
            {$unset:{appliedOffer:'',offerPrice:''}}
        );
        console.log(removeOffer);
        await OffersModel.updateOne({_id:offerId},{$set:{offerAppliedFor:null}});
        res.redirect('/admin/offers')
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getOffers,
    getCreateOffer,
    createOffer,
    getEditOffer,
    editOffer,
    deleteOffer,
    getApplyOffer,
    applyOffer,
    removeOffer
}