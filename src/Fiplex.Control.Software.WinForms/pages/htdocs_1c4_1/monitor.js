function Monitor() {
	this.bwType = 0;
	this.maxChannelsSet = [32, 4];
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
		'UPHPA':	44,
		'DNBAND':	54,
		'DNCH1':	56,
		'DNHPA':	96,
		'NR':		106
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
		forcedUlPaCurrentMonitor: false
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
			}
		} catch(err) { }
	}
	this.parseFrameType = function(sr) {
		try {
			this.bwType = 0;
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
				this.stat.fpgaErr = (num & 0x02) != 0;
				this.stat.boardTempAlarm = (num & 0x04) != 0;
				this.stat.forcedUlPaCurrentMonitor = (num & 0x08);
			} else {
				this.stat.rxlow = (num & 0x02) != 0;
			}
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
	this.computeChOutPower = function(b, c) {
		return (this.stat.band[b].ch[c].level + this.stat.band[b].ch[c].gain);
	}
	this.isSignalIn = function(b, c) {
		return this.stat.band[b].ch[c].signalIn;
	}
	this.hpaAlarmBits = {
		PA_OVF: 	0x01,
		PA_ALARM: 	0x02,
		PA_VSWR: 	0x04,
		PA_UDF: 	0x08,
		PA_COMMERR: 	0x10,
		PA_ENABLED: 	0x20
	}
}
