const express = require("express");
const Photos = require("../db/photoModel");
const router = express.Router();

// router.get("/photos", async (request, response) => {
//  try {
//     const photo = await Photos.find();
//     response.json(photo);
//   }catch (err){
//     console.log(err);
//     response.status(500).send({ message: "Error fetching users" });
//   }
// });

router.get("/photoOfUser/:id", async (request, response) => {
  
});

module.exports = router;
