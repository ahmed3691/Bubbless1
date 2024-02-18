
//when requested url is not found

const notFound = (req,res,next)=>{
    const error = new Error(`Not found : ${req.originalUrl}`);
    res.send(404);
    next(error)
}

const errorHandler =(err,req,res,next)=>{
    let statusCode = res.statusCode === 200 ? 500 : res.statsCode;
    let message = error.message;

    if(err.name==='CastError' && err.kind === 'ObjectId'){
        statusCode = 400;
        message = 'Resource not found'
    }
    res.status(statusCode).json({
        message,
        stack : process.env.NODE_ENV === 'production' ? null : err.stack
    })
}

const ejsError = (err,req,res,next) =>{
    console.log('error checking')
    if(err){
        console.log(err);
        res.status(500).render('./user/404')
    }
   
}

module.exports = {
    notFound,
    errorHandler,
    ejsError
}