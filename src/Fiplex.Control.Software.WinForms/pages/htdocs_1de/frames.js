<!--
function Status(sr) {
	this.SFPNR = 8;
	this.sfpFrameMap = {
		TEMP: 	0,
		VCC: 	4,
		BIAS: 	8,
		TX: 	12,
		RX: 	16,
		SFPALRM: 20,
		GTPALRM: 22,
		ERRCNT: 24,
		SFPEND: 28
	};
	this.frameMap = {
		DETMOD: 0,
		TEMPERATURE: 2,
		SFP0: 4,
		LINKREM: 228,
		LINKSTAT: 230,
		MAPEND: 232
	};
	this.frameLen = this.frameMap['MAPEND'];
	if (sr.length != this.frameLen) {
		tryConsole("Error: frame length "+this.frameLen)
		return null;
	}
	this.frame = sr;
	this.foDataLimitsAlarm = {
		temperature: 	{min: -45,	max: 90	},
		voltage: 	{min: 2.7, 	max: 3.8},
		bias: 		{min: 0, 	max: 100},
		txpow: 		{min: -6, 	max: 8	},
		rxpow: 		{min: -29.5, 	max: 4.5}
	}
	this.foDataLimitsWarning = {
		temperature: 	{min: -40,	max: 85	},
		voltage: 	{min: 2.8, 	max: 3.7},
		bias: 		{min: 0.1, 	max: 90	},
		txpow: 		{min: -5, 	max: 7	},
		rxpow: 		{min: -24.5, 	max: 2.5}
	}

	function computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm) {
		var alarm = 0;
		if ((temp < this.foDataLimitsWarning.temperature.min) 
			|| (temp > this.foDataLimitsWarning.temperature.max))
		{
			alarm = 1;
		}
		if ((volt < this.foDataLimitsWarning.voltage.min) 
			|| (volt > this.foDataLimitsWarning.voltage.max))
		{
			alarm = 1;
		}
		if ((bias < this.foDataLimitsWarning.bias.min) 
			|| (bias > this.foDataLimitsWarning.bias.max))
		{
			alarm = 1;
		}
		if ((txpow < this.foDataLimitsWarning.txpow.min) 
			|| (txpow > this.foDataLimitsWarning.txpow.max))
		{
			alarm = 1;
		}
		if ((temp < this.foDataLimitsAlarm.temperature.min) 
			|| (temp > this.foDataLimitsAlarm.temperature.max))
		{
			alarm = 2;
		}
		if ((volt < this.foDataLimitsAlarm.voltage.min) 
			|| (volt > this.foDataLimitsAlarm.voltage.max))
		{
			alarm = 2;
		}
		if ((bias < this.foDataLimitsAlarm.bias.min) 
			|| (bias > this.foDataLimitsAlarm.bias.max))
		{
			alarm = 2;
		}
		if ((txpow < this.foDataLimitsAlarm.txpow.min) 
			|| (txpow > this.foDataLimitsAlarm.txpow.max))
		{
			alarm = 2;
		}
		if (rxpow > this.foDataLimitsAlarm.rxpow.max) 
		{
			alarm = 2;
		}
		if (sfpalarm & 0x01) {
			alarm = 2;
		}
		if (gtpalarm & 0x01) {
			alarm = 2;
		}
		return alarm;
	}

	this.data = {};
	var n = parseInt(sr.substr(this.frameMap['DETMOD'], 2), 16);
	this.data.detmod = n;
	n = parseInt(sr.substr(this.frameMap['TEMPERATURE'], 2), 16);
	this.data.temperature = to_float(n*256);
	n = parseInt(sr.substr(this.frameMap['LINKREM'], 2), 16);
	this.data.linkRemote = n;
	n = parseInt(sr.substr(this.frameMap['LINKSTAT'], 2), 16);
	this.data.linkRStatus = n;
	var k = this.frameMap['SFP0'] + this.sfpFrameMap['SFPALRM'];
	n = parseInt(sr.substr(k, 2), 16);
	this.data.hwfail = !!(n & 0x08);
	this.data.fiber = [];
	this.parseFiberStatus = function(sr) {
		var f = {};
		var n = parseInt(sr.substr(this.sfpFrameMap['TEMP'], 4), 16);
		f.temperature = to_float(n);
		n = parseInt(sr.substr(this.sfpFrameMap['VCC'], 4), 16);
		f.volt = n / 10000;
		n = parseInt(sr.substr(this.sfpFrameMap['BIAS'], 4), 16);
		f.bias = n / 500;
		n = parseInt(sr.substr(this.sfpFrameMap['TX'], 4), 16);
		f.tx = 10 * Math.log(n + 1e-9) / Math.LN10 - 40;
		n = parseInt(sr.substr(this.sfpFrameMap['RX'], 4), 16);
		f.rx = 10 * Math.log(n + 1e-9) / Math.LN10 - 40;
		n = parseInt(sr.substr(this.sfpFrameMap['SFPALRM'], 2), 16);
		f.sfpalarm = n;
		n = parseInt(sr.substr(this.sfpFrameMap['GTPALRM'], 2), 16);
		f.gtpalarm = n;
		n = parseInt(sr.substr(this.sfpFrameMap['ERRCNT'], 4), 16);
		f.errors = n;
		f.txFaultAlarm = (f.sfpalarm & 0x01)?2:0;
		f.rxAlarm = (f.sfpalarm & 0x02)?2:0;
		f.detModAlarm = (f.sfpalarm & 0x04)?2:0;
		f.gtpSyncAlarm = (f.gtpalarm & 0x01)?2:0;
		f.dataLock = (f.gtpalarm & 0x02)?2:0;
		f.dataSync = (f.gtpalarm & 0x04)?2:0;
		f.freqSyncAlarm = (f.gtpalarm & 0x08)?2:0;
		// f.fiberStatusAlarm = this.parseFiberStatusAlarm(f.sfpalarm, f.gtpalarm);
		// f.rxLossAlarm = this.parseRxLossAlarm(f.sfpalarm, f.gtpalarm, f.rx);
		// f.rxLossWarning = this.parseRxLossWarning(f.rxLossAlarm, f.rx);
		return f;
	}
	this.computeRxPowHiAlarm = function(f){
		var alarm = 0;
		if (f.rx > this.foDataLimitsAlarm.rxpow.max)
		{
			alarm = 2;
		}
		return alarm;
	}
	this.computeRxPowAlarm = function(f){
		var alarm = 0;
		if (f.rx <= this.foDataLimitsWarning.rxpow.min)
		{
			alarm = 1;
		}
		if ((f.sfpalarm & 0x02)
			|| (f.rx <= this.foDataLimitsAlarm.rxpow.min)
			|| (f.rx > this.foDataLimitsAlarm.rxpow.max))
		{
			alarm = 2;
		}
		return alarm;
	}
	this.computeVoltAlarm = function(f){
		var alarm = 0;
		if ((f.volt < this.foDataLimitsWarning.voltage.min) 
			|| (f.volt > this.foDataLimitsWarning.voltage.max))
		{
			alarm = 1;
		}
		if ((f.volt < this.foDataLimitsAlarm.voltage.min) 
			|| (f.volt > this.foDataLimitsAlarm.voltage.max))
		{
			alarm = 2;
		}	
		return alarm;
	}	
	this.computeBiasAlarm = function(f){
		var alarm = 0;
		if ((f.bias < this.foDataLimitsWarning.bias.min) 
			|| (f.bias > this.foDataLimitsWarning.bias.max))
		{
			alarm = 1;
		}
		if ((f.bias < this.foDataLimitsAlarm.bias.min) 
			|| (f.bias > this.foDataLimitsAlarm.bias.max))
		{
			alarm = 2;
		}	
		return alarm;
	}	
	this.computeTempAlarm = function(f){
		var alarm = 0;
		if ((f.temperature < this.foDataLimitsWarning.temperature.min) 
			|| (f.temperature > this.foDataLimitsWarning.temperature.max))
		{
			alarm = 1;
		}
		if ((f.temperature < this.foDataLimitsAlarm.temperature.min) 
			|| (f.temperature > this.foDataLimitsAlarm.temperature.max))
		{
			alarm = 2;
		}	
		return alarm;
	}	
	this.computeTxPowAlarm = function(f){
		var alarm = 0;
		if ((f.tx < this.foDataLimitsWarning.txpow.min) 
			|| (f.tx > this.foDataLimitsWarning.txpow.max))
		{
			alarm = 1;
		}
		if ((f.tx < this.foDataLimitsAlarm.txpow.min) 
			|| (f.tx > this.foDataLimitsAlarm.txpow.max))
		{
			alarm = 2;
		}	
		return alarm;
	}
	this.computeLossComm = function(f) {
		var alarm = 0;
		if (f.dataLock || f.dataSync || f.freqSyncAlarm) {
			alarm = 2;
		}
		return alarm;
	}
	this.computeFoStatusFail = function(f) {
		var alarm = 0;
		if ((f.temperature < this.foDataLimitsWarning.temperature.min) 
			|| (f.temperature > this.foDataLimitsWarning.temperature.max))
		{
			alarm = 1;
		}
		if ((f.volt < this.foDataLimitsWarning.voltage.min) 
			|| (f.volt > this.foDataLimitsWarning.voltage.max))
		{
			alarm = 1;
		}
		if ((f.bias < this.foDataLimitsWarning.bias.min) 
			|| (f.bias > this.foDataLimitsWarning.bias.max))
		{
			alarm = 1;
		}
		if ((f.tx < this.foDataLimitsWarning.txpow.min) 
			|| (f.tx > this.foDataLimitsWarning.txpow.max))
		{
			alarm = 1;
		}		
		if ((f.temperature < this.foDataLimitsAlarm.temperature.min) 
			|| (f.temperature > this.foDataLimitsAlarm.temperature.max))
		{
			alarm = 2;
		}
		if ((f.volt < this.foDataLimitsAlarm.voltage.min) 
			|| (f.volt > this.foDataLimitsAlarm.voltage.max))
		{
			alarm = 2;
		}
		if ((f.bias < this.foDataLimitsAlarm.bias.min) 
			|| (f.bias > this.foDataLimitsAlarm.bias.max))
		{
			alarm = 2;
		}
		if ((f.tx < this.foDataLimitsAlarm.txpow.min) 
			|| (f.tx > this.foDataLimitsAlarm.txpow.max))
		{
			alarm = 2;
		}
		if (f.rx > this.foDataLimitsAlarm.rxpow.max)
		{
			alarm = 2;
		}
		if (f.txFaultAlarm) {
			alarm = 2;
		}
		if (f.gtpSyncAlarm) {
			alarm = 2;
		}
		return alarm;
	}
	this.computeRxLossAlarm = function(f) {
		if ((f.rx <= this.foDataLimitsAlarm.rxpow.min)
			|| (f.sfpalarm & 0x02))
		{
			return 2;
		}
		if (f.rx <= this.foDataLimitsWarning.rxpow.min) {
			return 1;
		}
		return 0;
	}
	// this.parseFiberStatusAlarm = function(sfpalarm, gtpalarm) {
	// 	return !!((sfpalarm & 0x05) || (gtpalarm & 0x01)) ;
	// }
	// this.parseRxLossAlarm = function(sfpalarm, gtpalarm, rxpow) {
	// 	return !!((rxpow <= -29.5) || (sfpalarm & 0x02) || (gtpalarm & 0x07));
	// }
	// this.parseRxLossWarning = function(rxalarm, rxpow) {
	// 	return !!(!rxalarm && (rxpow <= -24.5));
	// }
	for (var i = 0, k = this.frameMap['SFP0']; i < this.SFPNR; ++i) {
		var fst = this.parseFiberStatus(sr.substr(k, this.sfpFrameMap['SFPEND']));
		fst.lossComm = this.computeLossComm(fst);
		fst.rxLossAlarm = this.computeRxLossAlarm(fst);
		fst.rxPowHiAlarm = this.computeRxPowHiAlarm(fst);
		fst.rxPowAlarm = this.computeRxPowAlarm(fst);
		fst.txPowAlarm = this.computeTxPowAlarm(fst);
		fst.voltAlarm = this.computeVoltAlarm(fst);
		fst.biasAlarm = this.computeBiasAlarm(fst);
		fst.tempAlarm = this.computeTempAlarm(fst);	
		fst.foStatusFail = this.computeFoStatusFail(fst);
		this.data.fiber.push(fst);
		k += this.sfpFrameMap['SFPEND'];
	}
}
// -->