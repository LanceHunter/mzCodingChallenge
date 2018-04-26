const request = require('supertest');
const assert = require('assert');

describe('API request server', () => {
  describe('GET', () => {
    let app;
    beforeEach(() => {
      app = require('../app.js');
    });
    it('should return a 404 for /', (done) => {
      request(app)
        .get('/')
        .expect(404, done);
    });
    it('should return a 404 for anything other than /', (done) => {
      request(app)
        .get('/test/')
        .expect(404);
      request(app)
        .get('/foo/bar')
        .expect(404, done);
    });
  });

  describe('POST', () => {
    let app;
    beforeEach(() => {
      app = require('../app.js');
    });

    it('Returns XML for customers requesting that in their config', (done) => {
      request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({
          customer : 'Sunrise Bank',
          latitude : 40.730610,
          longitude : -73.935242
        })
        .expect('Content-Type', /xml/)
        .expect(200, done);
    });

    it('Returns JSON for customers requesting that in their config', (done) => {
      request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({
          customer : 'Paris FCU',
          latitude : 40.730610,
          longitude : -73.935242
        })
        .expect('Content-Type', /json/)
        .expect(200);
      request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({
          customer : 'Happy Credit Union',
          latitude : 40.730610,
          longitude : -73.935242
        })
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns error if not provided with correct information', (done) => {
      request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({
          customer : 'Paris FCU',
          latitude : 'ff',
          longitude : -73.935242
        })
        .expect(400, (err, res) => {
          assert.equal(res.error.text, 'Latitude is not valid.');
        });

      request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({
          latitude : 40.730610,
          longitude : -73.935242
        })
        .expect(400, (err, res) => {
          assert.equal(res.error.text, 'Customer name, latitude, and longitude requred. Please send these in a JSON body using the keys "customer", "latitude", and "longitude".');
        });

      request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({
          customer : 'HappyCreditUnion',
          latitude : 40.730610,
          longitude : -73.935242
        })
        .expect(400, (err, res) => {
          assert.equal(res.error.text, 'Unable to find information for that customer.')
        });
      done();
    });
  });

});
