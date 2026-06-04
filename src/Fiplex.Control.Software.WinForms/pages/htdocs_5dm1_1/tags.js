function Tags() {
	this.TAGLEN = 30;
	this.tag = "";
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
	this.isEmpty = function(){
		for (var i = 0; i < this.tag.length && i < this.TAGLEN; i++) {
			var c = this.tag.charCodeAt(i);
			if (c != 0x20) return false;
		}
		return true;
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
		str = str.trim();
		for (var j = 0; j < this.TAGLEN; ++j)
			str += ' ';
		str = str.slice(0, this.TAGLEN);
		return str;
	}
}
