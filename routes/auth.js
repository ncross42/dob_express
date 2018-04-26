const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , NaverStrategy = require('passport-naver').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , KakaoStrategy = require('passport-kakao').Strategy;

const secrets = require('../commons/secrets').federation;
const pool = require('../commons/db_con');
// const mysql_service = require('../scripts/mysqlService');

/* GET home page. */
router.get('/', (req, res, next) => {
  /**
   * { vendor: 'facebook',
   *   user_id: '1234567890123456',
   *   user_seq: 1,
   *   name: 'HeeWon Lee',
   *   nick: '' }
   **/
  console.log(req.user);
  // console.log(secrets);
  res.send('asdf');
  //res.redirect('/')
});

/*로그인 성공시 사용자 정보를 Session에 저장한다*/
passport.serializeUser(function (user, done) {
  done(null, user)
});

/*인증 후, 페이지 접근시 마다 사용자 정보를 Session에서 읽어옴.*/
passport.deserializeUser(function (user, done) {
  done(null, user);
});

// router.get('/mutiple/insert', function (req, res) {
//   mysql_service.multipleInsert();
// });
// 
// function verifyUserByEmail(email) {
//   let stmt_duplicated = 'select * from `social` where `user_id` = ?';
//   return stmt_duplicated;
// }

/**
 * 1. 중복성 검사
 * 2. 신규 유저
 *  2.1 신규 유저 가입 시키기
 * 3. 올드유저
 *  3.1 바로 로그인 처리
 */
async function loginByThirdparty(info, done) { //{{{
  try {
    let ret = {user_seq:0, name:info.auth_name, nick:info.auth_nick};
    const con = await pool.getConnection();
    const check_social = `SELECT * FROM social WHERE vendor = '${info.auth_type}' AND user_id = '${info.auth_id}'`;
    const res0 = await con.query(check_social);
    if (!res0.length) { // social 없음.
      const check_user = `SELECT * FROM user WHERE email = '${info.auth_email}'`;
      const res1 = await con.query(check_user);
      if (!res1.length) { // user 없음.
        const insert_user = `INSERT INTO user SET user_seq=0, email='${info.auth_email}', name='${info.auth_name}'`;
        if (info.auth_nick!=null) { insert_user += `, nick='${info.auth_nick}'`; }
        const res2 = await con.query(insert_user);
        ret.user_seq = res2.insertId;
      } else { 
        ret = res1[0];
      }
      console.log(ret);
      // social 추가.
      const insert_social = `INSERT INTO social SET vendor='${info.auth_type}', user_id='${info.auth_id}',
        user_seq=${ret.user_seq}, email='${info.auth_email}', name='${info.auth_name}'`;
      if (info.auth_nick!=null) { insert_social += `, nick='${info.auth_nick}'`; }
      const res3 = await con.query(insert_social);
    } else {
      ret = res0[0];
    }

    done(null, {
      'vendor'  : info.auth_type,
      'user_id' : info.auth_id,
      'email'   : info.email,
      'user_seq': ret.user_seq,
      'name'    : ret.name,
      'nick'    : ret.nick
    });
  } catch (err) {
    console.log(err);
    return done(err);
  }
}//}}}

//{{{ Facebook Login
// facebook 로그인
router.get('/facebook',
  passport.authenticate('facebook')
);
// facebook 로그인 연동 콜백
router.get('/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);
// facebook passport
passport.use(new FacebookStrategy({
    clientID: secrets.facebook.client_id,
    clientSecret: secrets.facebook.secret_id,
    callbackURL: secrets.facebook.callback_url,
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone',
      'updated_time', 'verified', 'displayName']
  }, function (accessToken, refreshToken, profile, done) {
    var _profile = profile._json;
    // console.log('Facebook login info');
    // console.info(_profile);
    loginByThirdparty({
      'auth_type' : 'facebook',
      'auth_id'   : _profile.id,
      'auth_email': _profile.email,
      'auth_name' : _profile.name,
      'auth_nick' : _profile.displayName
    }, done);
  }
));
//}}}

//{{{ Naver Login
// naver 로그인
router.get('/naver',
  passport.authenticate('naver')
);
// naver 로그인 연동 콜백
router.get('/naver/callback',
  passport.authenticate('naver', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);
// naver passport
passport.use(new NaverStrategy({
    clientID: secrets.naver.client_id,
    clientSecret: secrets.naver.secret_id,
    callbackURL: secrets.naver.callback_url
  },
  function (accessToken, refreshToken, profile, done) {
    var _profile = profile._json;
    // console.log('Naver login info');
    // console.info(_profile);
    loginByThirdparty({
      'auth_type': 'naver',
      'auth_id': _profile.id,
      'auth_name': _profile.nickname,
      'auth_email': _profile.email
    }, done);

  }
));
//}}}

//{{{ Kakao Login 
// kakao 로그인
router.get('/kakao',
  passport.authenticate('kakao')
);
// kakao 로그인 연동 콜백
router.get('/kakao/callback',
  passport.authenticate('kakao', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);
// kakao passport
passport.use(new KakaoStrategy({
    clientID: secrets.kakao.client_id,
    callbackURL: secrets.kakao.callback_url
  },
  function (accessToken, refreshToken, profile, done) {
    var _profile = profile._json;
    // console.log('Kakao login info');
    // console.info(_profile);
    loginByThirdparty({
      'auth_type': 'kakao',
      'auth_id': _profile.id,
      'auth_name': _profile.properties.nickname,
      'auth_email': _profile.id
    }, done);
  }
));
//}}}

//{{{ Local Login
// local login
router.post('/local', 
  passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}), // 인증실패시 401 리턴, {} -> 인증 스트레티지
  function (req, res) {
    res.redirect('/');
  }
);
// local passport
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true //인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
}, async (req, email, password, done) => {
  try {
    const con = await pool.getConnection();
    const result = await con.query(`SELECT * FROM user WHERE email = ?`, email);
    if (!result.length) {
      console.log('해당 유저가 없습니다');
      return done(false, null);
    } else {
      if (!bcrypt.compareSync(password, result[0].password)) {
        console.log('패스워드가 일치하지 않습니다');
        return done(false, null);
      } else {
        console.log('로그인 성공');
        return done(null, {
          email: result[0].email,
          name: result[0].name,
          nick: result[0].nick
        });
      }
    }
  } catch (err) {
    console.log('err :' + err);
    return done(false, null);
  }
}));
//}}}

module.exports = router;
