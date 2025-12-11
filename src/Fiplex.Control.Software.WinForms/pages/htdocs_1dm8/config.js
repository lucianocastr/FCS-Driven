<!--
function Config(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'HEADER':       0,
		'DETMOD':	4,
		'RESET':	12,
		'BAND':		14,
		'CH1':		24,
		'CHEN':		168,
		'BAND2': 	174,
		'REMPWRRED': 	190,
		'VALID':        192, 
		'NR':		194
	};
	this.bandAddrMap = {
		'CONTROL':	0,
		'GAIN':		2,
		'ATTIN':	4,
		'ATTOUT':	6,
		'SQTRHSLD':	8,
	};
	this.chAddrMap = {
		'FRQNR':	0,
		'GAIN':		4,
		'NR':		6
	};
	this.hpaAddrMap = {
		'CONTROL':	0
	};
	this.bwMask = 0x07;
	this.stbyMask = 0x08;
	this.conf = {
		detmod:		0,
		resets:	{
			fpgaReset: false,
			restoreIP: false,
			ethReset:  false,
			restoreModemCounter: false
		},
		band: {
			control: 0,
			gain:	0,
			attin:	0,
			attout:	0
		},
		ch: [],
		channelsEnabledMask: 0
	};
	for (var i = 0; i < this.maxChannels; ++i) {
		this.conf.ch.push({
			enable: false,
			bandwidth: 0,
			gain: 	0,
			frqNr: 	0,
			fr: 	0
		});
	}
	this.parse = function(sr) {
		try {
			if (sr.length < this.addrMap['NR']) {
				return;
			}
			for (var i = 0; i < this.maxChannels; ++i)
				this.parseChFreq(sr, i);
			this.parseChannelsEnabled(sr);
			this.parseBand(sr, i);
			for (var j = 0; j < this.maxChannels; ++j)
				this.parseChannel(sr, i, j);
		} catch (err) { }
	}
	this.parseChFreq = function(sr, c) {
		var n = this.addrMap['CH1'] + c*this.chAddrMap['NR'];
		var data = parseInt(sr.substr(n, 4), 16);
		if (isNaN(data))
			return;
		if (data & 0x8000)
			data |= 0xFFFF0000;
		var nfr = data >> 3;
		this.conf.ch[c].frqNr = nfr;
		var fo = factory.data.band[0].foDL;
		var fr = nfr * factory.data.fstep + fo; 
		this.conf.ch[c].fr = fr;
		this.conf.ch[c].bandwidth = data & this.bwMask;
		return fr;
	}
	this.parseChannelsEnabled = function(sr) {
		var n = this.addrMap['CHEN'];
		var data = parseInt(sr.substr(n, 6), 16);
		var chMask = 0;
		for (var i = 0, mask = 1; i < this.maxChannels; ++i) {
			this.conf.ch[i].enable = (data & mask) == 0;
			if (this.conf.ch[i].enable)
				chMask |= mask;
			mask <<= 1;
		}
		this.channelsEnabledMask = chMask;
	}
	this.computeChNum = function(fr, isUL) {
		var num;
		if (isNaN(fr)){
			return Number.NaN;
		}
		var fo = isUL ? factory.data.band[0].foUL : factory.data.band[0].foDL;
		num = (fr - fo) / factory.data.fstep;
		return ~~Math.round(num);
	}
	this.computeChFreq = function(num, b) {
		var fo = (b == 0 ? factory.data.band[0].foUL : factory.data.band[0].foDL);
		var fr = num * factory.data.fstep + fo;
		return fr;
	}
	this.indexOfChannel = function(b, num) {
		for (var i = 0; i < this.maxChannels; ++i) {
			if (this.conf.ch[i].frqNr == num)
				return i;
		}
		return -1;
	}
}

function ConfigRemote() {
	this.data = {
		nr: null,
		spectHw: false,
		persistAlarmEn: false,
		stbymask: 0,
		ch: []
	};
	this.NCH = 24;
	this.addrMap = {
		HEADER: 	0,
		RESET: 		4,
		HPA: 		6,
		BAND: 		8,
		CH1: 		16,
		STBY: 		160,
		GDLY: 		166,
		ACTIVE: 	182,
		DETMOD: 	194,
		PRIOFORCE: 	196,
		NR: 		198
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
			this.parseRemNr(sr);
			this.parseHpa(sr);
			this.parseStby(sr);
			this.parseCh(sr);
		} catch(err) {}
	}
	this.parseRemNr = function(sr) {
		try {
			var n = ~~parseInt(sr.substr(this.addrMap.HEADER, 2), 16);
			this.data.nr = n;
		} catch(e) { this.data.nr = null; }
	}
	this.getNr = function() {
		return this.data.nr;
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
}

// -->
