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
  afterEach((done) => {
    User.remove({})
      .then(() => done())
      .catch(done);
  });
  describe('testing POST /api/users', function() {
    it('should return a 200 on user created', done => {
      request.post(`${url}/api/users`)
        .send(exampleUser)
        .end((err, res) => {
          console.log('res: ', res.body);
          expect(res.status).to.equal(200);
          expect(res.text).to.be.a('string');
          done();
        });
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