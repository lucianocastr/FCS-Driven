<!--
function Version() {
	this.fwStr = "---";
	this.swStr = "---";
	this.ethStr = "---";
	this.hasEth = false;
	this.ethSz = 3;
	this.parse = function(sr) {
		try {
			if (sr.length != this.frmLengths.L10 
			    && sr.length != this.frmLengths.L16) {
				return -1;
			} else if (sr.length == this.frmLengths.L16) {
				this.hasEth = true;
			} else {
				this.hasEth = false;
			}
			var s = [];
			for (var i = 0; i < sr.length; i += 2) {
				var n = parseInt(sr.substr(i, 2), 16);
				if (isNaN(n))
					return -1;
				s.push(n);
			}
			var i = 0;
			this.fwMain = s[i++];
			this.fwSub = s[i++];
			this.fwMsb = s[i++];
			this.swMain = s[i++];
			this.swSub = s[i++];
			this.eth = [];
			if (this.hasEth) {
				var allzero = true;
				for (var j = 0; j < this.ethSz; ++j) {
					this.eth.push(s[i++]);
					if (this.eth[j] != 0) {
						allzero = false;
					}
				}
				if (allzero) {
					this.hasEth = false;
				}
			}
			this.makeStr();
			return 0;
		} catch (err) { }
	}
	this.makeStr = function() {
		var r =  ''+this.fwMain+'.';
		var s = ('00'+this.fwSub).slice(-2);
		r += s+'-';
		var n = this.fwMsb > 99 ? 3 : 2;
		s = ('00'+this.fwMsb).slice(-n);
		r += s;
		this.fwStr = r;
		r = ''+this.swMain+'.';
		s = ('00'+this.swSub).slice(-2);
		r += s;
		this.swStr = r;
		if (this.hasEth) {
			r = this.eth[0];
			for (var i = 1; i < this.eth.length; ++i) {
				s = ('00'+this.eth[i]).slice(-2);
				r += '.' + s;
			}
			this.ethStr = r;
		}
	}
	this.store = function(sr) {
		localStorage.setItem(prjname+"_versionFrame_"+window.location.host, sr);
	}
	this.retrieve = function() {
		return localStorage.getItem(prjname+"_versionFrame_"+window.location.host);
	}
	this.render = function() {
		try {
			var el = window.parent.navi.document.getElementById('fwBox');
			if (el) {
				el.innerHTML = this.fwStr;
			}
			el = window.parent.navi.document.getElementById('swBox');
			if (el) {
				el.innerHTML = this.swStr;			
			}
			el = window.parent.navi.document.getElementById('serverVer');
			if (el) {
				el.style.display = (this.hasEth || !isPCstyle) ? "inline" : "none";
			}
			el = window.parent.navi.document.getElementById('serverBox');
			if (el) {
				el.style.display = (this.hasEth || !isPCstyle) ? "inline" : "none";
				if (this.hasEth) {
					el.innerHTML = this.ethStr;
				}
			}
			var lnk = window.parent.navi.document.getElementById('spectrum');
			if (typeof(lnk) != 'undefined' && lnk) {
				if (this.isFwNewSpect()) {
					lnk.href = "/spect.zhtml";
				} else {
					lnk.href = "/spectrum.zhtml";
				}
			}
		} catch (err) { }
	}
	this.isUndefined = function() {
		return (typeof(this.fwMsb) === 'undefined' || isNaN(this.fwMsb));
	}
	this.isFwNewSpect = function() {
		if (typeof(this.fwMsb) != 'undefined' && !isNaN(this.fwMsb)) {
			if (this.fwMsb & this.fwBits.SPECT) {
				return true;
			}
		}
		return false;
	}
	this.isFwBwAdj = function() {
		if (typeof(this.fwMsb) != 'undefined' && !isNaN(this.fwMsb)) {
			if (this.fwMsb & this.fwBits.CHADJ) {
				return true;
			}
		}
		return false;
	}
	this.compareSw = function(sr) {
		var s = [];
		sr = ("0000"+sr).substr(-4);
		for (var i = 0; i < sr.length && i < 4; i += 2) {
			var n = parseInt(sr.substr(i, 2), 16);
			if (isNaN(n))
				return -1;
			s.push(n);
		}
		if (this.swMain < s[0]) {
			return -1;
		}
		if (this.swMain > s[0]) {
			return 1;
		}
		if (this.swSub < s[1]) {
			return -1;
		}
		if (this.swSub > s[1]) {
			return 1;
		}
		return 0;
	}
	this.swVerNPR = "021E";
	this.swGTnpr = function() {
		return (this.compareSw(this.swVerNPR) > 0);
	}
	this.swVerAUTO = "0400";
	this.swGE4_00 = function() {
		return (this.compareSw(this.swVerAUTO) >= 0);
	}
	this.fwBits = {
		MS: 	0x01,
		CHADJ: 	0x02, 
		SPECT: 	0x04
	};
	this.frmLengths = {
		L10: 	10,
		L16: 	16
	}
}
// -->