/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {

      test('create a thread without a board', done => {
        chai.request(server)
          .post('/api/threads/')
          .send({
            text: "pictures",
            delete_password: "pwd"
          })
          .end((err, res) => {
            assert.equal(res.status, 404);
            assert.equal(res.text, 'Not Found');
            done();
          });
      });

      test('create a thread without a text', done => {
        chai.request(server)
          .post('/api/threads/general')
          .send({
            delete_password: "pwd"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'error');
            done();
          });
      });

      test('create a thread without a delete_password', done => {
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: 'pictures'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'error');
            done();
          });
      });

      test('create a thread', done => {
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: "pictures",
            delete_password: "pwd"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });

    });
    
    suite('DELETE', function() {
      
      test('delete a thread without a thread_id', done => {
        chai.request(server)
          .delete('/api/threads/general')
          .send({
            delete_password: "pwd"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'error');
            done();
          });
      });
      
      test('delete a thread without a delete_password', done => {
        chai.request(server)
          .delete('/api/threads/general')
          .send({
            thread_id: 'abcdef'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text,'error');
            done();
          });
      });
      
      test('delete a thread', done => {
        const password = 'pwd';
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: "pictures",
            delete_password: password
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            chai.request(server)
            .get('/api/threads/general')
            .end((err, res) => {
              assert.equal(res.status, 200);
              const threadsList = res.body;
              const threadsLength = threadsList.length;
              const [firstThread] = threadsList;
              chai.request(server)
              .delete('/api/threads/general')
              .send({
                thread_id: firstThread._id,
                delete_password: password
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                chai.request(server)
                .get('/api/threads/general')
                .end((err, res) => {
                  const threadsList = res.body;
                  assert.notEqual(threadsList[0]._id, firstThread._id);
                  done();
                });
              })
            });
          });
        
      });

    });

    suite('PUT', function() {
      
      test('report a thread without thread_id', done => {
        chai.request(server)
        .put('/api/threads/general')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'error');
          done();
        });
      });

      test('report a thread', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          const threadsList = res.body;
          const firstThread = threadsList[0];
          chai.request(server)
          .put('/api/threads/general')
          .send({ thread_id: firstThread._id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
        });
      });

    });

    suite('GET', function() {

      test('GET threads list without a board', done => {
        chai.request(server)
        .get('/api/threads/')
        .end((err, res) => {
          assert.equal(res.status, 404);
          done();
        });
      });
      
      test('GET threads list', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'board');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'replies');
          assert.isArray(res.body[0].replies);
          assert.notProperty(res.body[0], 'delete_password');
          assert.notProperty(res.body[0], 'reported');
          assert.property(res.body[0], 'replycount');
          done();
        });
      });

    });

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      const examplePassword = "pwd";
      const exampleText = "hello world";

      test('create a reply without a board', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          const firstThread = res.body[0];
          chai.request(server)
          .post('/api/replies/')
          .send({
            delete_password: examplePassword,
            thread_id: firstThread._id,
            text: exampleText
          })
          .end((err, res) => {
            assert.equal(res.status, 404)
            done();
          });
        });
      });

      test('create a reply without a text', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
              .post('/api/replies/general')
              .send({
                delete_password: examplePassword,
                thread_id: firstThread._id,
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'error');
                done();
              });
          });
      });

      test('create a reply without a delete_password', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
              .post('/api/replies/general')
              .send({
                thread_id: firstThread._id,
                text: exampleText
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'error');
                done();
              });
          });
      });

      test('create a reply', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
              .post('/api/replies/general')
              .send({
                thread_id: firstThread._id,
                text: exampleText,
                delete_password: examplePassword
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                chai.request(server)
                  .get('/api/threads/general')
                  .end((err, res) => {
                    assert.equal(res.body[0].replies[0].text, exampleText);
                    done();
                  });
              });
          });
      });

    });
    
    suite('GET', function() {
      
      test('get replies without a thread_id', done => {
        chai.request(server)
        .get('/api/replies/general')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'error');
          done();
        });
      });
      
      test('get replies without a thread_id', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          const firstThread = res.body[0];
          chai.request(server)
          .get('/api/replies/general?thread_id=' + firstThread._id)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'board');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'replies');
            assert.isArray(res.body.replies);
            assert.notProperty(res.body, 'delete_password');
            assert.notProperty(res.body, 'reported');
            done();
          });
        });
      });

    });
    
    suite('PUT', function() {
      
      test('report a reply without thread_id', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          const firstThread = res.body[0];
          chai.request(server)
          .put('/api/replies/general')
          .send({
            reply_id: firstThread.replies[0]._id
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'error');
            done();
          });
        });
      });
      
      test('report a reply without reply_id', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          const firstThread = res.body[0];
          chai.request(server)
          .put('/api/replies/general')
          .send({
            thread_id: firstThread._id
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'error');
            done();
          });
        });
      });
      
      test('report a reply', done => {
        chai.request(server)
        .get('/api/threads/general')
        .end((err, res) => {
          const firstThread = res.body[0];
          chai.request(server)
          .put('/api/replies/general')
          .send({
            reply_id: firstThread.replies[0]._id,
            thread_id: firstThread._id
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
        });
      });

    });
    
    suite('DELETE', function() {
      const examplePassword = 'pwd';
      const exampleText = 'hello world';

      test('delete a reply without a thread_id', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
            .delete('/api/replies/general')
            .send({
              reply_id: firstThread.replies[0]._id,
              delete_password: examplePassword
            })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'error');
              done();
            });
          });
      });

      test('delete a reply without a reply_id', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
              .delete('/api/replies/general')
              .send({
                thread_id: firstThread._id,
                delete_password: examplePassword
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'error');
                done();
              });
          });
      });

      test('delete a reply without a delete_password', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
              .delete('/api/replies/general')
              .send({
                reply_id: firstThread.replies[0]._id,
                thread_id: firstThread._id,
              })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'error');
                done();
              });
          });
      });
      
      test('delete a reply', done => {
        chai.request(server)
          .get('/api/threads/general')
          .end((err, res) => {
            const firstThread = res.body[0];
            chai.request(server)
              .post('/api/replies/general')
              .send({
                thread_id: firstThread._id,
                text: exampleText,
                delete_password: examplePassword
              })
              .end((err, res) => {
                chai.request(server)
                  .get('/api/threads/general')
                  .end((err, res) => {
                    const firstThread = res.body[0];
                    const reply_id = firstThread.replies[0]._id;
                    const thread_id = firstThread._id;
                    chai.request(server)
                      .delete('/api/replies/general')
                      .send({
                        reply_id,
                        thread_id,
                        delete_password: examplePassword
                      })
                      .end((err, res) => {
                        assert.equal(res.status, 200);
                        assert.equal(res.text, 'success');
                        done();
                      });
                  });
              });
          });
      });
    });
  });
});
