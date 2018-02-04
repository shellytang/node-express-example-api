'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const User = require('../models/user');

mongoose.Promise = Promise;
require('../app');
const url = 'http://localhost:3000';

const exampleUser = {
  user: {
    username: 'shellytest',
    password: 'password1234',
    email: 'shellytest@email.com',
  },
};

describe('User Routes', function() {
  afterEach(done => {
    User.remove({})
      .then(() => done())
      .catch(done);
  });
  describe('testing POST /api/users', function() {
    it('should return a 200 on user created', done => {
      request.post(`${url}/api/users`)
        .send(exampleUser)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.text).to.be.a('string');
          done();
        });
    });
    it('should create a user and a token', done => {
      request.post(`${url}/api/users`)
        .send(exampleUser)
        .end((err, res) => {
          expect(res.body.user.username).to.equal('shellytest');
          expect(res.body.user.email).to.equal('shellytest@email.com');
          expect(res.body.user.token).to.be.a('string');
          done();
        });
    });
    it('should return status 422 with an improper request', done => {
      const invalidUser = {
        user: {
          username: 'shelly',
          password: '',
          email: '',
        },
      };
      request.post(`${url}/api/users`)
        .send(invalidUser)
        .end((err, res) => {
          expect(res.status).to.equal(422);
          done();
        });
    });
    it('should return status 404 with an unregistered route', done => {
      request.post(`${url}/api/signup`)
        .send(exampleUser)
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
    });
  });

  describe('testing POST /api/users/login', function() {
    beforeEach(done => {
      let user = new User();
      user.username = exampleUser.user.username;
      user.email = exampleUser.user.email;
      user.setPassword(exampleUser.user.password);
      user.save()
        .then(user => {
          return user;
        });
      done();
    });

    const login = {
      user: {
        email: 'shellytest@email.com',
        password: 'password1234',
      },
    };

    it('should return 200 on a valid request', done => {
      request.post(`${url}/api/users/login`)
        .send(login)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          done();
        });
    });

    it('should return a user body and token', done => {
      request.post(`${url}/api/users/login`)
        .send(login)
        .end((err, res) => {
          expect(res.body.user.username).to.equal(exampleUser.user.username);
          expect(res.body.user.email).to.equal(exampleUser.user.email);
          expect(res.body.user.token).to.be.a('string');
          done();
        });
    });

    it('should return status 422 with empty email', done => {
      const invalidLogin = {
        user: {
          email: '',
          password: 'password1234',
        },
      };
      request.post(`${url}/api/users/login`)
        .send(invalidLogin)
        .end((err, res) => {
          expect(res.status).to.equal(422);
          done();
        });
    });

    it('should return status 422 with empty password', done => {
      const invalidLogin = {
        user: {
          email: 'shellytest@email.com',
          password: '',
        },
      };
      request.post(`${url}/api/users/login`)
        .send(invalidLogin)
        .end((err, res) => {
          expect(res.status).to.equal(422);
          done();
        });
    });

    it('should return status 422 with incorrect password and error message', done => {
      const invalidPassword = {
        user: {
          email: 'shellytest@email.com',
          password: 'wrongpassword',
        },
      };
      request.post(`${url}/api/users/login`)
        .send(invalidPassword)
        .end((err, res) => {
          expect(res.status).to.equal(422);
          expect(res.body.errors).to.exist;
          done();
        });
    });

    it('should return status 422 with incorrect email and error message', done => {
      const invalidEmail = {
        user: {
          email: 'shellytest@email.co',
          password: 'password1234',
        },
      };
      request.post(`${url}/api/users/login`)
        .send(invalidEmail)
        .end((err, res) => {
          expect(res.status).to.equal(422);
          expect(res.body.errors).to.exist;
          done();
        });
    });

    it('should return status 404 with unregistered route', done => {
      request.post(`${url}/api/users/signin`)
        .send(login)
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
    });
  });

  describe('testing GET /api/user', function() {
    let tempToken;
    let tempUser;
    beforeEach(done => {
      let user = new User();
      user.username = exampleUser.user.username;
      user.email = exampleUser.user.email;
      user.setPassword(exampleUser.user.password);
      user.save()
        .then(user => {
          tempUser = user;
          return user.generateJWT();
        })
        .then(token => {
          tempToken = token;
          done();
        })
        .catch(() => {
          done();
        });
    });

    it('should return a user body with status 200', done => {
      request.get(`${url}/api/user`)
        .set({Authorization: `Token ${tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.user.email).to.equal(exampleUser.user.email);
          expect(res.body.user.username).to.equal(exampleUser.user.username);
          expect(res.body.user.token).to.equal(tempToken);
          done();
        });
    });
    it('should return a 401 error with invalid credentials', done => {
      request.get(`${url}/api/user`)
        .set({Authorization: `Token ${tempToken}123`})
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
    });
    it('should return a 404 error for an unregistered route', done => {
      request.get(`${url}/api/userss`)
        .set({ Authorization: `Token ${tempToken}123` })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
    });
  });

});