'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secret = require('../config').secret;

const UserSchema = new mongoose.Schema({
  username: { type: String, lowercase: true, unique: true, required: [true, 'can\'t be blank'], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  email: { type: String, lowercase: true, unique: true, required: [true, 'can\'t be blank'], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true },
  bio: String,
  image: String,
  hash: String,
  salt: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] //ids of users that the user is following
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: 'is already taken' });

UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.validPassword = function (password) {
  let hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
}

UserSchema.methods.generateJWT = function () {
  let today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 60); //set to expire 60 days
  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, secret);
}

//JSON representation of a user for authentication
UserSchema.methods.toAuthJSON = function () {
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    bio: this.bio,
    image: this.image
  };
}
//JSON representation of a user for profile
UserSchema.methods.toProfileJSONFor = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image || 'http://static.productionready.io/images/smiley-cyrus.jpg',
    following: user ? user.isFollowing(this._id) : false
  };
}

UserSchema.methods.favorite = function (id) {
  if (this.favorites.indexOf(id) === -1) {
    this.favorites.push(id);
  }
  return this.save();
}

UserSchema.methods.unfavorite = function (id) {
  this.favorites.remove(id);
  return this.save();
}

//check user has favorited an article
UserSchema.methods.isFavorite = function (id) {
  return this.favorites.some(function (favoriteId) {
    return favoriteId.toString() === id.toString();
  });
}

//add a new user ID to the current users following array
UserSchema.methods.follow = function (id) {
  if (this.following.indexOf(id) === -1) {
    this.following.push(id);
  }
  return this.save();
}

//remove user ID from current users following array
UserSchema.methods.unfollow = function (id) {
  this.following.remove(id);
  return this.save();
};

//Check if a user is following another user -- front end will know whether or not to show a follow or unfollow button
UserSchema.methods.isFollowing = function (id) {
  return this.following.some(followId => {
    return followId.toString() === id.toString();
  });
}


mongoose.model('User', UserSchema);