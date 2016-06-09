var schedule = require('node-schedule');
var dateFormat = require('dateformat');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('default.properties');
var fs = require('fs');
var path = require('path');


module.exports.scheduleJob = function () {
    var cronString = properties.get('jobTime.second') + " "
            + properties.get('jobTime.minute') + " "
            + properties.get('jobTime.hour') + " "
            + properties.get('jobTime.day.of.month') + " "
            + properties.get('jobTime.month') + " "
            + properties.get('jobTime.day.of.week');
    var j = schedule.scheduleJob(cronString, function () {
        var now = new Date();

        var pathToInput = properties.get('folder.input');
        var pathToOutput = properties.get('folder.output');
        var targetName = properties.get('target.name');
        var targetFileType = properties.get('target.file.type');
        var targetFiles = getFiles(pathToInput, targetName, targetFileType);

        pathToOutput += "\\" + dateFormat(now, "mm-dd-yyyy");

        fs.mkdir(pathToOutput, function (err) {
            if (err) {
                console.log('ERROR: ' + err);
            } else {
                console.log("folder made!");
            }
        });

        if (targetFiles.length < 7) {
            console.log("We're not backed up!");
            return;
        }

        encodeVideo(targetFiles, pathToOutput, pathToInput, targetFileType, properties.get('videos.jobCount.max'));
    });
};

function encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType, fileCount) {
    fileCount--;
    var target = filesToEncode.pop();
    if (target !== undefined && fileCount > 0) {
        var outputName = target.replace(targetFileType, properties.get('output.format'));
        var encodingOptions = {
            input: pathToInput + "\\" + target,
            output: pathToOutput + "\\" + outputName,
            height: properties.get('output.height'),
            encoder: properties.get('output.encoder'),
            rate: properties.get('output.frameRate'),
            quality: properties.get('output.quality')
        };

        var hbjs = require("handbrake-js");
        hbjs.spawn(encodingOptions)
                .on("error", function (err) {
                    console.log(err);
                })
                .on("progress", function (progress) {
                    console.log(
                            "Percent complete: %s, ETA: %s",
                            progress.percentComplete,
                            progress.eta
                            );
                })
                .on("end", function () {
                    console.log(target + " finished!");
                    encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType);
                });
    } else {
        console.log("Jobs complete!");
    }
}

function getFiles(srcpath, targetName, targetFileType) {
    return fs.readdirSync(srcpath).filter(function (file) {
        var fileName = file.toLowerCase();
        return !fs.statSync(path.join(srcpath, file)).isDirectory() &&
                fileName.indexOf(targetName) > -1 &&
                fileName.indexOf(targetFileType) > -1;
    });
}