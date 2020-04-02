const express = require("express");

const router = express.Router();

/* GET home page. */
/* eslint-disable no-unused-vars */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Spyro Server Home Page" });
});
/* eslint-enable no-unused-vars */

module.exports = router;
