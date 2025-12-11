<!--
function Config(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'RESET':	0,
		'HPA': 		2,
		'BAND':		4,
		'CH1':		12,
		'CHEN':		156,
		'GD': 		162,
		'ACTIVE': 	178,
		'DETMOD': 	190,
		'PRIO': 	192,  
		'NR':		194
	};
	this.bandAddrMap = {
		'CONTROL':	0,
		'GAIN':		2,
		'ATTOUT':	4,
		'SQTRHSLD':	6,
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
	this.bandCtrlMap = {
		FILTEN: 	0x02,
		AGCEN: 		0x04, 
		SW_ADD: 	0x08,
		SQEN: 		0x10,
		GDEN: 		0x20
	};
	this.hpaCtrlMap = {
		ENABLE: 	0x01,
		NFPA: 		0x02,
		ALLOWDISFILT: 	0x04
	};
	this.conf = {
		detmod:		0,
		resets:	{
			fpgaReset: false,
			restoreIP: false,
			ethReset:  false,
			restoreModemCounter: false
		},
		hpa: {
			enable: true,
			nfpa: 	false
		},
		band: {
			filten: true,
			agcen: 	true,
			sw_add: false,
			sqen: 	true,
			gden: 	false,
			mainGain: 0,
			attout:	0,
			sqThr: 	0
		},
		ch: [],
		allowDisFilt: 	true,
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
			this.parseReset(sr);
			this.parseBand(sr);
			for (var i = 0; i < this.maxChannels; ++i) {
				this.parseChFreq(sr, i);
				this.parseChGain(sr, i);
			}
			this.parseChannelsEnabled(sr);
			for (var j = 0; j < this.maxChannels; ++j)
				this.parseChannel(sr, j);
		} catch (err) { }
	}
	this.parseReset = function(sr) {
		var n = this.addrMap['RESET'];
		var data = parseInt(sr.substr(n, 2), 16);
		if (isNaN(data)) {
			this.reset = false;
			return;
		}
		this.reset = !!data;
	}
	this.parseHpa = function(sr) {
		var n = this.addrMap['HPA'];
		var data = parseInt(sr.substr(n, 2), 16);
		if (isNaN(data)) {
			return;
		}
		this.conf.hpa.enable = !!(data & this.hpaCtrlMap.ENABLE);
		this.conf.hpa.nfpa = !!(data & this.hpaCtrlMap.NFPA);
		this.conf.allowDisFilt = !!(data & this.hpaCtrlMap.ALLOWDISFILT);
	}
	this.parseBand = function(sr) {
		this.parseBandCtrl(sr);
		this.parseMainGain(sr);
		this.parseAttout(sr);
		this.parseSqTh(sr);
	}
	this.parseBandCtrl = function(sr) {
		var n = this.addrMap['BAND'];
		n += this.bandAddrMap['CONTROL'];
		var data = parseInt(sr.substr(n, 2), 16);
		if (isNaN(data)) {
			return;				
		}
		this.conf.band.filten = !!(data & this.bandCtrlMap.FILTEN);
		this.conf.band.agcen = !!(data & this.bandCtrlMap.AGCEN);
		this.conf.band.sw_add = !!(data & this.bandCtrlMap.SW_ADD);
		this.conf.band.sqen = !!(data & this.bandCtrlMap.SQEN);
		this.conf.band.gden = !!(data & this.bandCtrlMap.GDEN);
	}
	this.parseMainGain = function(sr) {
		var n = this.addrMap['BAND'];
		n += this.bandAddrMap['GAIN'];
		var data = parseInt(sr.substr(n, 2), 16);
		this.conf.band.mainGain = isNaN(data) ? 0 : cSignedByte(data);
	}
	this.parseAttout = function(sr) {
		var n = this.addrMap['BAND'];
		n += this.bandAddrMap['ATTOUT'];
		var data = parseInt(sr.substr(n, 2), 16);
		this.conf.band.attout = isNaN(data) ? 0 : data;
	}
	this.parseSqTh = function(sr) {
		var n = this.addrMap['BAND'];
		n += this.bandAddrMap['SQTRHSLD'];
		var data = parseInt(sr.substr(n, 2), 16);
		if (isNaN(data)) {
			data = -128;
		}
		if (data >= 128) {
			data -= 256;
		}
		this.conf.band.sqThr = data; 
	}
	this.parseChFreq = function(sr, c) {
		var n = this.addrMap['CH1'] + c*this.chAddrMap['NR'];
		var data = parseInt(sr.substr(n, 4), 16);
		if (isNaN(data))
			return;
		var num = data >> 3;
		if (data & 0x8000)
			num |= 0xE000;
		var nfr = num < 32768 ? num : num - 65536;
		this.conf.ch[c].frqNr = nfr;
		var fo = factory.data.band[0].fo;
		var fr = nfr * factory.data.fstep + fo; 
		this.conf.ch[c].fr = fr;
		this.conf.ch[c].bandwidth = data & this.bwMask;
		return fr;
	}
	this.parseChGain = function(sr, c) {
		var n = this.addrMap['CH1'] + c*this.chAddrMap['NR'];
		n += this.chAddrMap['GAIN'];
		var data = parseInt(sr.substr(n, 2), 16);
		var gain = isNaN(data) ? 0 : cSignedByte(data);
		this.conf.ch[c].gain = gain;
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
		if (isNaN(fr)){
			return Number.NaN;
		}
		var num = (fr - factory.data.band[0].fo) / factory.data.fstep;
		num = Math.round(num);
		return ~~num;
	}
	this.computeChFreq = function(num, b) {
		var fr = num * factory.data.fstep + factory.data.band[0].fo;
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
// -->
