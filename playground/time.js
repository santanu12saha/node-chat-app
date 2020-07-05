var moment = require('moment');
// Jan Ist 1970 00:00:00 am

var date = moment();
date.add(1, 'year').subtract(9, 'month');
console.log(date.format('MMM Do, YYYY'));

var date1 = moment();
console.log(date.format('h:mm a'));

var someTimestamp = moment().valueOf();
console.log(someTimestamp);

var createdAt = 1234;
var createdAtDate = moment(createdAt);
console.log(createdAtDate.format('h:mm a'));