const { ProductModel } = require("../../model/productModel");
const { SubCatModel, CatModel } = require("../../model/categoryModel");
const { get } = require("../../routers/userRoute");
const { CartModel } = require("../../model/cartModel");
const { getUserId, getCartQty,getFilters } = require("../../config/userConfig");
const {CouponModel} = require('../../model/couponModel');
const { UserModel } = require("../../model/usersModel");
const {WishlistModel} = require('../../model/wishlistModel')



const viewAllProducts = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = getUserId(req.cookies.userAccessToken)
    const searchKey = req.query.searchKey;
    const catName =  {$exists:true}
    const subCatName =  {$exists:true} 
    const wishlist = await WishlistModel.findOne({userId})
    const pageNumber = parseInt(req.params.pageNumber || 0);
    const productsPerPage = 6;

    const totalPages = Math.ceil(await (ProductModel.countDocuments({
      isListed: true,
      productName: { $regex: new RegExp(searchKey, 'i') }
    })) / productsPerPage);

    const allProducts = await ProductModel
      .find({
        isListed: true,
        productName: { $regex: new RegExp(searchKey, 'i') },
        stockQty: { $gt: 0 }
      })
      .skip(pageNumber * productsPerPage)
      .limit(productsPerPage)
      .populate('appliedOffer');
    
    const userCart = await CartModel.find({ userId: userId });
    
    const filters = await getFilters(catName,subCatName);

    cartItems = userCart[0]?.items.map((item) => { 
      return item?.productId.toString();
    });

    const cartQty = await getCartQty(userId)

    res.render("./user/products", {
      allProducts,
      isAuthenticated,
      cartQty,
      userId,
      cartItems,
      pageNumber,
      totalPages,
      wishlist: wishlist?.products,
      catName:'All',
      subCatName:'All',
      sort:0,
      filters
    });
    } catch (error) {
      console.log(error)
      res.render('./user/404')
    }
};

const categorisedProduct = async (req, res) => {
  try {

    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = getUserId(req.cookies.userAccessToken);
    const filterKey = req.query.filterKey;
    const filterValue = req.query.filterValue;
    console.log(filterKey,filterValue)
    const catName = req.query.catName =='All' ? {$exists:true} : req.query.catName;
    const subCatName = req.query.subCatName=='All'? {$exists:true} : req.query.subCatName;
    const sort =  req.query.sort == '0' ? -1 : parseInt(req.query.sort);
    const sortKey = sort == 0 ? 'createdAt' : 'price';
    const filters = await getFilters(catName,subCatName);
    const cartQty = req.cookies.cartQty
    const pageNumber = parseInt(req.params.pageNumber || 0);
    const productsPerPage = 6;

    const wishlist = await WishlistModel.findOne({userId})
    const totalPages = Math.ceil(await (ProductModel.countDocuments({
      isListed: true, category: catName, subCategory: subCatName,[filterKey]:filterValue
    })) / productsPerPage);

   
   
    const allProducts = await ProductModel
      .find({
        $and:[
          {category: catName},
          {subCategory: subCatName},
          {isListed: true},
          {[filterKey]:filterValue}
        ] 
      }) 
      .skip(pageNumber * productsPerPage)
      .limit(productsPerPage)
      .sort({[sortKey]:sort});
    console.log(allProducts)
    const userCart = await CartModel.find({ userId: userId });

    cartItems = userCart[0]?.items.map((item) => {
      return item?.productId.toString();
    });

    const subCategory = typeof subCatName == 'object' ? "All" : subCatName;
    const category = typeof catName == 'object' ? 'All' : catName;
    
    res.render("./user/products", {
      allProducts,
      isAuthenticated,
      cartQty,
      totalPages,
      pageNumber,
      cartItems,
      wishlist: wishlist?.products,
      catName:category,
      subCatName:subCategory,
      sort,
      filters 
    });

  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const singleProduct = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = getUserId(req.cookies.userAccessToken);
    const prodId = req.params.prodId;
    const cartQty = await getCartQty(userId);
    let user = await UserModel.findOne({_id:userId})
      
    if(user && user?.refferalCode){
        var coupons = await CouponModel.find({})
    }else{
        var coupons = await CouponModel.find({couponType:"General"})
    }
    const product = await ProductModel.findOne({ _id: prodId }).populate('appliedOffer');
    const userCart = await CartModel.find({ userId: userId });
     
    cartItems = userCart[0]?.items.map((item) => {
      return item?.productId.toString();
    });
   
    res.render("./user/singleProd", {
      product: product,
      isAuthenticated,
      userId,
      cartQty,
      coupons,
     
    });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }

};



const searchProducts = async (req, res) => {
  try {
    const searchKey = req.params.searchKey;

    const products = await ProductModel.find({
      productName: { $regex: new RegExp(searchKey, 'i') }
    })
    res.send(products);

  } catch (err) {
    console.log(error);
    res.render('./user/404')
  }
}


module.exports = {
  viewAllProducts,
  singleProduct,
  categorisedProduct,
  searchProducts
};
