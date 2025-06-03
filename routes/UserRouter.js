const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

router.get("/list", async (request, response) => {
  try {
    const users = await User.find();
    response.status(200).send(users);
  }catch (err){
    console.log(err);
    response.status(500).send({ message: "Error fetching users" });
  }
});

router.get("/:id", async (request, response) => {
  
});

module.exports = router;