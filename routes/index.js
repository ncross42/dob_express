var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function (req, res) {
// console.log('a');
  if (req.user !== undefined) {
// console.log('b');
    res.redirect('/')
  } else {
// console.log('c');
    res.render('login', {
      title: 'login'
    })
  }
});

// local logout
router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

/*로그인 유저 판단 로직*/
var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
};

router.get('/myinfo', isAuthenticated, function (req, res) {
  res.render('myinfo', {
    title: 'My Info',
    user_info: req.user
  })
});

module.exports = router;
