
/* JavaScript content from js/platform/codeScanner/nativeBridge/CodeScannerPlugin.js in folder common */

/* JavaScript content from js/platform/codeScanner/nativeBridge/CodeScannerPlugin.js in folder common */

/* JavaScript content from js/platform/codeScanner/nativeBridge/CodeScannerPlugin.js in folder common */
/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2013 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp. 
 *
 */

/**
 * createdBy: lcassa@br.ibm.com 
 * 
 * This class is responsible for communicating with the Java side CodeScannerPlugin
 */
define("platform/codeScanner/nativeBridge/CodeScannerPlugin",
["dojo/_base/declare",
  "dojo/_base/lang"],
function (declare, lang) {
    var codeScannerPlugin = {
        service: "CodeScanner",

        /*
		 * send a request via Cordova to the codeScanner android native side
		 * codeScannerType is the type codeScannerType
		 * action is the action/method to be called
		 * parameters is a JSONArray with the parameters for the request
		 */
/**@memberOf platform.codeScanner.nativeBridge.CodeScannerPlugin */
        sendRequest: function (/*String*/codeScannerType, /*String*/method, /*JSONArray*/parameters, /*Deferred*/ deferred) {

            console.log("[platform.codeScanner.CodeScanner] entering sendRequest...");
            console.log("[platform.codeScanner.CodeScanner] deferred is: " + deferred);

            if (typeof cordova === "undefined") {
                console.error("[platform.codeScanner.CodeScanner] unable to find cordova object");
                return;
            }

            var action;
            if (WL.Client.getEnvironment() == WL.Environment.ANDROID) {
                action = codeScannerType + ":" + method;
            }
            else {
                action = method;
            }

            var windows8_flag = WL.Client.getEnvironment() == 'windows8' ? true : false;

            if (typeof deferred != 'undefined') {
                console.log("[platform.codeScanner.codeScanner] Calling codeScanner with deferred object");
                if (windows8_flag) {
                    this.scan(
                        function (object) { console.log("[platform.codeScanner.CodeScanner] resolving with object: " + object); deferred.resolve(object); },
                        function (message) { console.log("[platform.codeScanner.CodeScanner] failed to resolve, error message: " + message); deferred.reject(message); },
                        parameters);

                }
                else {
                    cordova.exec(
                        function (object) { 
                        	
                        	console.log("[platform.codeScanner.CodeScanner] resolving with object: " + object); 
                        	//Need to suppress the back button if an empty result was clicked.
                        	if (UI && object == "") {
    							UI.suppressBackButton();
    						} 
                        	deferred.resolve(object); },
                        function (message) { console.log("[platform.codeScanner.CodeScanner] failed to resolve, error message: " + message); deferred.reject(message); },
                        this.service,
                        action,
                        parameters
                    );
                }
            }
            else {

                console.log("[platform.codeScanner.CodeScanner] sending: " + action + " - " + JSON.stringify(parameters));
                if (windows8_flag) {
                    this.scan(
                        function () { },
                        function (message) { },
                        parameters);
                } else {
                    cordova.exec(
                        function () { },
                        function (message) { },
                        this.service,
                        action,
                        parameters
                    );
                }
            }

        },

        /*Windows 8 scan function starts here. Should be moved to a different place
        */
        scan: function (success, fail, args) {

            //Html elements for camera display 
            var capture_frame;
            var detection_line;
            var cancel_scan_button;

            var media_capture;  //Windows Media Capture object
            var reader;

            /**
             * Creates the scan screen elements and the media capture windows object
             */
            function createCaptureFrame() {

                media_capture = new Windows.Media.Capture.MediaCapture();
                //media_capture = new Windows.Media.Capture.CameraCaptureUI();


                capture_frame = document.createElement("video");
                capture_frame.style.cssText = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index:995";

                detection_line = document.createElement('div');
                detection_line.style.cssText = "position: absolute; left:0; top: 50%; width: 100%; height: 3px; background: red; z-index:996";


                cancel_scan_button = document.createElement("button");
                cancel_scan_button.innerText = "Cancel";
                cancel_scan_button.style.cssText = "position: fixed; right: 0; bottom: 0; display: block; margin: 20px; z-index:996";
                cancel_scan_button.addEventListener('click', cancelScan, false);

            }


            /**
             * Capture images from video stream for barcode search
             */
            function startCaptureFrame() {

                //Enumerate video capture devices and select the back one if available
                Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture)
                           .done(function (video_devices) {
                               if (video_devices.length > 0) {
                                   var device_id = null;
                                   video_devices.forEach(function (device) {
                                       if (device.enclosureLocation == null && device_id == null) {
                                           device_id = device.id;

                                       }
                                       else if (device.enclosureLocation.panel && device.enclosureLocation.panel == Windows.Devices.Enumeration.Panel.back) {
                                           device_id = device.id;
                                       }
                                   })
                                   if (device_id) {
                                       var capture_init_settings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                                       capture_init_settings.videoDeviceId = device_id;
                                       //capture_init_settings.audioDeviceId = "";
                                       capture_init_settings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;

                                       capture_init_settings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;

                                       media_capture.initializeAsync(capture_init_settings).done(function () {

                                           //Set focus if available
                                           var video_controller = media_capture.videoDeviceController;

                                           if (video_controller.focusControl && video_controller.focusControl.supported) {
                                               if (video_controller.focusControl.configure) {
                                                   var focus_setting = new Windows.Media.Devices.FocusSettings();
                                                   focus_setting.autoFocusRange = Windows.Media.Devices.AutoFocusRange.macro;

                                                   var has_continous_focus = video_controller.focusControl.supportedFocusModes.indexOf(Windows.Media.Devices.FocusMode.continuous).returnValue;
                                                   var has_auto_focus = video_controller.focusControl.supportedFocusModes.indexOf(Windows.Media.Devices.FocusMode.auto).returnValue;

                                                   if (has_continous_focus) {
                                                       focus_setting.mode = Windows.Media.Devices.FocusMode.continuous;
                                                   } else if (has_auto_focus) {
                                                       focus_setting.mode = Windows.Media.Devices.FocusMode.auto;
                                                   }

                                                   video_controller.focusControl.configure(focus_setting);
                                                   video_controller.focusControl.focusAsync();
                                               }
                                           }

                                           //Gather device properties -> resolution
                                           //Microsoft open technologies
                                           var stream_properties = video_controller.getAvailableMediaStreamProperties(Windows.Media.Capture.MediaStreamType.videoRecord);

                                           stream_properties = Array.prototype.slice.call(stream_properties);
                                           stream_properties = stream_properties.filter(function (prop) {

                                               return prop.subtype !== "Unknown";
                                           }).sort(function (p1, p2) {
                                               // sort properties by resolution
                                               return p2.width - p1.width;
                                           });

                                           //Increase Render speed.
                                           var maxResolutionProps = null;
                                           for (var i = 0; i < stream_properties.length; i++)
                                           {
                                               if (stream_properties[i].subtype == "YUY2" && stream_properties[i].bitrate < 99999999 /*stream_properties[i].frameRate.numerator > 10*/) {
                                                   maxResolutionProps = stream_properties[i];
                                                   break;
                                               }
                                           }
                                           if(maxResolutionProps == null)
                                             maxResolutionProps = stream_properties[0];

                                           video_controller.setMediaStreamPropertiesAsync(Windows.Media.Capture.MediaStreamType.videoRecord, maxResolutionProps).done(function () {
                                               // handle portrait orientation
                                               if (Windows.Graphics.Display.DisplayProperties.currentOrientation == Windows.Graphics.Display.DisplayOrientations.portrait) {
                                                   media_capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.clockwise90Degrees);
                                                   capture_frame.msZoom = true;
                                               } else if (Windows.Graphics.Display.DisplayProperties.currentOrientation == Windows.Graphics.Display.DisplayOrientations.landscapeFlipped) {
                                                   media_capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.clockwise180Degrees);
                                               } else if (Windows.Graphics.Display.DisplayProperties.currentOrientation == Windows.Graphics.Display.DisplayOrientations.portraitFlipped) {
                                                   media_capture.setPreviewRotation(Windows.Media.Capture.VideoRotation.clockwise270Degrees);
                                                   capture_frame.msZoom = true;
                                               }

                                               capture_frame.src = URL.createObjectURL(media_capture, { oneTimeOnly: true });
                                               capture_frame.play();

                                               document.body.appendChild(capture_frame);
                                               document.body.appendChild(detection_line);
                                               document.body.appendChild(cancel_scan_button);

                                               startBarcodeSearch(maxResolutionProps.width, maxResolutionProps.height);
                                           });
                                       },
                                       function (err) {
                                           console.log(err);
                                       });

                                   }
                                   else {
                                       console.log("No back camera found");
                                   }
                               } else {
                                   console.log("No camera found");
                               }
                           });
            }

            function startBarcodeSearch(width, height) {

                reader = new WinRTBarcodeReader.Reader();
                reader.init(media_capture, width, height);
                reader.readCode().done(function (result) {
                    destroyPreview();
                    success({ text: result && result.text, format: result && result.barcodeFormat, cancelled: !result });
                }, function (err) {
                    destroyPreview();
                    fail(err);
                });
            }

            /**
             * Removes capture frame and destroys html screen elems
             */
            function destroyPreview() {

                capture_frame.pause();
                capture_frame.src = null;

                media_capture && media_capture.stopRecordAsync();
                media_capture = null;

                reader && reader.stop();
                reader = null;

                document.body.removeChild(capture_frame);
                document.body.removeChild(detection_line);
                document.body.removeChild(cancel_scan_button);

            }

            /**
             * Stops capture frame and then call success callback with cancelled=true
             *
             */
            function cancelScan() {
                reader && reader.stop();
            }

            try {
                createCaptureFrame();
                startCaptureFrame();
            } catch (ex) {
                fail(ex);
            }
        },

    };

    return lang.setObject("platform.codeScanner.nativeBridge.CodeScannerPlugin", codeScannerPlugin);
});
