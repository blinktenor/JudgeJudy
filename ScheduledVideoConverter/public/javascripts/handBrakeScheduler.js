var schedule = require('node-schedule');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('default.properties');
var handbrakeAction = require('./handbrakeAction.js');

module.exports.scheduleJob = function () {
    if (properties.get('auto.start') === true) {
        console.log("Auto start!");
        handbrakeAction.startJob(properties.get('videos.jobCount.que'));
    } else {
        var cronString = properties.get('jobTime.second') + " "
                + properties.get('jobTime.minute') + " "
                + properties.get('jobTime.hour') + " "
                + properties.get('jobTime.day.of.month') + " "
                + properties.get('jobTime.month') + " "
                + properties.get('jobTime.day.of.week');
        console.log("starting job at " + cronString);
        var j = schedule.scheduleJob(cronString, function () {

            var targetFiles = handbrakeAction.gatherTargetFiles();
            if (targetFiles.length < properties.get('videos.jobCount.max')) {
                console.log("We're not backed up!");
                return;
            }

            handbrakeAction.startJob(properties.get('videos.jobCount.que'));
        });
    }
};