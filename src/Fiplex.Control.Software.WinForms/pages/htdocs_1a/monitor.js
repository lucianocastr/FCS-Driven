<!--
function Monitor(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'ALARMS':	0,
		'UPBAND':	2,
		'UPCH1':	4,
		'UPHPA':	180,
		'DNBAND':	190,
		'DNCH1':	192,
		'DNHPA':	368,
		'MODEM':	378,
		'E2PROM':	384,
		'NR':		386
	};
	this.chAddrMap = {
		'ALARMS':	0,
		'LEVEL':	2,
		'GAIN':		6,
		'ISOLM':	10,
		'ISOLP':	14,
		'STAB':		18,
		'MUTRACK':	20,
		'NR':		22
	};
	this.hpaAddrMap = {
		'ALARMS':	0,
		'TEMP':		2,
		'POWER':	6
	};
	this.modemMap = {
		'RESETSON':	0,
		'RESETSOFF':	2,
		'STAT':		4
	};
	this.stat = {
		contactAlarms:	0,
		band: [],
		fpgaErr:	0,
		modem: {
			resetsOn:	0,
			resetsOff: 	0,
			stat: {
				detected:	false,
				registered: 	false,
				stateModem: 	0,
				stateCtrl: 	0
			}
		},
		e2promErrors: 0
	};
	for (var i = 0; i < 2; ++i) {
		this.stat.band.push({
			signal: {
				overflow: 0
			},
			ch: [],
			hpa: {
				overflow: 	false,
				hiTemp:		false,
				vswr:		false,
				status:		false,
				loop:		false,
				enabled:	false,
				temperature:	0,
				power:		0
			}
		});
	}
	for (var i = 0; i < 2; ++i) {
		for (var j = 0; j < this.maxChannels; ++j) {
			this.stat.band[i].ch.push({
				signalIn:	false,
				stability:	false,
				level: 		-150,
				gain: 		0,
				isolMod:	0,
				isolPh:		0,
				stabFactor:	0,
				muTrack:	0
			});
		}
	}
	this.parse = function(sr) {
		try {
			if (sr.length < this.addrMap['NR']) {
				return;
			}
			this.parseContactAlarms(sr);
			for (var i = 0; i < 2; ++i) {
				this.parseSignalBand(sr, i);
				for (var j = 0; j < this.maxChannels; ++j)
					this.parseSignalChannel(sr, i, j);
				this.parseHpa(sr, i);
			}
			this.parseModem(sr);
			this.parseE2prom(sr);
		} catch(err) { }
	}
	this.parseContactAlarms = function(sr) {
		var n = this.addrMap['ALARMS'];
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num))
			this.stat.contactAlarms = num & 0xFF;
	}
	this.parseSignalBand = function(sr, b) {
		var n = b == 0? this.addrMap['UPBAND'] : this.addrMap['DNBAND'];
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num)) {
			this.stat.band[b].signal.overflow = num & 0x01;
			if (b == 0)
				this.stat.fpgaErr = num & 0x02;
		}
	}
	this.parseSignalChannel = function(sr, b, c) {
		var n, num;
		n = (b == 0? this.addrMap['UPCH1'] : this.addrMap['DNCH1']);
		n += c * this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['ALARMS'], 2), 16);
		if (!isNaN(num)) {
			this.stat.band[b].ch[c].signalIn = (num & 0x80) != 0;
			this.stat.band[b].ch[c].stability = (num & 0x01) != 0;
		}
		num = parseInt(sr.substr(n + this.chAddrMap['LEVEL'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].level = to_float(num);
		num = parseInt(sr.substr(n + this.chAddrMap['GAIN'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].gain = to_ufloat(num);
		num = parseInt(sr.substr(n + this.chAddrMap['ISOLM'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].isolMod = to_ufloat(num);
		num = parseInt(sr.substr(n + this.chAddrMap['ISOLP'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].isolPh = to_phase(num);
		num = parseInt(sr.substr(n + this.chAddrMap['STAB'], 2), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].stabFactor = to_stab(num);
		num = parseInt(sr.substr(n + this.chAddrMap['MUTRACK'], 2), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].muTrack = num;
	}
	this.parseHpa = function(sr, b) {
		var n, num;
		n = (b == 0? this.addrMap['UPHPA'] : this.addrMap['DNHPA']);
		num = parseInt(sr.substr(n + this.hpaAddrMap['ALARMS'], 2), 16);
		if (!isNaN(num)) {
			this.stat.band[b].hpa.overflow = (num & 0x01) != 0;
			this.stat.band[b].hpa.hiTemp = (num & 0x02) != 0;
			this.stat.band[b].hpa.enabled = (num & 0x20) != 0;
		}
		num = parseInt(sr.substr(n + this.hpaAddrMap['TEMP'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].hpa.temperature = to_float(num)*(b == 0? 10 : 1);
		num = parseInt(sr.substr(n + this.hpaAddrMap['POWER'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].hpa.power = to_float(num);
	}
	this.parseModem = function(sr) {
		var n, num;
		n = this.addrMap['MODEM'];
		num = parseInt(sr.substr(n + this.modemMap['RESETSON'], 2), 16);
		if (!isNaN(num))
			this.stat.modem.resetsOn = num & 0xFF;
		num = parseInt(sr.substr(n + this.modemMap['RESETSOFF'], 2), 16);
		if (!isNaN(num))
			this.stat.modem.resetsOff = num & 0xFF;
		num = parseInt(sr.substr(n + this.modemMap['RESETSOFF'], 2), 16);
		if (!isNaN(num)) {
			this.stat.modem.stat.detected = (num & 0x01) != 0;
			this.stat.modem.stat.registered = (num & 0x02) != 0;
			this.stat.modem.stat.stateModem = ((num >> 2) & 0x03);
			this.stat.modem.stat.stateCtrl = ((num >> 4) & 0x03);
		}
	}
	this.parseE2prom = function(sr) {
		var n, num;
		var n = this.addrMap['E2PROM'];
		num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num))
			this.stat.e2promErrors = (num & 0xFF);
	}
	this.computeChOutPower = function(b, c) {
		return (this.stat.band[b].ch[c].level + this.stat.band[b].ch[c].gain);
	}
	this.computeChOutOn = function(b, c) {
		if (!config.conf.band[b].hpaEnable) {
			return false;
		}
		if (!this.stat.band[b].ch[c].signalIn) {
			if (config.conf.band[b].squelchEnable) {
				return false;
			}
			if (b == 1 && config.conf.control.tracking) {
				return false;
			}
		}
		if (b == 0) {
			if (config.conf.control.muteMode == 1 && !this.stat.band[1].ch[c].signalIn) {
				return false;
			}
		}
		return true;
	}
	this.render = function() {
		var tbsErr = true;
		for (var i = 0; i < 2; ++i) {
			ovfLedSet(i, this.stat.band[i].signal.overflow ? "red" : "grey");
			var loopErr = false;
			for (var j = 0, mask = 1; j < this.maxChannels; ++j) {
				if (window.top.showChannelsBitmask & mask) {
					var c = j+1;
					rfSignalLedSet(c, i, this.stat.band[i].ch[j].signalIn ? "green" : "grey");
					if (i == 1 && this.stat.band[i].ch[j].signalIn && config.conf.band[i].ch[j].enable)
						tbsErr = false;
					stabLedSet(c, i, this.stat.band[i].ch[j].stability ? "red" : "grey");
					if (this.stat.band[i].ch[j].stability && config.conf.band[i].ch[j].enable)
						loopErr = true;
					if (this.stat.band[i].signal.overflow)
						rfChInPowSet(c, i, this.stat.band[i].ch[j].level, "alarm");
					else
						rfChInPowSet(c, i, this.stat.band[i].ch[j].level);
					rfChGainSet(c, i, this.stat.band[i].ch[j].gain);
					rfChOutPowSet(c, i, this.computeChOutPower(i, j), this.computeChOutOn(i, j));
					if ((i == 1 && !this.computeChOutOn(i, j)) || !config.conf.control.tracking)
						rfChIsolModSet(c, i, "---");
					else
						rfChIsolModSet(c, i, this.stat.band[i].ch[j].isolMod);
					agcSet(c, i, config.conf.band[i].mainGain + config.conf.band[i].ch[j].fineGain - this.stat.band[i].ch[j].gain);
				}
				mask <<= 1;
			}
			statusHpaLedSet(i, this.stat.band[i].hpa.hiTemp ? "red" : "grey");
			rfOutPowSet(i, this.stat.band[i].hpa.power);
			loopErrSet(i, loopErr ? "red": "grey");
		}
		boardTempSet(this.stat.band[1].hpa.temperature);
		hpaOvfDL(this.stat.band[1].hpa.overflow ? "red" : "grey");
		tbsErrSet(tbsErr ? "red" : "grey");
		fpgaErrSet(this.stat.fpgaErr ? "red" : "grey");
	}
}
// -->
