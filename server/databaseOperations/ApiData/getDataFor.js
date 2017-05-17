var ApiData = require('./../../../model/schemas/ApiData');

function getDataFor(reportID) {
  ApiData.findOne({ report: reportID })
    .then(function (data) {
      return data;
    }).catch(function (error) {
      throw error;
    });
}

module.exports = getDataFor;
