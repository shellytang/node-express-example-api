'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug'); //package we'll use to auto create URL slugs
const User = mongoose.model('User');

const ArticleSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: String,
  description: String,
  body: String,
  favoritesCount: { type: Number, default: 0 },
  tagList: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true });

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' });

ArticleSchema.methods.slugify = function () {
  this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
}

//middleware -- generate slug before mongoose tries to validate the model
ArticleSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify();
  }
  next();
});

//returns the JSON of an article
ArticleSchema.methods.toJSONFor = function (user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user),
  }
}

ArticleSchema.methods.updateFavoriteCount = function () {
  const article = this;
  return User.count({ favorites: { $in: [article._id] } }) //built in mongo method
    .then(count => {
      article.favoritesCount = count;
      return article.save();
    });
};

mongoose.model('Article', ArticleSchema);