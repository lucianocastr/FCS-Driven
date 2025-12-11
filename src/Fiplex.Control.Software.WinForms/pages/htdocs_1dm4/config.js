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
		'VALID':        174, 
		'NR':		176
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
		var num = data >> 3;
		if (data & 0x8000)
			num |= 0xE000;
		var nfr = num < 32768 ? num : num - 65536;
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
		if (!isUL)
			num = (fr - factory.data.band[0].foDL) / factory.data.fstep;
		else
			num = (fr - factory.data.band[0].foUL) / factory.data.fstep;
		return ~~Math.round(num);
	}
	this.computeChFreq = function(num, b) {
		var fr = num * factory.data.fstep + factory.data.band[0].foDL;
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
