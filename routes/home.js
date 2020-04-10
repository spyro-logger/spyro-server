const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Spyro Server Home Page' });
  });

module.exports = router;