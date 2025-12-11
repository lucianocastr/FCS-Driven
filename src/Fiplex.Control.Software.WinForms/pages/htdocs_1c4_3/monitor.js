function Monitor() {
	this.bwType = 0;
	this.maxChannelsSet = [32, 8];
	this.maxChannels = this.maxChannelsSet[0];
	this.addrMap = 'undefined';
	this.addrMapSet = [{
		'ALARMS':	0,
		'UPBAND':	2,
		'UPCH1':	4,
		'UPHPA':	324,
		'DNBAND':	334,
		'DNCH1':	336,
		'DNHPA':	656,
		'NR':		666
	}, {
		'ALARMS':	0,
		'UPBAND':	2,
		'UPCH1':	4,
		'UPHPA':	84,
		'DNBAND':	94,
		'DNCH1':	96,
		'DNHPA':	176,
		'NR':		186
  	}]
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
		band: 		[],
		fpgaErr:	0,
		boardTempAlarm: false,
		rxlow: 		false,
		forcedUlPaCurrentMonitor: false,
		abnSqOpen: 	false,
		opfRoutineRunning: false,
		isol_gain: 	0,
		opfAntIsol: 	false,
		conf_gain: 	0,
		retryTimeLapse: 0,
		blocked: 	false
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
				enabled:	false,
				vswr: 		false,
				udf: 		false,
				commerr: 	false,
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
				abnSqAlarm: 	false
			});
		}
	}
	this.parse = function(sr) {
		try {
			this.parseFrameType(sr);
			if (this.bwType == 'undefined') {
				return;
			}
			if (sr.length < this.addrMap['NR']) {
				return;
			}
			this.parseContactAlarms(sr);
			for (var i = 0; i < 2; ++i) {
				this.parseSignalBand(sr, i);
				for (var j = 0; j < this.maxChannels; ++j) {
					this.parseSignalChannel(sr, i, j);
				}
				this.parseHpa(sr, i);
				this.parseConfGain(sr, i);
			}
			if (this.bwType == 0) {
				this.parseMaxGain(sr);
			}
			this.parseRetryTime(sr);
		} catch(err) { }
	}
	this.parseFrameType = function(sr) {
		try {
			var map = this.addrMapSet[0];
			var n = map['UPBAND'];
			var num = parseInt(sr.substr(n, 2), 16);
			if (!isNaN(num)) {
				this.bwType = (num & this.ulAlarmBits.UL_ADJ) ? 1 : 0;
			}
			if (this.bwType == 'undefined') {
				return;
			}
			this.maxChannels = this.maxChannelsSet[this.bwType];
			this.addrMap = this.addrMapSet[this.bwType];
		} catch (err) {}
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
			if (b == 0) {
				this.stat.fpgaErr = (num & this.ulAlarmBits.UL_HWFAIL) != 0;
				this.stat.boardTempAlarm = (num & this.ulAlarmBits.UL_TEMP) != 0;
				this.stat.forcedUlPaCurrentMonitor = (num & this.ulAlarmBits.UL_CURR_MON) != 0;
				this.stat.abnSqOpen = (num & this.ulAlarmBits.UL_ABN_SQ_OPEN) != 0;
				this.stat.opfRoutineRunning = (num & this.ulAlarmBits.UL_OPF_ACTIVE) != 0;
				this.stat.opfAntIsol = (num & this.ulAlarmBits.UL_ANT_ISOL) != 0;
			} else {
				this.stat.rxlow = (num & this.dlAlarmBits.DL_RXLOW) != 0;
				this.stat.blocked = (num & this.dlAlarmBits.DL_BLOCKED) != 0;
			}
		}
	}
	this.parseRetryTime = function(sr) {
		var lapse = 0;
		var n = this.addrMap['UPCH1'] + this.chAddrMap['ALARMS'];
		var step = this.chAddrMap['NR'];
		var bitmask = this.chAlarmBits.CH_RETRY_T_BIT;
		for (var c = 0, mask = 1; c < 16; ++c, n += step, mask <<= 1) {
			var num = parseInt(sr.substr(n, 2), 16);
			if (isNaN(num)) {
				continue;
			}
			if (num & bitmask) {
				lapse |= mask;
			}
		}
		this.stat.retryTimeLapse = lapse;
	}
	this.parseSignalChannel = function(sr, b, c) {
		var n, num;
		n = (b == 0? this.addrMap['UPCH1'] : this.addrMap['DNCH1']);
		n += c * this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['ALARMS'], 2), 16);
		if (!isNaN(num)) {
			this.stat.band[b].ch[c].signalIn = (num & 0x80) != 0;
			if (b == 0) {
				this.stat.band[b].ch[c].abnSqAlarm = (num & 0x40) != 0;
			}
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
			this.stat.band[b].hpa.overflow = (num & this.hpaAlarmBits.PA_OVF) != 0;
			this.stat.band[b].hpa.hiTemp = (num & this.hpaAlarmBits.PA_ALARM) != 0;
			this.stat.band[b].hpa.enabled = (num & this.hpaAlarmBits.PA_ENABLED) != 0;
			this.stat.band[b].hpa.vswr = (num & this.hpaAlarmBits.PA_VSWR) != 0;
			this.stat.band[b].hpa.udf = (num & this.hpaAlarmBits.PA_UDF) != 0;
			this.stat.band[b].hpa.commerr = (num & this.hpaAlarmBits.PA_COMMERR) != 0;
		}
		num = parseInt(sr.substr(n + this.hpaAddrMap['TEMP'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].hpa.temperature = to_float(num)*(b == 0? 10 : 1);
		num = parseInt(sr.substr(n + this.hpaAddrMap['POWER'], 4), 16);
		if (!isNaN(num))
			this.stat.band[b].hpa.power = to_float(num);
	}
	this.parseMaxGain = function(sr) {
		var n, g, num;
		n = this.addrMap['UPCH1'];
		num = parseInt(sr.substr(n + this.chAddrMap['ALARMS'], 2), 16);
		num &= 0x0F;
		g = num << 4;
		n += this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['ALARMS'], 2), 16);
		g += (num & 0x0F);
		this.stat.isol_gain = g;
	}
	this.parseConfGain = function(sr, b) {
		var n, g, num;
		n = (b == 0 ? this.addrMap['UPCH1'] : this.addrMap['DNCH1']);
		n += 2*this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['ALARMS'], 2), 16);
		num &= 0x0F;
		g = num << 4;
		n += this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['ALARMS'], 2), 16);
		g += (num & 0x0F);
		this.stat.band[b].conf_gain = g;
	}
	this.computeChOutPower = function(b, c) {
		return (this.stat.band[b].ch[c].level + this.stat.band[b].ch[c].gain);
	}
	this.isSignalIn = function(b, c) {
		return this.stat.band[b].ch[c].signalIn;
	}
	this.isChAbnSqAlarm = function(b, c) {
		if (b != 0) {
			return false;
		}
		return this.stat.band[b].ch[c].abnSqAlarm;
	}
	this.isUlAbnSqOpen = function() {
		return this.stat.abnSqOpen;
	}
	this.isOpfRoutineRunning = function() {
		return this.stat.opfRoutineRunning;
	}
	this.isOpfAntIsol = function() {
		return this.stat.opfAntIsol;
	}
	this.hpaAlarmBits = {
		PA_OVF: 	0x01,
		PA_ALARM: 	0x02,
		PA_VSWR: 	0x04,
		PA_UDF: 	0x08,
		PA_COMMERR: 	0x10,
		PA_ENABLED: 	0x20
	}
	this.ulAlarmBits = {
		UL_OVL: 	0x01,
		UL_HWFAIL: 	0x02,
		UL_TEMP: 	0x04,
		UL_CURR_MON: 	0x08,
		UL_ADJ: 	0x10,
		UL_ABN_SQ_OPEN: 0x20,
		UL_OPF_ACTIVE: 	0x40,
		UL_ANT_ISOL: 	0x80 
	}
	this.dlAlarmBits = {
		DL_OVL: 	0x01,
		DL_RXLOW: 	0x02,
		DL_BLOCKED: 	0x04
	}
	this.chAlarmBits = {
		CH_RETRY_T_BIT: 0x20,
		CH_ABN_SQ_BIT: 	0x40,
		CH_DETECT_BIT: 	0x80
	}
}
