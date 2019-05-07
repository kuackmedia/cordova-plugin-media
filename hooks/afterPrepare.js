#!/usr/bin/env node

'use strict';

var fs    = require('fs');
var plist = require('plist');  // www.npmjs.com/package/plist
var xml2js = require('xml2js');

module.exports = function (context) {
    var configPath = './config.xml';
    var configXml = fs.readFileSync(configPath).toString();
    xml2js.parseString(configXml, function(err, config){
        if (err) return console.error(err);
        // var escapedAppName = config.widget.name[0].split(" ").join("\\ ");
        var appName = config.widget.name[0];

        // plist
        var plistPath = context.opts.projectRoot + '/platforms/ios/'+ appName +'/'+ appName +'-Info.plist';
        var xml = fs.readFileSync(plistPath, 'utf8');
        var obj = plist.parse(xml);
        //
        if (!obj.hasOwnProperty('ITSAppUsesNonExemptEncryption')) {
            obj.ITSAppUsesNonExemptEncryption = false;
        }
        if (!obj.hasOwnProperty('NSLocationAlwaysUsageDescription') || obj.NSLocationAlwaysUsageDescription === '') {
            obj.NSLocationAlwaysUsageDescription = 'This app requires location access to function properly';
        }
        if (!obj.hasOwnProperty('NSLocationWhenInUseUsageDescription') || obj.NSLocationWhenInUseUsageDescription === '') {
            obj.NSLocationWhenInUseUsageDescription = 'This app requires location access to function properly';
        }
        // camera
        if (!obj.hasOwnProperty('NSCameraUsageDescription') || obj.NSCameraUsageDescription === '') {
            obj.NSCameraUsageDescription = 'This app requires camera access to take pictures';
        }
        if (!obj.hasOwnProperty('NSPhotoLibraryUsageDescription') || obj.NSPhotoLibraryUsageDescription === '') {
            obj.NSPhotoLibraryUsageDescription = 'This app requires camera access get pictures from there';
        }
        if (!obj.hasOwnProperty('NSPhotoLibraryAddUsageDescription') || obj.NSPhotoLibraryAddUsageDescription === '') {
            obj.NSPhotoLibraryAddUsageDescription = 'This app requires photo library access to save pictures';
        }
        // write
        xml = plist.build(obj);
        fs.writeFileSync(plistPath, xml, { encoding: 'utf8' });

        // manifest
        var manifestPath = context.opts.projectRoot + '/platforms/android/app/src/main/AndroidManifest.xml';
        var androidManifest = fs.readFileSync(manifestPath).toString();
        if (androidManifest) {
            xml2js.parseString(androidManifest, function(err, manifest) {
                if (err) return console.error(err);
                
                var manifestRoot = manifest['manifest'];
                
                var applicationTag = manifestRoot.application[0]['$'];
                applicationTag['android:usesCleartextTraffic'] = true;
                
                var activityTag = manifestRoot.application[0].activity[0]['$'];
                activityTag['android:windowSoftInputMode'] = 'adjustPan';

                var builder = new xml2js.Builder();
                fs.writeFileSync(manifestPath, builder.buildObject(manifest), { encoding: 'utf8' });
            })
        }
    });
};
