var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('default.properties');
var fs = require('fs');
var path = require('path');
var dateFormat = require('dateformat');

function gatherTargetFiles () {
    var pathToInput = properties.get('folder.input');
    var targetName = properties.get('target.name');
    var targetFileType = properties.get('target.file.type');
    return getFiles(pathToInput, targetName, targetFileType);
};

function startJob (fileCount) {
    var now = new Date();
    var pathToOutput = properties.get('folder.output');
    var pathToInput = properties.get('folder.input');
    var targetName = properties.get('target.name');
    var targetFileType = properties.get('target.file.type');
    var targetFiles = this.getFiles(pathToInput, targetName, targetFileType);
    pathToOutput += "\\" + dateFormat(now, "mm-dd-yyyy");
    makeFolder(pathToOutput, 0, targetFiles, pathToOutput, pathToInput, targetFileType, fileCount);
};

function makeFolder(path, tryCount, targetFiles, pathToOutput, pathToInput, targetFileType, fileCount) {
    var folderPath = path;
    if(tryCount !== 0) {
        folderPath = folderPath + "-" + tryCount;
    }
    //TODO read all of the folder names in the folder and then just increment the counter...
    fs.access(folderPath, fs.F_OK, function (err) {
        if (!err) {
            makeFolder(path, tryCount + 1, targetFiles, pathToOutput, pathToInput, targetFileType, fileCount);
        } else {
            fs.mkdir(folderPath, function (err) {
                if (err) {
                    console.log('ERROR: ' + err);
                } else {
                    encodeVideo(targetFiles, folderPath, pathToInput, targetFileType, fileCount);
                }
            });
        }
    });
}

function encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType, fileCount) {
    var start = new Date().getTime();
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
        var percentageComplete = 0;
        var hbjs = require("handbrake-js");
        hbjs.spawn(encodingOptions)
                .on("error", function (err) {
                    console.log("Errored on File -> Skipping");
                    encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType, fileCount + 1);
                    moveBadFile(pathToInput, target);
                })
                .on("progress", function (progress) {
                    if (Math.floor(progress.percentComplete / 10) > percentageComplete)
                    {
                        var end = new Date().getTime();
                        var time = (end - start)/1000;
                        percentageComplete++;
                        console.log(
                                "Percent complete: %s, Elapsed: %s, ETA: %s",
                                progress.percentComplete,
                                time,
                                progress.eta
                                );
                    }
                })
                .on("end", function () {
                    var end = new Date().getTime();
                    var time = (end - start)/1000;
                    console.log(target + " finished in " + time);
                    if (properties.get('target.delete')) {
                        fs.unlink(pathToInput + "\\" + target, function (err) {
                            if (err)
                                throw err;
                            console.log('Successfully deleted ' + target);
                        });
                    }
                    encodeVideo(filesToEncode, pathToOutput, pathToInput, targetFileType, fileCount);
                });
    } else {
        console.log("Jobs complete!");
    }
}

function moveBadFile(pathToInput, target)
{
    var unconvertableDir = properties.get('output.unconvertable.dir');
    fs.readdir(unconvertableDir, function (err, files) {
        if (err)
            console.log(err);
        var nextNumber = files.length + 1;
        while(files.indexOf("unconvertable_" + nextNumber + "." + properties.get('target.file.type')) > -1) {
            nextNumber += 1;
        }
        fs.rename(pathToInput + "\\" + target, unconvertableDir + "\\unconvertable_" + nextNumber + "." + properties.get('target.file.type'), function (err) {
            if (err)
                console.log(err);
        });
    });
}

function getFiles(srcpath, targetName, targetFileType) {
    return fs.readdirSync(srcpath).filter(function (file) {
        var fileName = file.toLowerCase();
        return !fs.statSync(path.join(srcpath, file)).isDirectory() &&
                fileName.indexOf(targetName) > -1 &&
                fileName.indexOf(targetFileType) > -1;
    });
}

module.exports = {
    moveBadFile: moveBadFile,
    getFiles: getFiles,
    startJob: startJob,
    gatherTargetFiles: gatherTargetFiles
};