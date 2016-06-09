var schedule = require('node-schedule');
var dateFormat = require('dateformat');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('default.properties');
var fs = require('fs');
var path = require('path');


module.exports.scheduleJob = function () {
    var j = schedule.scheduleJob('*/5 * * * * *', function () {
        var now = new Date();

        var pathToInput = properties.get('folder.input');
        var targetName = properties.get('target.name');
        var targetFileType = properties.get('target.file.type');
        var targetFiles = getFiles(pathToInput, targetName, targetFileType);

        if (targetFiles.length < 7) {
            console.log("We're not backed up!");
            return;
        }
        
        console.log("lots of judies!");

//        var hbjs = require("handbrake-js");
// 
//hbjs.spawn({ input: "sample/poltergeist_1.mpg", output: "dope shit.m4v" })
//  .on("error", function(err){
//      console.log(err);
//    // invalid user input, no video found etc 
//  })
//  .on("progress", function(progress){
//    console.log(
//      "Percent complete: %s, ETA: %s",
//      progress.percentComplete,
//      progress.eta
//    );
//  });
//        fs.mkdir(dateFormat(now, "mm-dd-yyyy"), function (err) {
//                if (err) {
//                    console.log('ERROR: ' + err);
//                } else {
//                    console.log("folder made!");
//                }
//            });
    });
};

function getFiles(srcpath, targetName, targetFileType) {
    return fs.readdirSync(srcpath).filter(function (file) {
        var fileName = file.toLowerCase();
        return !fs.statSync(path.join(srcpath, file)).isDirectory() &&
                fileName.indexOf(targetName) > -1 &&
                fileName.indexOf(targetFileType) > -1;
    });
}