'use strict';
var dotenv = require('dotenv');
dotenv.load();

//https://github.com/jlobos/neo-instagram
var Instagram = require('neo-instagram');
var client = new Instagram({
  client_id: process.env.INSTAGRAM_CLIENT_ID,
  client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
});

//todo
/**
 * Even though our access tokens do not specify an expiration time, your app should handle the case that either the user revokes access, or Instagram expires the token after some period of time. If the token is no longer valid, API responses will contain an “error_type=OAuthAccessTokenException”. In this case you will need to re-authenticate the user to obtain a new valid token.
 In other words: do not assume your access_token is valid forever.
 * @param access
 */

module.exports = function (access) {
  var tokenObj = {access_token: access.accessToken};
  var userId = access.extraParams.user.id.toString();

  return new Promise(function (resolve, reject) {

    client.get('users/self/media/recent', tokenObj).then(function (user) {

      var returnObj = {
        instagram: {
          totalLikes: totalLikesCount(user.data)
        }
      };

      resolve(returnObj);
      /**
       * { data:
   { id: '279831127',
     username: 'mrwwwo',
     profile_picture: 'https://scontent.cdninstagram.com/t51.2885-19/11939502_451578088380268_1972812355_a.jpg',
     full_name: 'LW',
     bio: '沪',
     website: '',
     counts: { media: 122, follows: 70, followed_by: 61 } },
  meta: { code: 200 } }
       { pagination: {},
         data:
          [array of media objects]
            */
    });
  });

  // client.get('users/self', tokenObj).then(function (user) {
  //   console.log(user);
  // });
};


function totalLikesCount(recentMedias) {
  var totalLikes = 0;

  recentMedias.forEach(function (media) {
    /**
     { id: '658462253142614877_279831127',
        user: [Object],
        images: [Object],
        created_time: '1392714839',
        caption: null,
        user_has_liked: false,
        likes: [Object],
        tags: [],
        filter: 'Lo-fi',
        comments: [Object],
        type: 'image',
        link: 'https://www.instagram.com/p/kjU-44kaNd7aaYPUz8BXN7ClYUzL_sGDvYNRU0/',
        location: null,
        attribution: null,
        users_in_photo: [] },
     **/

    totalLikes += media.likes.count;
  });

  return totalLikes;

}