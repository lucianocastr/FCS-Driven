<!--
function Monitor(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'ALARMS':	0,
		'UPBAND':	2,
		'UPCH1':	4,
		'UPHPA':	124,
		'DNBAND':	134,
		'DNCH1':	136,
		'DNHPA':	256,
		'NR':		266
	};
	this.chAddrMap = {
		'ALARMS':	0,
		'LEVEL':	2,
		'GAIN':		6,
		'NR':		10
	};
	this.hpaAddrMap = {
		'ALARMS':	0,
		'TEMP':		2,
		'POWER':	6,
		'NR':		10
	};
	this.stat = {
		contactAlarms:	0,
		band: [],
		fpgaErr:	0,
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
				vswrErr: 	false,
				txPwrLow: 	false,
				commErr: 	false,
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
				level: 		-150,
				gain: 		0,
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
		}
		num = parseInt(sr.substr(n + this.chAddrMap['LEVEL'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].level = to_float(num);
		num = parseInt(sr.substr(n + this.chAddrMap['GAIN'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].ch[c].gain = to_ufloat(num);
	}
	this.parseHpa = function(sr, b) {
		var n, num;
		n = (b == 0? this.addrMap['UPHPA'] : this.addrMap['DNHPA']);
		num = parseInt(sr.substr(n + this.hpaAddrMap['ALARMS'], 2), 16);
		if (!isNaN(num)) {
			this.stat.band[b].hpa.overflow = (num & 0x01) != 0;
			this.stat.band[b].hpa.hiTemp = (num & 0x02) != 0;
			this.stat.band[b].hpa.vswrErr = (num & 0x04) != 0;
			this.stat.band[b].hpa.txPwrLow = (num & 0x08) != 0;
			this.stat.band[b].hpa.commErr = (num & 0x10) != 0;
			this.stat.band[b].hpa.enabled = (num & 0x20) != 0;
		}
		num = parseInt(sr.substr(n + this.hpaAddrMap['TEMP'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].hpa.temperature = to_float(num)*(b == 0? 10 : 1);
		num = parseInt(sr.substr(n + this.hpaAddrMap['POWER'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].hpa.power = to_float(num);
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
			for (var j = 0, mask = 1; j < this.maxChannels; ++j) {
				if (window.top.showChannelsBitmask & mask) {
					var c = j+1;
					rfSignalLedSet(c, i, this.stat.band[i].ch[j].signalIn ? "green" : "grey");
					if (i == 1 && this.stat.band[i].ch[j].signalIn && config.conf.band[i].ch[j].enable)
						tbsErr = false;
					if (this.stat.band[i].signal.overflow)
						rfChInPowSet(c, i, this.stat.band[i].ch[j].level, "alarm");
					else
						rfChInPowSet(c, i, this.stat.band[i].ch[j].level);
					rfChGainSet(c, i, this.stat.band[i].ch[j].gain);
					rfChOutPowSet(c, i, this.computeChOutPower(i, j), this.computeChOutOn(i, j));
					var agc = config.conf.band[i].mainGain + config.conf.band[i].ch[j].fineGain - this.stat.band[i].ch[j].gain;
					agc = ~~Math.round(agc * 4) / 4;
					agcSet(c, i, agc);
				}
				mask <<= 1;
			}
			if (i == 1 && factory.data.band[i].hpamon == 2) {
				statusHpaLedSet(i, this.stat.band[i].hpa.commErr ? "red" : "grey")
				vswrHpaLedSet(i, this.stat.band[i].hpa.vswrErr ? "red" : "grey");
				txPwrLowHpaLedSet(i, this.stat.band[i].hpa.txPwrLow ? "red" : "grey");
			} else {
				statusHpaLedSet(i, this.stat.band[i].hpa.hiTemp ? "red" : "grey");
			}
			rfOutPowSet(i, this.stat.band[i].hpa.power);
		}
		boardTempSet(this.stat.band[1].hpa.temperature);
		hpaOvfDL(this.stat.band[1].hpa.overflow ? "red" : "grey");
		tbsErrSet(tbsErr ? "red" : "grey");
		fpgaErrSet(this.stat.fpgaErr ? "red" : "grey");
	}
}
// -->
