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
    .post(async (req, res) => {
      const { board, text, delete_password } = req.body;
      if (!board || !text || !delete_password) {
        return res.send('error');
      }
      try {
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
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      if (!thread_id || !delete_password) {
        return res.send('error');
      }
      try {
        const threadToRemove = await db.collection('threads').findOne({ _id: new ObjectID(thread_id) });
        if (!threadToRemove) {
          return res.send('error');
        }
        const matchingPassword = await bcrypt.compare(delete_password, threadToRemove.delete_password);
        if (!matchingPassword) {
          return res.send('incorrect password');
        }
        const deleteResult = await db.collection('threads').findOneAndDelete({ _id: threadToRemove._id });
        if (!deleteResult.ok) {
          return res.send('error');
        }
        return res.send('success');
      } catch (e) {
        return res.send('err');
      }
    })
    .put(async (req, res) => {
      const { thread_id } = req.body;
      if (!thread_id) {
        return res.send('error');
      }
      try {
        const modifyResult = await db.collection('threads').findOneAndUpdate({ _id: new ObjectID(thread_id) }, { $set: { reported: true } });
        if (!modifyResult.ok || modifyResult.value === null) {
          return res.send('error');
        }
        return res.send('success');
      } catch (e) {
        console.error(e);
        return res.send('error');
      }
    })
    .get(async (req, res) => {
      const { board } = req.params;
      if (!board) {
        return res.send('error');
      }
      try {
        const threadsList = await db.collection('threads')
          .aggregate([
            {
              $match: { board }
            },
            {
              $project: { delete_password: 0, reported: 0 }
            },
            {
              $unwind: "$replies"
            },
            {
              $sort: { "replies.created_on": -1 }
            },
            {
              $group: {
                _id: "$_id",
                text: { $first: "$text" },
                board: { $first: "$board" },
                created_on: { $first: "$created_on" },
                bumped_on: { $first: "$bumped_on" },
                replies: { $push: "$replies" }
              }
            },
            {
              $addFields: {
                "replies": { $slice: [ "$replies", 3 ] },
                "replycount": { $size: "$replies" }
              }
            }
          ])
          .toArray();
        return res.json(threadsList);
      } catch (e) {
        console.error(e);
        return res.send('error');
      }
    });
    
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const board = req.body.board || req.params.board;
      if (!board || !text || !delete_password || !thread_id) {
        return res.send('error');
      }
      try {
        const hashedPassword = await bcrypt.hash(delete_password, SALT_ROUNDS);
        const date = Date.now();
        const result = await db.collection('threads')
          .findOneAndUpdate(
            { _id: ObjectID(thread_id) }, 
            { 
              $push: { 
                replies: {
                  _id: new ObjectID(),
                  text,
                  created_on: new Date(date),
                  delete_password: hashedPassword,
                  reported: false
                }
              },
              $set: {
                bumped_on: new Date(date)
              }
            }
          );
        if (!result.ok || result.value === null) {
          return res.send('error');
        }
        return res.redirect(`/b/${board}/${thread_id}`);
      } catch (e) {
        console.log(e);
        return res.send('error');
      }
    })
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      if (!thread_id || !reply_id) {
        return res.send('error');
      }
      try {
        const modifyResult = await db.collection('threads')
          .findOneAndUpdate(
            { _id: new ObjectID(thread_id), "replies._id": new ObjectID(reply_id) }, 
            { $set: { "replies.$.reported": true } }
          );
        if (!modifyResult.ok || modifyResult.value === null) {
          return res.send('error');
        }
        return res.send('success');
      } catch (e) {
        console.error(e);
        return res.send('error');
      }
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      if (!thread_id || !reply_id || !delete_password) {
        return res.send('error');
      }
      try {
        const threadWithReplyToRemove = await db.collection('threads')
          .aggregate([
            {
              $match: {
                _id: new ObjectID(thread_id)
              }
            },
            {
              $unwind: "$replies"
            }
          ])
          .toArray()
        const [ { replies: replyToRemove } ] = threadWithReplyToRemove;
        if (!threadWithReplyToRemove) {
          return res.send('error');
        }
        const matchingPassword = await bcrypt.compare(delete_password, replyToRemove.delete_password);
        if (!matchingPassword) {
          return res.send('incorrect password');
        }
        const updateResult = await db.collection('threads')
          .findOneAndUpdate({ 
            _id: new ObjectID(thread_id),
            "replies._id": new ObjectID(reply_id)
          }, {
            $set: {
              "replies.$.text": "[deleted]"
            }
          });
        if (!updateResult.ok || updateResult === null) {
          return res.send('error');
        }
        return res.send('success');
      } catch (e) {
        console.error(e);
        return res.send('err');
      }
    });

};
