const mongoose = require("mongoose");
const initData = require("./data.js");
const Post = require("../models/post.js");

MONGO_URL = "mongodb://127.0.0.1:27017/Blog";

main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Post.deleteMany({});
  initData.data.map((obj)=>({...obj, owner:"67de99b122e5b7548b075a23"}))
  await Post.insertMany(initData.data);
  console.log("Data was initialized");
};

initDB();