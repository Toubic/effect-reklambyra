'use strict';

var getAPIAccesses = require('./databaseOperations/ApiAccess/getAPIAccesses');
var createReport = require('./databaseOperations/Report/createReport');
var createApiData = require('./databaseOperations/ApiData/createApiData');
var currentDate;

/**
 Takes all the api access objects from db, cycles them and calls the callAllAPIs script for all of them
 need a current date as well.
 */

module.exports = function (date) {
  currentDate = date;

  getAPIAccesses()
      .then(function (APIAccesses) {
        APIAccesses.forEach(function (APIAccess) {
          updateEach(APIAccess);
        });
      }).catch(function (error) {
        throw error;
      });

  //  Creates report + data per for each user in db based on activated providers
  // (facebook, instagram) etc
  var updateEach = function (APIAccess) {

    createApiData(createReport(APIAccess.user, currentDate.getMonth(), currentDate.getFullYear()));
  };
};
