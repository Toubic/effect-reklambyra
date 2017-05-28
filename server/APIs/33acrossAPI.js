'use strict';
var request = require('request');
var epochToDate = require('../helpers/epochToDate');
var relevantDate;
var secret_api_key = '6l303n3J6c3k7Q486k7R6W6G6r7P7s3V';
var site_guid = 'dQ3jXaM6qr4Pilacwqm_6l';
var api_url = 'https://api.tynt.com/publisher/v2/realtime_stats/page_copies';
var andSiteGuid = '?site_guid=';
var andApiKey = '&api_key=';
var andLimit = '&limit=';
var limit = 21;
var andCallback = '&callback=';
var callbackName = 'callbackName';
var andStartTime = '&start_time=';
//var twentyFourHoursInUnixTime = 86400;
var start_time = 86400// - twentyFourHoursInUnixTime;
var andEndTime = '&end_time=';

function month(access, unixTimeStamp) {
  var relevantDate = epochToDate(unixTimeStamp);
  socialAPI(relevantDate);

}

function daily() {
  var results = [pageCopiesAPI()];

  return new Promise(function (resolve) {

    Promise.all(results).then(function (result) {
      var resultObj = { across: { daily: result } }
      resolve(resultObj);
    })

  });



}

function pageCopiesAPI() {

  return new Promise(function (resolve) {

    var queryString = api_url + andSiteGuid + site_guid + andApiKey + secret_api_key + andStartTime + start_time + andLimit + limit;

    request(queryString, function (err, res, body) {
      if (err || !body) return resolve({ error: '33across API error: ' + err.message });

      var obj = JSON.parse(body);
      var resultObj = {};

      obj.forEach(function (page) {
        if (!resultObj[page.url]) {
          resultObj[page.url] = {};
          resultObj[page.url].total = page.total;
          resultObj[page.url].title = page.title;
          resultObj[page.url].short = page.short;
          resultObj[page.url].attributedLong = page.attributed_long;
          resultObj[page.url].nonAttributed_long = page.nonattributed_long;
        } else {
          resultObj[page.url].total += page.total;
          resultObj[page.url].short += page.short;
          resultObj[page.url].attributedLong += page.attributed_long;
          resultObj[page.url].nonAttributed_long += page.nonattributed_long;
        }
      });

      var returnObj = {
        pageCopies: resultObj
      };

      resolve(returnObj);
    });
  });
}

function socialAPI(date) {

  return new Promise(function (resolve) {
    var type = 'total';
    var queryString = 'https://api.tynt.com/publisher/v1/social/' + type + '?site_guid=' + site_guid + '&api_key=' + secret_api_key;
    request(queryString, function (err, res, body) {
      console.log(body);
      var obj = JSON.parse(body);
      console.log(obj);
      resolve(filterForMonth(obj, date))
    })

  })
}

function filterForMonth(results, date) {

  var returnObj = {
    shares: 0,
    visitors: 0,
  };

  results.data.forEach(function (result) {
    var resultDate = result['0'].split('/');
    var resultYear = resultDate[0];
    var resultMonth = resultDate[1];

    //todo detta funkar inte och behövs hanteras ordentligt
    if (resultMonth === (date.month.toString() + '0') && resultYear === date.year.toString()) {
      returnObj.shares += result[1];
      returnObj.visitors += result[2];
    }

  });
}


exports.daily = daily;
exports.month = month;