var schedule = require('node-schedule');
var dateFormat = require('dateformat');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('default.properties');
var fs = require('fs');
var path = require('path');


module.exports.scheduleJob = function () {
    if (properties.get('auto.start') === true) {
        console.log("Auto start!");
        startJob(properties.get('videos.jobCount.que'));
    } else {
        var cronString = properties.get('jobTime.second') + " "
                + properties.get('jobTime.minute') + " "
                + properties.get('jobTime.hour') + " "
                + properties.get('jobTime.day.of.month') + " "
                + properties.get('jobTime.month') + " "
                + properties.get('jobTime.day.of.week');
        console.log("starting job at " + cronString);
        var j = schedule.scheduleJob(cronString, function () {

            var targetFiles = gatherTargetFiles();

            if (targetFiles.length < properties.get('videos.jobCount.max')) {
                console.log("We're not backed up!");
                return;
            }

            startJob(properties.get('videos.jobCount.que'));
        });
    }
};

function gatherTargetFiles() {
    var pathToInput = properties.get('folder.input');
    var targetName = properties.get('target.name');
    var targetFileType = properties.get('target.file.type');
    return getFiles(pathToInput, targetName, targetFileType);
}

function startJob(fileCount) {
    var now = new Date();

    var pathToOutput = properties.get('folder.output');

    var pathToInput = properties.get('folder.input');
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

    encodeVideo(targetFiles, pathToOutput, pathToInput, targetFileType, fileCount);
}

function encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType, fileCount) {
    console.log("files left to encode: " + fileCount);
    var target = filesToEncode.pop();
    if (target !== undefined && fileCount > 0) {
        fileCount--;
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
                    if (progress.percentComplete / 10 === Math.floor(progress.percentComplete / 10))
                    {
                        console.log(
                                "Percent complete: %s, ETA: %s",
                                progress.percentComplete,
                                progress.eta
                                );
                    }
                })
                .on("end", function () {
                    console.log(target + " finished!");
                    encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType, fileCount);
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