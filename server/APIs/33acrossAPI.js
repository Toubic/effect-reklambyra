'use strict';

var errorHandler = require('../errorHandler');
var request = require('request');
var dotenv = require('dotenv');
var epochToDate = require('../helpers/epochToDate');
var dateToEpoch = require('../helpers/dateToEpoch');
var decrypt = require('../helpers/decrypt');
var api_url = 'https://api.tynt.com/publisher/v2/realtime_stats/page_copies';
var andSiteGuid = '?site_guid=';
var andApiKey = '&api_key=';
var andLimit = '&limit=';
var limit = 21;
var andCallback = '&callback=';
var callbackName = 'callbackName';
var andStartTime = '&start_time=';
//var twentyFourHoursInUnixTime = 86400;
var start_time = 86400;// - twentyFourHoursInUnixTime;
var andEndTime = '&end_time=';

var secret_api_key;
var site_guid;

dotenv.load();

/**
 * Data för 33Across behövs hämtas både dagligen och månadsvis. PageCopies
 * är endast tillgänglig i form av daglig statistik, medans social API med kopierat
 * socialt innehåll kan hämtas för upp till 12 veckor båkat.
 * Därför använder callAPIs monthly funktionen och daily är schemalaggd.
 */

function monthly(access, unixTimeStamp) {
  secret_api_key = decrypt.decryptText(access.secret_api_key);
  site_guid = decrypt.decryptText(access.site_guid);

  var relevantDate = epochToDate(unixTimeStamp);
  var currentDate = epochToDate(dateToEpoch(new Date()));

  return new Promise(function (resolve) {

    // across ger endast data för 12 veckor bakåt i tiden, därför anropas inte APIet med datum som är mer än 3 månader från idag.
    if (currentDate.year === relevantDate.year && currentDate.month - relevantDate.month < 3) {

      var results = [socialAPI(relevantDate)];

      Promise.all(results).then(function (result) {
        if (result.error) errorHandler.APIResolve(access, result, '33across');

        var resultObj = { across: { monthly: result } };
        resolve(resultObj);
      });

    } else {
      var e = relevantDate.full + ' är mer än 12 veckor ifrån ' + currentDate.full;
      resolve({ across: { error: e } });
      errorHandler.log(e, '33accross api called with date past 12w');
    }
  });
}

function daily(access) {
  secret_api_key = decrypt.decryptText(access.secret_api_key);
  site_guid = decrypt.decryptText(access.site_guid);
  var results = [pageCopiesAPI()];

  return new Promise(function (resolve) {
    Promise.all(results).then(function (result) {
      var resultObj = { across: { daily: result } };
      resolve(resultObj);
    });
  });
}

function pageCopiesAPI() {
  return new Promise(function (resolve) {

    var queryString = api_url + andSiteGuid + site_guid + andApiKey + secret_api_key +
        andStartTime + start_time + andLimit + limit;

    request(queryString, function (err, res, body) {
      if (err || !body) {
        return resolve({ error: '33across page copies API error: ' + err.message });
      }

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
        pageCopies: resultObj,
      };

      resolve(returnObj);
    });
  });
}

function socialAPI(date) {
  return new Promise(function (resolve) {
    var type = 'total';
    var queryString = 'https://api.tynt.com/publisher/v1/social/' + type + '?site_guid='
        + site_guid + '&api_key=' + secret_api_key;

    // ger data för 12 veckor tillbaka indelat på week_ending där sista dag är Söndag
    // t ex 2017-03-26, 2017-04-30, 2017-05-21
    request(queryString, function (err, res, body) {
      if (err || !body) {
        return resolve({ error: '33across social API error: ' + err.message });
      }

      try {
        var obj = JSON.parse(body);
        resolve(filterForMonth(obj, date));
      } catch (e) {
        errorHandler.log(e, '33across API');
        resolve({ error: e.message });
      }

    });
  });
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

    //  todo vet inte hur addthis representerar januari, ska addedMonth användas istället?
    if (resultMonth === (date.monthWithZeroString) && resultYear === date.year.toString()) {
      returnObj.shares += result[1];
      returnObj.visitors += result[2];
    }
  });

  return returnObj;
}

exports.daily = daily;
exports.monthly = monthly;
