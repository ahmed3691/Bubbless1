const { ProductModel } = require("../../model/productModel");
const { SubCatModel, CatModel } = require("../../model/categoryModel");
const { get } = require("../../routers/userRoute");
const { CartModel } = require("../../model/cartModel");
const { getUserId, getCartQty } = require("../../config/userConfig");


const viewAllProducts = async (req, res) => {
  const isAuthenticated = req.cookies.userAccessToken || false;
  const userId = getUserId(req.cookies.userAccessToken)
  const searchKey = req.query.searchKey;

  const pageNumber = parseInt(req.params.pageNumber || 0);
  const productsPerPage = 3;
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
    .limit(productsPerPage);
  const mainCat = await CatModel.find({});
  const userCart = await CartModel.find({ userId: userId });


  cartItems = userCart[0]?.items.map((item) => {
    return item?.productId.toString();
  });
  function getCategory(category) {
    return SubCatModel.find({ category: `${category}` });
  }

  const boysCat = await getCategory("Boys");
  const girlsCat = await getCategory("Girls");
  const uniCat = await getCategory("Unisex");
  const cartQty = await getCartQty(userId)



  res.render("./user/products", {
    allProducts: allProducts,
    mainCat: mainCat,
    boysCat: boysCat,
    girlsCat: girlsCat,
    uniCat: uniCat,
    isAuthenticated,
    cartQty,
    userId,
    cartItems,
    pageNumber,
    totalPages
  });
};

const singleProduct = async (req, res) => {
  const isAuthenticated = req.cookies.userAccessToken || false;
  const prodId = req.params.prodId;
  const userId = getUserId(req.cookies.userAccessToken);
  const cartQty = await getCartQty(userId);
  const product = await ProductModel.findOne({ _id: prodId });
  const userCart = await CartModel.find({ userId: userId });
  cartItems = userCart[0]?.items.map((item) => {
    return item?.productId.toString();
  });
  console.log(prodId);
  res.render("./user/singleProd", {
    product: product,
    isAuthenticated,
    userId,
    cartQty
  });
};

const categorisedProduct = async (req, res) => {
  const isAuthenticated = req.cookies.userAccessToken || false;
  const userId = getUserId(req.cookies.userAccessToken);
  const catName = req.params.catName;
  const subCatName = req.params.subCatName;
  const cartQty = req.cookies.cartQty
  const pageNumber = parseInt(req.params.pageNumber || 0);
  const productsPerPage = 3;
  const totalPages = Math.ceil(await (ProductModel.countDocuments({
    isListed: true, category: catName, subCategory: subCatName
  })) / productsPerPage);
  const allProducts = await ProductModel
    .find({ category: catName, subCategory: subCatName, isListed: true })
    .skip(pageNumber * productsPerPage)
    .limit(productsPerPage);

  const userCart = await CartModel.find({ userId: userId });
  const mainCat = await CatModel.find({});
  const boysCat = await SubCatModel.find({ category: "Boys" });
  const girlsCat = await SubCatModel.find({ category: "Girls" });
  const uniCat = await SubCatModel.find({ category: "Unisex" });

  cartItems = userCart[0]?.items.map((item) => {
    return item?.productId.toString();
  });


  res.render("./user/products", {
    allProducts,
    mainCat: mainCat,
    boysCat: boysCat,
    girlsCat: girlsCat,
    uniCat: uniCat,
    isAuthenticated,
    cartQty,
    totalPages,
    pageNumber,
    cartItems
  });
};

const searchProducts = async (req, res) => {
  try {
    const searchKey = req.params.searchKey;

    const products = await ProductModel.find({
      productName: { $regex: new RegExp(searchKey, 'i') }
    })
    res.send(products);

  } catch (err) {
    console.log(err)
  }
}


module.exports = {
  viewAllProducts,
  singleProduct,
  categorisedProduct,
  searchProducts
};
