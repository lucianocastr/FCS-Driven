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
		SFP1: 32,
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
	this.dataLimitsAlarm = {
		temperature: 	{min: -45,	max: 90	},
		voltage: 	{min: 2.7, 	max: 3.8},
		bias: 		{min: 0, 	max: 100},
		txpow: 		{min: -6, 	max: 8	},
		rxpow: 		{min: -140.0, 	max: 4.5}
	}
	this.dataLimitsWarning = {
		temperature: 	{min: -40,	max: 85	},
		voltage: 	{min: 2.8, 	max: 3.7},
		bias: 		{min: 0.1, 	max: 90	},
		txpow: 		{min: -5, 	max: 7	}
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
	this.data.tempAlarm = !!(n &0x20);
	this.data.doorAlarm = !!(n &0x40);
	this.data.doorAlarmAvailable = !!(n &0x80);
	k = this.frameMap['SFP1'] + this.sfpFrameMap['SFPALRM'];
	n = parseInt(sr.substr(k, 2), 16);	
	this.data.commError = !!(n &0x08);
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
		f.foLosAlarm = (f.gtpalarm & 0x10)?2:0;
		return f;
	}
	this.computeRxPowAlarm = function(f){
		var alarm = 0;
		if (f.rx > this.dataLimitsAlarm.rxpow.max || f.foLosAlarm)
		{
			alarm = 2;
		}
		return alarm;
	}
	this.computeVoltAlarm = function(f){
		var alarm = 0;
		if ((f.volt < this.dataLimitsWarning.voltage.min) 
			|| (f.volt > this.dataLimitsWarning.voltage.max))
		{
			alarm = 1;
		}
		if ((f.volt < this.dataLimitsAlarm.voltage.min) 
			|| (f.volt > this.dataLimitsAlarm.voltage.max))
		{
			alarm = 2;
		}	
		return alarm;
	}	
	this.computeBiasAlarm = function(f){
		var alarm = 0;
		if ((f.bias < this.dataLimitsWarning.bias.min) 
			|| (f.bias > this.dataLimitsWarning.bias.max))
		{
			alarm = 1;
		}
		if ((f.bias < this.dataLimitsAlarm.bias.min) 
			|| (f.bias > this.dataLimitsAlarm.bias.max))
		{
			alarm = 2;
		}	
		return alarm;
	}	
	this.computeTempAlarm = function(f){
		var alarm = 0;
		if ((f.temperature < this.dataLimitsWarning.temperature.min) 
			|| (f.temperature > this.dataLimitsWarning.temperature.max))
		{
			alarm = 1;
		}
		if ((f.temperature < this.dataLimitsAlarm.temperature.min) 
			|| (f.temperature > this.dataLimitsAlarm.temperature.max))
		{
			alarm = 2;
		}	
		return alarm;
	}	
	this.computeTxPowAlarm = function(f){
		var alarm = 0;
		if ((f.tx < this.dataLimitsWarning.txpow.min) 
			|| (f.tx > this.dataLimitsWarning.txpow.max))
		{
			alarm = 1;
		}
		if ((f.tx < this.dataLimitsAlarm.txpow.min) 
			|| (f.tx > this.dataLimitsAlarm.txpow.max))
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
		if ((f.temperature < this.dataLimitsWarning.temperature.min) 
			|| (f.temperature > this.dataLimitsWarning.temperature.max))
		{
			alarm = 1;
		}
		if ((f.volt < this.dataLimitsWarning.voltage.min) 
			|| (f.volt > this.dataLimitsWarning.voltage.max))
		{
			alarm = 1;
		}
		if ((f.bias < this.dataLimitsWarning.bias.min) 
			|| (f.bias > this.dataLimitsWarning.bias.max))
		{
			alarm = 1;
		}
		if ((f.tx < this.dataLimitsWarning.txpow.min) 
			|| (f.tx > this.dataLimitsWarning.txpow.max))
		{
			alarm = 1;
		}		
		if ((f.temperature < this.dataLimitsAlarm.temperature.min) 
			|| (f.temperature > this.dataLimitsAlarm.temperature.max))
		{
			alarm = 2;
		}
		if ((f.volt < this.dataLimitsAlarm.voltage.min) 
			|| (f.volt > this.dataLimitsAlarm.voltage.max))
		{
			alarm = 2;
		}
		if ((f.bias < this.dataLimitsAlarm.bias.min) 
			|| (f.bias > this.dataLimitsAlarm.bias.max))
		{
			alarm = 2;
		}
		if ((f.tx < this.dataLimitsAlarm.txpow.min) 
			|| (f.tx > this.dataLimitsAlarm.txpow.max))
		{
			alarm = 2;
		}
		if (f.rx > this.dataLimitsAlarm.rxpow.max)
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
	this.computeRxLossWarning = function(f) {
		return !!(f.rx <= this.dataLimitsAlarm.rxpow.min);
	}
	for (var i = 0, k = this.frameMap['SFP0']; i < this.SFPNR; ++i) {
		var fst = this.parseFiberStatus(sr.substr(k, this.sfpFrameMap['SFPEND']));
		fst.lossComm = this.computeLossComm(fst);
		fst.foStatusFail = this.computeFoStatusFail(fst);
		fst.rxLossWarning = this.computeRxLossWarning(fst);
		fst.rxPowAlarm = this.computeRxPowAlarm(fst);
		fst.txPowAlarm = this.computeTxPowAlarm(fst);
		fst.voltAlarm = this.computeVoltAlarm(fst);
		fst.biasAlarm = this.computeBiasAlarm(fst);
		fst.tempAlarm = this.computeTempAlarm(fst);	
		this.data.fiber.push(fst);
		k += this.sfpFrameMap['SFPEND'];
	}
}
// -->