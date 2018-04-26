/**
 * Created by cheese on 2017. 1. 6..
 */

let express = require('express');
let router = express.Router();
let mysql_dbc = require('../commons/db_con')();
let connection = mysql_dbc.init();
let bcrypt = require('bcrypt');

let API_Call = require('../service/API_Call')('another');


router.post('/login', function (req, res, next) {
  
  let
    user_id = req.body.user_id,
    password = req.body.password;
  
  console.log(user_id, password);
  console.log(bcrypt.hashSync(password, 10));
  
  connection.query('select * from `social` where `user_id` = ?;', user_id, function (err, result) {
    if (err) {
      console.log('err :' + err);
    } else {
      console.log(result);
      if (result.length === 0) {
        res.json({success: false, msg: '해당 유저가 존재하지 않습니다.'})
      } else {
        if (!bcrypt.compareSync(password, result[0].password)) {
          res.json({success: false, msg: '비밀번호가 일치하지 않습니다.'});
        } else {
          res.json({success: true});
        }
      }
    }
  });
});


router.post('/login/another/api', function (req, res) {
  let
    user_id = req.body.user_id,
    password = req.body.password;
  
  API_Call.login(user_id, password, function (err, result) {
    if (!err) {
      res.json(result);
    } else {
      res.json(err);
    }
  });
});

router.delete('/crontab', function (req, res) {
  let sql = req.body.sql;
  connection.query(sql, function (err, result) {
    if (err) {
      res.json({
        success: false,
        err: err
      });
    } else {
      console.log('Delete Success');
      res.json({
        success: true,
        msg: 'Delete Success'
      })
    }
  });
});
module.exports = router;
