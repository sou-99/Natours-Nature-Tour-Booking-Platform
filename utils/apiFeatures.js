class APIFeatures {
    constructor(query,queryString){
      this.query = query;
      this.queryString = queryString;
    }
    filter(){
      const queryObj = {...this.queryString};
      const excludedFields = ['page','sort','limit','fields'];
      excludedFields.forEach(el => delete queryObj[el])
  
      // ADVANCE FILTERING
      let queryStr = JSON.stringify(queryObj)
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match => `$${match}`)
      // console.log(req.query,queryObj,JSON.parse(queryString))
      this.query = this.query.find(JSON.parse(queryStr))
      return this;
    }
  
    sort(){
      if(this.queryString.sort){
        let sortBy = this.queryString.sort.split(",").join(" ");
        // console.log(sortBy)
        this.query = this.query.sort(sortBy)
      }else{
        this.query = this.query.sort("-createdAt")
      }
      return this
    }
  
    limitFields(){
      if(this.queryString.fields){
        let fields = this.queryString.fields.split(",").join(" ");
        this.query = this.query.select(fields)
      }else{
        this.query = this.query.select("-__v")
      }
      return this;
    }
  
    paginate(){
      let page = (this.queryString.page * 1) || 1
      let limit = this.queryString.limit *1 || 100;
      // console.log(this.queryString,page,limit)
      let skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit)
      return this;
    }
  }
module.exports = APIFeatures;