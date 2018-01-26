'use strict';

const router = require('express').Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');

//get list of all unique tags
router.get('/', function (req, res, next) {
  Article.find()
    .distinct('tagList')
    .then(tags => {
      return res.json({ tags: tags });
    })
    .catch(next);
});

module.exports = router;

