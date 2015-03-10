var assert = require('power-assert');
var Session = require('../src').Session;
var FetchError = require('../src').FetchError;
var config = require('../config/config').config;
var scopes = require('../src/scopes').SCOPES;
var endpoint = config.ENDPOINT;

describe('Session test', function() {
  /*eslint no-inner-declarations:0, no-redeclare:0*/

  this.timeout(10 * 1000); // 10sec

  let params = {
    /*eslint camelcase:0*/
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    username: config.CID,
    password: config.PASSWORD,
    scope: config.SCOPE_LIST,
    grant_type: 'password'
  };

  describe('constructor', () => {
    it('new', () => {
      let session = new Session(endpoint, params);
      assert.deepEqual(session.params, params); // TODO: strictDeepEqual in io.js
      assert.strictEqual(session.endpoint, endpoint);
    });

    it('new without endpoint', () => {
      try {
        let session = new Session();
        assert.fail('cant be here: ' + session);
      } catch(err) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'endpoint required');
      }
    });

    it('new without params', () => {
      try {
        let session = new Session(endpoint);
        assert.fail('cant be here: ' + session);
      } catch(err) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'params required');
      }
    });

    describe('new with invalid params', () => {
      let copy = (o) => JSON.parse(JSON.stringify(o));

      [
        // client_id
        {
          name: 'without params.client_id',
          params: () => {
            let p = copy(params);
            delete p.client_id;
            return p;
          },
          message: 'params.client_id required'
        },
        {
          name: 'with empty params.client_id',
          params: () => {
            let p = copy(params);
            p.client_id = '';
            return p;
          },
          message: 'params.client_id required'
        },
        {
          name: 'with invalid type params.client_id',
          params: () => {
            let p = copy(params);
            p.client_id = 1000;
            return p;
          },
          message: 'params.client_id should be string'
        },

        // client_secret
        {
          name: 'without params.client_secret',
          params: () => {
            let p = copy(params);
            delete p.client_secret;
            return p;
          },
          message: 'params.client_secret required'
        },
        {
          name: 'with empty params.client_secret',
          params: () => {
            let p = copy(params);
            p.client_secret = '';
            return p;
          },
          message: 'params.client_secret required'
        },
        {
          name: 'with invalid params.client_secret',
          params: () => {
            let p = copy(params);
            p.client_secret = 1000;
            return p;
          },
          message: 'params.client_secret should be string'
        },
        // username
        {
          name: 'without params.username',
          params: () => {
            let p = copy(params);
            delete p.username;
            return p;
          },
          message: 'params.username required'
        },
        {
          name: 'with empty params.username',
          params: () => {
            let p = copy(params);
            p.username = '';
            return p;
          },
          message: 'params.username required'
        },
        {
          name: 'with invalid params.username',
          params: () => {
            let p = copy(params);
            p.username = 1000;
            return p;
          },
          message: 'params.username should be string'
        },
        // password
        {
          name: 'without params.password',
          params: () => {
            let p = copy(params);
            delete p.password;
            return p;
          },
          message: 'params.password required'
        },
        {
          name: 'with empty params.password',
          params: () => {
            let p = copy(params);
            p.password = '';
            return p;
          },
          message: 'params.password required'
        },
        {
          name: 'with invalid params.password',
          params: () => {
            let p = copy(params);
            p.password = 1000;
            return p;
          },
          message: 'params.password should be string'
        },
        // scope
        {
          name: 'without params.scope',
          params: () => {
            let p = copy(params);
            delete p.scope;
            return p;
          },
          message: 'params.scope required'
        },
        {
          name: 'with invalid params.scope',
          params: () => {
            let p = copy(params);
            p.scope = 1000;
            return p;
          },
          message: 'params.scope should be array'
        },
        // grant_type
        {
          name: 'without params.grant_type',
          params: () => {
            let p = copy(params);
            delete p.grant_type;
            return p;
          },
          message: 'params.grant_type required'
        },
        {
          name: 'with empty params.grant_type',
          params: () => {
            let p = copy(params);
            p.grant_type = '';
            return p;
          },
          message: 'params.grant_type required'
        },
        {
          name: 'with invalid params.grant_type',
          params: () => {
            let p = copy(params);
            p.grant_type = 1000;
            return p;
          },
          message: 'params.grant_type should be string'
        }
      ].forEach((p) => {
        it(p.name, () => {
          try {
            let session = new Session(endpoint, p.params());
            assert.fail('cant be here: ' + session);
          } catch (err) {
            assert(err instanceof assert.AssertionError);
            assert.strictEqual(err.message, p.message);
          }
        });
      });
    });
  });

  describe('emitter', () => {
    it('emit', () => {
      let session = new Session(endpoint, params);

      let c = 0;
      session.on('test', function test0(data) {
        assert.strictEqual(data, 'data');
        if (c++ === 2) {
          done();
        }
      });

      session.on('test', function test1(data) {
        assert.strictEqual(data, 'data');
        if (c++ === 2) {
          done();
        }
      });

      session.emit('test', 'data');
    });
  });

  describe('auth', () => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        assert.ok(session.authInfo.access_token);
        assert.ok(session.authInfo.refresh_token);
        assert.ok(session.authInfo.token_type);
        assert.ok(session.authInfo.expires_in);
        assert.ok(session.authInfo.scope);
        done();
      }).catch(done);
    });

    it('error: param with invalid client_id', (done) => {
      let p = JSON.parse(JSON.stringify(params));
      p.client_id = 'xxxxxxxx';
      let session = new Session(endpoint, p);
      session.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The client identifier provided is invalid.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_client');
        done();
      }).catch(done);
    });

    it('error: param with invalid client_secret', (done) => {
      let p = JSON.parse(JSON.stringify(params));
      p.client_secret = 'xxxxxxxx';
      let session = new Session(endpoint, p);
      session.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The client identifier provided is invalid.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_client');
        done();
      }).catch(done);
    });

    it('error: param with invalid username', (done) => {
      let p = JSON.parse(JSON.stringify(params));
      p.username = 'xxxxxxxx';
      let session = new Session(endpoint, p);
      session.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The provided access grant is invalid, expired, or revoked.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_grant');
        done();
      }).catch(done);
    });

    it('error: param with invalid password', (done) => {
      let p = JSON.parse(JSON.stringify(params));
      p.password = 'xxxxxxxx';
      let session = new Session(endpoint, p);
      session.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The provided access grant is invalid, expired, or revoked.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_grant');
        done();
      }).catch(done);
    });

    it('error: param with invalid scope', (done) => {
      let p = JSON.parse(JSON.stringify(params));
      p.scope = [];
      let session = new Session(endpoint, p);
      session.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The request is missing a required parameter.*/.test(err.message));
        assert.strictEqual(err.code, 'invalid_request');
        done();
      }).catch(done);
    });

    it('error: param with invalid grant_type', (done) => {
      let p = JSON.parse(JSON.stringify(params));
      p.grant_type = 'xxxxxxxx';
      let session = new Session(endpoint, p);
      session.auth().then(() => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.ok(/The access grant included - its type or another attribute - is not supported by the authorization server..*/.test(err.message));
        assert.strictEqual(err.code, 'unsupported_grant_type');
        done();
      }).catch(done);
    });
  });

  describe('discovery', () => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        // any scope with granted are ok
        return session.discovery(scopes.INFORMATION_URI);
      }).then((info) => {
        assert(info);
        done();
      }).catch(done);
    });

    it('error: no result for SCOPE', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.discovery(scopes.AUTH_API);
      }).then((info) => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.ok(/discovery result doesn\'t include.*/.test(err.message));
        done();
      });
    });
  });

  describe('accountInfo', () => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.accountInfo();
      }).then((info) => {
        assert.strictEqual(typeof info.email_verified, 'boolean');
        assert.strictEqual(typeof info.web_password_changed, 'boolean');
        done();
      }).catch(done);
    });
  });

  describe('userInfo', () => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.userInfo();
      }).then((info) => {
        assert.strictEqual(info.type, 'account');
        assert.strictEqual(typeof info.id, 'number');
        assert.strictEqual(typeof info.display_name, 'string');
        assert.strictEqual(typeof info.email, 'string');
        assert.strictEqual(typeof info.link, 'string');
        assert.strictEqual(info.udc_id, params.username);
        done();
      }).catch(done);
    });
  });

  describe('information', (done) => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.information();
      }).then((info) => {
        assert.strictEqual(typeof info.ja, 'string');
        assert.strictEqual(typeof info.global, 'string');
        done();
      }).catch(done);
    });
  });

  describe('rosters', (done) => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.rosters();
      }).then((rosters) => {
        assert.ok(Array.isArray(rosters.results));
        assert.strictEqual(typeof rosters.total_results, 'number');
        assert.strictEqual(rosters.total_results, rosters.results.length);
        done();
      }).catch(done);
    });
  });

  describe('roster', (done) => {
    it('success', (done) => {
      let cid;
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.rosters();
      }).then((rosters) => {
        if (rosters.results.length > 0) {
          cid = rosters.results.shift().udc_id;
        } else {
          return done(new Error(`${params.username} doesn't have a roster`));
        }
        return session.roster(cid);
      }).then((roster) => {
        assert.ok(roster);
        assert.strictEqual(roster.udc_id, cid);
        done();
      }).catch(done);
    });

    it('error: non-existent cid', (done) => {
      let cid;
      let session = new Session(endpoint, params);
      session.auth().then(() => {
        return session.roster('invalidCID');
      }).then((roster) => {
        assert.ok(roster);
        assert.strictEqual(roster.udc_id, cid);
        done();
      }).catch((err) => {
        assert.ok(err instanceof FetchError);
        assert.strictEqual(err.message, '存在しないUDC-IDです');
        assert.strictEqual(err.code, 'roster.error.udcid.notexist');
        done();
      }).catch(done);
    });
  });

  describe('logUpload', (done) => {
    it('success', (done) => {
      let session = new Session(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      session.auth().then(() => {
        return session.logUpload(log, filename);
      }).then((result) => {
        assert.strictEqual(result, null);
        done();
      }).catch(done);
    });

    it('cancel', (done) => {
      let session = new Session(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'a';
      for (let i = 0; i < 20; i++) {
        log += log;
      }

      session.auth().then(() => {
        // cancel
        setTimeout(() => {
          session.logUploadCancel();
        }, 50);

        return session.logUpload(log, filename);
      }).then((result) => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'upload canceled');
        done();
      }).catch(done);
    });

    it('error: timeout', (done) => {
      let session = new Session(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'a';
      for (let i = 0; i < 20; i++) {
        log += log;
      }

      let timeout = 1;

      session.auth().then(() => {
        return session.logUpload(log, filename, timeout);
      }).then((result) => {
        assert.fail('cant be here');
      }).catch((err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, `timeout of ${timeout}ms exceeded`);
        done();
      }).catch(done);
    });

    it('error: file size too large', () => {
      let session = new Session(endpoint, params);
      let filename = 'log_upload_test_from_browser';
      let log = 'a';
      for (let i = 0; i < 27; i++) {
        log += log;
      }

      try {
        session.logUpload(log, filename);
      } catch(err) {
        assert.strictEqual(err.message, 'logfile too big. (API limit 128MB)');
      }
    });

    it('error: invalid file name', () => {
      let session = new Session(endpoint, params);
      let filename = 'test#from%browser';
      let log = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      try {
        session.logUpload(log, filename);
      } catch(err) {
        assert.strictEqual(err.message, 'invalid log filename. (API limit alpahnumeric and -, ., _)');
      }
    });
  });
});
