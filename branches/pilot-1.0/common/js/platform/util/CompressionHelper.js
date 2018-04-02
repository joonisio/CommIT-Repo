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

define("platform/util/CompressionHelper", 
["dojo/_base/array",
 "dojox/encoding/bits",
 "dojox/encoding/compression/lzw"], 
function(arrayUtil, bits, lzw){
	
	var string2BitsArray = function(text){
		var bitsArray = [];
		for(var i = 0; i < text.length; ++i){
			bitsArray.push(text.charCodeAt(i));
		}
		return bitsArray;
	};	
	// Temporary removed compression due to 108578
	return {
/**@memberOf platform.util.CompressionHelper */
		compress: function(text) {
			/*var encoder = new lzw.Encoder(128);
			var outputStream = new bits.OutputStream();
			
			arrayUtil.forEach(string2BitsArray(text), function(v){
				encoder.encode(v, outputStream); 
			});
			encoder.flush(outputStream);
			
			return outputStream.getBuffer();*/
			return text;
		},
		
		decompress: function(text) {
			/*var decoder = new lzw.Decoder(128);
			var len = text.length;
			var inputStream = new bits.InputStream(text, len * 8);
			var text = [];
			var index = 0;
			while(true){
				var v = decoder.decode(inputStream);
				if (v.charCodeAt(0) === 0){
					break;
				}
				text.push(v);
				index += v.length;
			}
			return text.join("");*/		
			return text;
		}
	};
});
