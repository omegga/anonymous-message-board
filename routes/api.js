/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

// var expect = require('chai').expect;
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

module.exports = function (app, db) {
  
  app.route('/api/threads/:board')
    .post(async (req, res, next) => {
      const { board, text, delete_password } = req.body;
      if (!delete_password) {
        return res.send('password is not valid');
      }
      try {
        const existingBoard = await db.collection('threads').findOne({ _id: board });
        if (existingBoard) {
          return res.send('board already exist');
        }
        const date = Date.now();
        const hashedPassword = await bcrypt.hash(delete_password, SALT_ROUNDS);
        const result = await db.collection('threads').insertOne({
          _id: board,
          text,
          created_on: new Date(date),
          bumped_on: new Date(date),
          reported: false,
          delete_password: hashedPassword,
          replies: []
        });
        return res.json(result.ops[0]);
      } catch (e) {
        console.error(e);
        return res.send(e);
      }
    })
    
  app.route('/api/replies/:board');

};
