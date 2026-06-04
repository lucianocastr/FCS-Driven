function Version() {
	this.fwStr = "---";
	this.swStr = "---";
	this.ethStr = "---";
	this.hasEth = false;
	this.ethSz = 3;
	this.isEmpty = true;
	this.parse = function(sr) {
		try {
			if (sr.length != this.frmLengths.L16) {
				this.isEmpty = true;
				return -1;
			}
			var s = [];
			for (var i = 0; i < sr.length; i += 2) {
				var n = parseInt(sr.substr(i, 2), 16);
				if (isNaN(n)){
					this.isEmpty = true;
					return -1;
				}
				s.push(n);
			}
			var i = 0;
			this.fwMain = s[i++];
			this.fwSub = s[i++];
			this.fwMsb = s[i++];
			this.swMain = s[i++];
			this.swSub = s[i++];
			this.eth = [];
			var allzero = true;
			for (var j = 0; j < this.ethSz; ++j) {
				this.eth.push(s[i++]);
				if (this.eth[j] != 0) {
					allzero = false;
				}
			}
			this.hasEth = !allzero;
			this.makeStr();
			this.isEmpty = false;
			return 0;
		} catch (err) {
			this.isEmpty = true;
			return -1;
		}
	}
	this.makeStr = function() {
		var r =  ''+this.fwMain+'.';
		var s = ('00'+this.fwSub).slice(-2);
		r += s+'-';
		s = ('00'+this.fwMsb).slice(this.fwMsb > 99 ? -3 : -2);
		r += s;
		this.fwStr = r;
		r = ''+this.swMain+'.';
		s = ('00'+this.swSub).slice(-2);
		r += s;
		this.swStr = r;
		r = this.eth[0];
		for (var i = 1; i < this.eth.length; ++i) {
			s = ('00'+this.eth[i]).slice(-2);
			r += '.' + s;
		}
		this.ethStr = r;
	}
	this.store = function(sr) {
		localStorage.setItem("versionFrame"+Prjstr+window.location.host, sr);
	}
	this.retrieve = function() {
		return localStorage.getItem("versionFrame"+Prjstr+window.location.host);
	}
	this.render = function(ethernetModuleNotInstalled) {
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
				if ( ethernetModuleNotInstalled ) {
					el.style.display = "none";
				} else {
					el.style.display = (this.hasEth || !isPCstyle) ? "inline" : "none";
				}
			}
			el = window.parent.navi.document.getElementById('serverBox');
			if (el) {
				if ( ethernetModuleNotInstalled ) {
					el.style.display = "none";
				} else {
					el.style.display = (this.hasEth || !isPCstyle) ? "inline" : "none";
					if (this.hasEth) {
						el.innerHTML = this.ethStr;
					}
				}
			}
		} catch (err) { }
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
	this.isFwNull = function() {
		return ((this.fwMain == 0)
			&& (this.fwSub == 0)
			&& (this.fwMsb == 0));
	}
	this.isFwOpfCapable = function() {
		if (typeof(this.fwMsb) != 'undefined' && !isNaN(this.fwMsb)) {
			if (this.fwMsb & this.fwBits.OPFCAP) {
				return true;
			}
		}
		return false;
	}
	this.compareSw = function(swM, swS) {
		if (this.swMain < swM) {
			return -1;
		}
		if (this.swMain > swM) {
			return +1;
		}
		if (this.swSub < swS) {
			return -1;
		}
		if (this.swSub > swS) {
			return +1;
		}
		return 0;
	}
	this.fwBits = {
		MS: 	0x01,
		CHADJ: 	0x02, 
		SPECT: 	0x04,
		OPFCAP: 0x40
	};
	this.frmLengths = {
		L10: 	10,
		L16: 	16
	}
	this.getSwMainNumber = function() {
		return this.swMain;
	}
	this.getSwSecondNumber = function() {
		return this.swSub;
	}
}
