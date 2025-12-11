function Tags() {
	this.TAGLENDEVICE = 30;
	this.MAXDEVICES = 9;
	this.TAGLEN = this.TAGLENDEVICE*this.MAXDEVICES;
	this.tag = ""; //tag master + 8remotos concatenado
	this.tagDevices = [];
	
	for (var k=0;k<this.MAXDEVICES;k++)
		this.tagDevices.push("");
	
	this.parse = function(sr) {
		try {
			this.tag = "";
			for (var i = 0; i < sr.length && i < 2*this.TAGLEN; i += 2) {
				var hexnum = sr.substr(i, 2);
				var num = parseInt(hexnum, 16);
				if (isNaN(num))
					this.tag += "&nbsp;";
				else
					this.tag += String.fromCharCode(num);
			}
			this.splitTags();
		} catch(err) { }
	}
	this.parseRawText = function(sr) {
		try {
			this.tag = "";
			for (var i = 0; i < sr.length && i < this.TAGLEN; i++) {
				var c = sr.charCodeAt(i);
				if (c >= 0x20 && c < 0x7F) {
					this.tag += sr[i];
				} else {
					this.tag += " ";
				}
			}
			this.splitTags();
		} catch(err) {}
	}
	this.splitTags = function(){
		var i=0;
		for(var k=0;k<this.MAXDEVICES;k++){
			this.tagDevices[k] = this.tag.substr(k*this.TAGLENDEVICE,this.TAGLENDEVICE);
		}
	}
	this.render = function() {
		for(var k=0;k<this.MAXDEVICES;k++){
			try {
				setTag(this.tagDevices[k], k);
			} catch (err) { }
		}
	}
	this.format = function(str) {
		str = str.trim();
		for (var j = 0; j < this.TAGLEN; ++j)
			str += ' ';
		str = str.slice(0, this.TAGLEN);
		var tagstr = '';
		for (var j = 0; j < this.TAGLEN; ++j) {
			var num = str.charCodeAt(j);
			var hexnum;
			if (!isNaN(num))
				hexnum = '00' + num.toString(16);
			else
				hexnum =  '20';
			tagstr += hexnum.slice(-2);
		}
		return tagstr;
	}
	this.formatRowText = function(str) {
		str = str.trim();
		for (var j = 0; j < this.TAGLENDEVICE; ++j) {
			str += ' ';
		}
		str = str.slice(0, this.TAGLENDEVICE);
		var tagstr = correctASCIIOnlyText(str);
		return tagstr;
	}
}

function SerialNrRemotes() {
	this.SERIALLENDEVICE = 15;
	this.MAXDEVICES = 9;
	this.SERIALLEN = this.SERIALLENDEVICE*this.MAXDEVICES;
	this.serialNr = ""; //serial master + 8remotos concatenado
	this.serialNrDevices = [];
	
	for (var k=0;k<this.MAXDEVICES;k++)
		this.serialNrDevices.push("");
	
	this.parse = function(sr) {
		try {
			this.serialNr = "";
			for (var i = 0; i < sr.length && i < 2*this.SERIALLEN; i += 2) {
				var hexnum = sr.substr(i, 2);
				var num = parseInt(hexnum, 16);
				if (isNaN(num))
					this.serialNr += "&nbsp;";
				else
					this.serialNr += String.fromCharCode(num);
			}
			this.splitSerials();
		} catch(err) { }
	}
	this.parseRawText = function(sr) {
		try {
			this.serialNr = "";
			for (var i = 0; i < sr.length && i < this.SERIALLEN; i++) {
				var c = sr.charCodeAt(i);
				if (c >= 0x20 && c < 0x7F) {
					this.serialNr += sr[i];
				} else {
					this.serialNr += " ";
				}
			}
			this.splitSerials();
		} catch(err) {}
	}
	this.splitSerials = function(){
		var i=0;
		for(var k=0;k<this.MAXDEVICES;k++){
			this.serialNrDevices[k] = this.serialNr.substr(k*this.SERIALLENDEVICE,this.SERIALLENDEVICE);
		}
	}
	this.render = function() {
		for(var k=1;k<this.MAXDEVICES;k++){
			try {
				setSerialNr(this.serialNrDevices[k], k);
			} catch (err) { }
		}
	}
}

function VersionRemotes() {
	this.VERSIONLENMASTER = 8;
	this.VERSIONLENREMOTE = 4;
	this.MAXDEVICES = 9;
	this.VERSIONLEN = (this.VERSIONLENMASTER + this.VERSIONLENREMOTE*(this.MAXDEVICES-1));
	this.version = ""; //version master + 8remotos concatenado
	this.versionDevices = [];
	
	for (var k=0;k<this.MAXDEVICES;k++)
		this.versionDevices.push([]);
	
	this.parse = function(sr) {
		this.version = "";
		var d = 0;
		var s = 0;
		for (var i = 0; i < sr.length && i < 2*this.VERSIONLEN; i += 2) {
			var hexnum = sr.substr(i, 2);
			try {
				num = parseInt(hexnum, 16);
			} catch(e) { num = 0; }
			this.versionDevices[d].push(num);
			if ( d == 0) {
				if ( ++s >= this.VERSIONLENMASTER ) {
					s = 0;
					d++;
				}
			} else {
				if ( ++s >= this.VERSIONLENREMOTE ) {
					s = 0;
					d++
				}
			}
		}
	}
	this.render = function(n) {
		for(var k=1;k<this.MAXDEVICES;k++){
			var v = "";
			for ( var i = 0; i < this.VERSIONLENREMOTE; i++ ) {
				if ( i > 0 ) {
					v += '.';
				}
				v += this.versionDevices[k][i];
			}
			if (v=="0.0.0.0") v="";
			try {
				setVersion(v, k);
			} catch (err) { }
		}
	}
}