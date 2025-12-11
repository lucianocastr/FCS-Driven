<!--
function Version() {
	this.fwStr = "---";
	this.swStr = "---";
	this.parse = function(sr) {
		try {
			if (sr.length != 10) {
				return -1;
			}
			var s = [];
			for (var i = 0; i < 10; i += 2) {
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
			this.makeStr();
			return 0;
		} catch (err) { }
	}
	this.makeStr = function() {
		var r =  ''+this.fwMain+'.';
		var s = ('00'+this.fwSub).slice(-2);
		r += s+'-';
		s = ('00'+this.fwMsb).slice(-2);
		r += s;
		this.fwStr = r;
		r = ''+this.swMain+'.';
		s = ('00'+this.swSub).slice(-2);
		r += s;
		this.swStr = r;
	}
	this.store = function(sr) {
		localStorage.setItem("1DM4_versionFrame_"+window.location.host, sr);
	}
	this.retrieve = function() {
		return localStorage.getItem("1DM4_versionFrame_"+window.location.host);
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
	this.fwBits = {
		MS: 	0x01,
		CHADJ: 	0x02, 
		SPECT: 	0x04
	};
}
// -->