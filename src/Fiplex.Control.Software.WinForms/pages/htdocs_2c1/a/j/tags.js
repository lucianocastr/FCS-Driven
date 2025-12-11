function Tags() {
	this.TAGLEN = 730;
	this.tag = "";
	this.parse = function(sr) {
		try {
			this.tag = "";
			for (var i = 0; i < sr.length && i < 2*this.TAGLEN; i += 2) {
				var hexnum = sr.substr(i, 2);
				var num = parseInt(hexnum, 16);
				if (isNaN(num))
					this.tag += " ";
				else
					this.tag += String.fromCharCode(num);
			}
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
		} catch(err) {}
	}
	this.render = function() {
		try {
			setTag(this.tag);
		} catch (err) { }
	}
	this.getTag = function() {
		return this.tag;
	}
	this.format = function(str) {
		//str = str.trim();
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
}
