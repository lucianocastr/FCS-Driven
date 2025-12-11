<!--
function ConfigRemote() {
	this.data = {
		spectHw: false,
		persistAlarmEn: false,
		stbymask: 0,
		ch: []
	};
	this.NCH = 24;
	this.addrMap = {
		RESET: 		0,
		HPA: 		2,
		BAND: 		4,
		CH1: 		12,
		STBY: 		156,
		GDLY: 		162,
		ACTIVE: 	178,
		DETMOD: 	190,
		PRIOFORCE: 	192,
		NR: 		194
	};
	this.hpaMaskBits = {
		EN: 		0x01,
		FIP413: 	0x02,
		ALDISFILT: 	0x04,
		AE: 		0x08,
		PERSIST:  	0x10
	};
	this.chMaskBits = {
		CHSHIFT: 	3,
		BW: 		0x07
	}
	this.parse = function(sr) {
		try {
			if (sr.length < this.addrMap.NR) {
				return;
			}
			this.parseHpa(sr);
			this.parseStby(sr);
			this.parseCh(sr);
		} catch(err) {}
	}
	this.parseHpa = function(sr) {
		try {
			var n = ~~parseInt(sr.substr(this.addrMap.HPA, 2), 16);
			this.data.spectHw = !isNaN(n) && !!(n & this.hpaMaskBits.AE);
			this.data.persistAlarmEn = !isNaN(n) && !!(n & this.hpaMaskBits.PERSIST);
		} catch(err) {}
	}
	this.isAE = function() {
		return this.data.spectHw;
	}
	this.isPersistAlarmEn = function() {
		return (this.data.spectHw && this.data.persistAlarmEn);
	}
	this.parseStby = function(sr) {
		try {
			var stbymask = 0;
			var s = this.addrMap.STBY;
			for (var i = 0; i < 3; ++i, s += 2) {
				stbymask <<= 8;
				var n = ~~parseInt(sr.substr(s, 2), 16);
				stbymask |= (n & 0xFF);
			}
			this.stbymask = stbymask;
		} catch (e) {}
	}
	this.isChOn = function(c) {
		return (c < this.NCH && !(this.stbymask & (1 << c)));
	}
	this.parseCh = function(sr) {
		try {
			this.data.ch = [];
			var s = this.addrMap.CH1;
			for (var i = 0; i < this.NCH; ++i, s += 6) {
				 var n = ~~parseInt(sr.substr(s, 4), 16);
				 if (n & 0x8000) {
				 	n |= 0xFFFF0000;
				 }
				 var chnr = n >> this.chMaskBits.CHSHIFT;
				 var chbw = (n & this.chMaskBits.BW);
				 this.data.ch.push({nr: chnr, bw: chbw});
			}
		} catch(e) {}
	}
	this.getChNr = function(c) {
		if (!(c < this.NCH && this.data.ch.length == this.NCH)) {
			return null;
		}
		return this.data.ch[c].nr;
	}
	this.getChBw = function(c) {
		if (!(c < this.NCH && this.data.ch.length == this.NCH)) {
			return null;
		}
		return this.data.ch[c].bw;
	}
	this.computeChFreq = function(num) {
		var fo = factory.data.band[0].fo;
		var fr = num * factory.data.fstep + fo;
		return fr;
	}
}

// -->
