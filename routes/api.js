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
const ObjectID = require('mongodb').ObjectID;

const SALT_ROUNDS = 10;

module.exports = function (app, db) {
  
  app.route('/api/threads/:board')
    .post(async (req, res, next) => {
      const { board, text, delete_password } = req.body;
      if (!delete_password) {
        return res.send('password is not valid');
      }
      try {
        const existingBoard = await db.collection('threads').findOne({ board, text });
        if (existingBoard) {
          return res.send('thread already exists');
        }
        const date = Date.now();
        const hashedPassword = await bcrypt.hash(delete_password, SALT_ROUNDS);
        const result = await db.collection('threads').insertOne({
          text,
          board,
          created_on: new Date(date),
          bumped_on: new Date(date),
          reported: false,
          delete_password: hashedPassword,
          replies: []
        });
        console.log(result.ops[0]);
        return res.redirect(`/b/${board}`);
      } catch (e) {
        return res.send(e);
      }
    })
    .delete(async (req, res, next) => {
      const { board, thread_id, delete_password } = req.body;
      if (!board || !thread_id || !delete_password) {
        return res.send('missing fields');
      }
      try {
        const threadToRemove = await db.collection('threads').findOne({ _id: new ObjectID(thread_id), board });
        if (!threadToRemove) {
          return res.send('board does not exist');
        }
        const matchingPassword = await bcrypt.compare(delete_password, threadToRemove.delete_password);
        if (!matchingPassword) {
          return res.send('incorrect password');
        }
        const deleteResult = await db.collection('threads').findOneAndDelete({ _id: threadToRemove._id });
        if (!deleteResult.ok) {
          return res.send('error');
        }
      } catch (e) {
        return res.send('err');
      }
      return res.send('success');
    })
    
  app.route('/api/replies/:board');

};
