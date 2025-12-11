<!--
function Tags(maxChNr, taglen) {
	this.maxChannels = maxChNr;
	this.TAGLEN = taglen;
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
	this.render = function() {
		try {
			setTag(this.tag);
		} catch (err) { }
	}
	this.getTag = function() {
		return this.tag;
	}
}
// -->
