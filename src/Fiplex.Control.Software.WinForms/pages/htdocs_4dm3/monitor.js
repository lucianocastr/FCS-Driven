function MonitorGlobal() {
	this.FrameLengthMaster = 1512;
	this.FrameLengthRemote = 1512;
	this.HeaderRemoteLength = 4;
	this.NrOfRemotes = 2;
	this.isZeros = false;
	this.remoteResponseValid = [false, false];
	this.frameUnit = [];
	this.monitorUnit = [];
	this.frameSeparator = "\t\t\t";

	this.parse = function(statusResponse,fact) {
		if ( this.checkIsZeros(statusResponse) ) {
			this.isZeros = true;
			return;
		}
		this.isZeros = false;

		this.frameUnit = statusResponse.split(this.frameSeparator);
		if (this.frameUnit.length != 1+this.NrOfRemotes) {
			// alert("Status error subframes nr="+this.frameUnit.length);
		}
		if (this.frameUnit[0].length < this.FrameLengthMaster) {
			// alert("Status master length="+this.frameUnit[0].length);
			this.isZeros = true;	// provisional para evitar mostrar página sin status
			return -1;
		}
		for (var n = 0; n < this.NrOfRemotes; n++ ) {
			var remoteNr = n+1;
			this.remoteResponseValid[n] = (1 === parseInt(this.frameUnit[remoteNr].substring(2,4),16));
			if (this.remoteResponseValid[n]) {
				if (this.frameUnit[remoteNr].length < this.FrameLengthRemote+this.HeaderRemoteLength) {
					// alert("Status remote length="+this.frameUnit[remoteNr].length);
					this.remoteResponseValid[n] = false;
				}
			}
		}
		this.monitorUnit = [];
		// master
		var monitor = new Monitor();
		if (typeof(fact)==="undefined")
			monitor.parse(this.frameUnit[0]);
		else
			monitor.parse(this.frameUnit[0],fact[0]);
		this.monitorUnit.push(monitor);
		//remotos
		for (var n = 0; n < this.NrOfRemotes; n++) {
			var monitor = new Monitor();
			if (this.remoteResponseValid[n]) {
				var remoteNr = n+1;
				if (typeof(fact)==="undefined")
					monitor.parse(this.frameUnit[remoteNr].substr(this.HeaderRemoteLength));
				else
					monitor.parse(this.frameUnit[remoteNr].substr(this.HeaderRemoteLength),fact[n+1]);
				monitor.isValidFrame = true;
			} else {
				monitor.isValidFrame = false;
			}
			this.monitorUnit.push(monitor);
		}
	}
	this.checkIsZeros = function(s) {
		if (!s || s.length == 0 ) {
			return true;
		}
		for (var i = 0; i < s.length; i += 2) {
			var r = parseInt(s.substring(i,i+2), 16)
			if ( r != 0 ) {
				return false;
			}
		}
		return true;
	}
}

function Monitor() {
	this.isValidFrame = true;
	this.CHNR 						= 32;
	this.ADJNR 						= 4;
	
	this.blocked					= false;
	this.fpgaErr					= false;
	this.boardTempAlarm				= false;
	this.extremeTempActionOn		= false;
	this.ulBandPAIndependent		= true;
	this.chBandEnabled				= [true,true]; //activación sección NB band0/1
	this.adjBandEnabled				= [true,true]; //activación sección ADJ band0/1
	this.boardTemp					= 0;
	this.boardCurrent				= 0;
	this.overload					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.rxLowAlarm					= [[false,false],[false,false]]; //nb/adj band0/1
	this.oscDetect					= [false,false]; //band 0/1
	this.antennaIsol				= [false,false]; //band 0/1
	this.isolMeasRunning			= [false,false]; //band 0/1
	this.configGain					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.signalDet					= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.oscDetectCH				= []; // nb/adj band0/1 nfilter [2][2][32]
	this.maxAllowGain				= [0,0]; //band 0/1
	this.retryTime					= [0,0]; //band 0/1
	this.bbAgc					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.level						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.gain						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.paFail						= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.agcFail					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.vswr						= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.txLow						= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.statePaOn					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.estTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.detTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.refTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.paCurrent					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.relayONOFF					= []; // 7 boolean/relay
	this.relayOpenClosed			= []; // 7 boolean/relay
	this.gralAlarm					= []; //16 boolean/alarm
	this.bandAlarm					= []; //2band x 16boolean/alarm
	this.fiberOpticAlarm				= []; // 8 alarmas de fibra, previsión das centric
	this.delayTimerRunning			= []; // 7 boolean/relay
	this.delayTimer					= []; // 7 int/relay
	this.latchTimerRunning			= []; // 7 boolean/relay
	this.latchTimer					= []; // 7 int/relay	
	this.isZeros = false;

	// this.foDataLimitsAlarm = {
	// 	temperature: 	{min: -45,	max: 90	},
	// 	voltage: 	{min: 2.7, 	max: 3.8},
	// 	bias: 		{min: 0, 	max: 100},
	// 	txpow: 		{min: -6, 	max: 8	},
	// 	rxpow: 		{min: -29.5, 	max: 4.5}
	// };
	// this.foDataLimitsWarning = {
	// 	temperature: 	{min: -40,	max: 85	},
	// 	voltage: 	{min: 2.8, 	max: 3.7},
	// 	bias: 		{min: 0.1, 	max: 90	},
	// 	txpow: 		{min: -5, 	max: 7	},
	// 	rxpow: 		{min: -24.5, 	max: 2.5}
	// };
	this.FOgtpPLLUnlockMask = 0x01;
	this.FOdataUnlockMask = 0x02;
	this.FOdataUnsyncMask = 0x04;
	this.FOfrequencyUnsyncMask =0x08;
	this.FOlossOpticalSignalMask = 0x10;
	this.FOlossCommunicationMask = 0x20;
	this.FOtransceiverAlarmMask = 0x40;
	this.FOtransceiverWarningMask = 0x80;

	this.FOsfpTxFaultMask = 0x01;
	this.FOsfpRxLosMask = 0x02;
	this.FOsfpDetmodMask = 0x04;

	this.FOActiveOpticalLink = 0;
	this.FOmoduleConnected = [false, false];
	this.FOTemperature = [0,0];
	this.FOVolt = [0,0];
	this.FOBias = [0,0];
	this.FOTxPow = [0,0];
	this.FORxPow = [0,0];
	this.FOsfpAlarmMask = [0, 0];
	this.FOgtpAlarmMask = [0, 0];
	this.FOerrors = [0, 0];
	this.FOlossOpticalSignal = [false, false];
	this.FOlossCommunication = [false, false];
	this.FOtransceiverAlarm = [false, false];
	this.FOtransceiverWarning = [false, false];
	this.FOgtpPLLUnlock = [false, false];
	this.FOdataUnlock = [false, false];
	this.FOdataUnsync = [false, false];
	this.FOfrequencyUnsync = [false, false];
	this.FOsfpTxFault = [false, false];
	this.FOsfpRxLos = [false, false];

	this.frm						= "";
	
	for (var nbadj=0;nbadj<2;nbadj++){
		this.signalDet.push([]);	
		this.oscDetectCH.push([]);
		this.level.push([]);
		this.gain.push([]);
		for (var band=0;band<2;band++){
			this.signalDet[nbadj].push([]);	
			this.oscDetectCH[nbadj].push([]);
			this.level[nbadj].push([]);
			this.gain[nbadj].push([]);
			for (var ch=0;ch<(2*this.CHNR);ch++){ //se duplica el tamaño para single band
				this.oscDetectCH[nbadj][band].push(false);	
			}
			for (var uldl=0;uldl<2;uldl++){
				this.signalDet[nbadj][band].push([]);	
				this.level[nbadj][band].push([]);
				this.gain[nbadj][band].push([]);
				for (var ch=0;ch<(2*this.CHNR);ch++){ //se duplica el tamaño para single band
					this.signalDet[nbadj][band][uldl].push(false);
					this.level[nbadj][band][uldl].push(0);
					this.gain[nbadj][band][uldl].push(0);
				}
			}
		}
	}
	for (var band=0;band<2;band++){
		this.bandAlarm.push([]);
		for (var k=0;k<16;k++){
			this.bandAlarm[band].push(false);
		}

	}
	for (var k=0;k<7;k++){
		this.relayONOFF.push(false);
		this.relayOpenClosed.push(false);
		this.delayTimerRunning.push(false);
		this.latchTimerRunning.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}
	for (var k=0;k<16;k++)
		this.gralAlarm.push(false);

	for (var k=0;k<8;k++) {
		this.fiberOpticAlarm.push(false);
	}

	this.checkIsZeros = function(s) {
		if (!s || s.length == 0 ) {
			return true;
		}
		for (var i = 0; i < s.length; i += 2) {
			var r = parseInt(s.substring(i,i+2), 16)
			if ( r != 0 ) {
				return false;
			}
		}
		return true;
	}

	this.parse = function(statusResponse,factUnit) {
		if ( this.checkIsZeros(statusResponse) ) {
			this.isZeros = true;
			return;
		}
		this.isZeros = false;

		var s = statusResponse;
		// if (s.length<1506) return -1; 
		var res,res2;
		var ind = 0;
		this.frm = s;
		//GLOBAL
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.fpgaErr = (res & 0x1)!=0;
		this.boardTempAlarm = (res & 0x2)!=0;
		this.ulBandPAIndependent = (res & 0x4)!=0;
		this.chBandEnabled[0] = (res & 0x10)!=0;
		this.adjBandEnabled[0] = (res & 0x20)!=0;
		this.chBandEnabled[1] = (res & 0x40)!=0;
		this.adjBandEnabled[1] = (res & 0x80)!=0;
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		this.boardCurrent = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
		//BAND
		for (var band=0;band<2;band++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.overload[band][0] = (res & 0x1)!=0; //ul
			this.overload[band][1] = (res & 0x2)!=0; //dl
			this.rxLowAlarm[0][band] = (res & 0x4)!=0; //nb
			this.rxLowAlarm[1][band] = (res & 0x8)!=0; //adj
			this.oscDetect[band] = (res & 0x10)!=0;
			this.antennaIsol[band] = (res & 0x20)!=0;
			this.isolMeasRunning[band] = (res & 0x40)!=0;
			if (band == 0) {
				this.extremeTempActionOn = (res & 0x80) != 0;
			}
			this.configGain[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.configGain[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR;ch++) this.signalDet[0][band][0][ch] = (res & (1<<ch))!=0; //nb ul
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR;ch++) this.signalDet[0][band][1][ch] = (res & (1<<ch))!=0; //nb dl
			this.maxAllowGain[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR;ch++) this.oscDetectCH[0][band][ch] = (res & (1<<ch))!=0; //nb
			this.retryTime[band] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.bbAgc[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.bbAgc[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			for (var uldl=0;uldl<2;uldl++){
				for (var ch=0;ch<this.CHNR;ch++){
					this.level[0][band][uldl][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
					this.gain[0][band][uldl][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
				}
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.agcFail[band][uldl] = (res & 0x1)!=0; 
				if ( band == 0 && uldl == 0 ) {
					this.blocked = (this.agcFail[0][0] != 0);
				}
				this.paFail[band][uldl] = (res & 0x2)!=0; 
				this.vswr[band][uldl] = (res & 0x4)!=0; 
				this.txLow[band][uldl] = (res & 0x8)!=0; 
				this.statePaOn[band][uldl] = (res & 0x80)!=0; 
				this.estTxPow[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
				this.detTxPow[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
				this.refTxPow[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
				this.paCurrent[band][uldl] = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
			}
			for (var uldl=0;uldl<2;uldl++){
				for (var ch=0;ch<this.ADJNR;ch++){
					this.level[1][band][uldl][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
					this.gain[1][band][uldl][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
				}
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var ch=0;ch<this.ADJNR;ch++) this.signalDet[1][band][uldl][ch] = (res & (1<<ch))!=0;//adj
				if (uldl==0){
					for (var ch=0;ch<this.ADJNR;ch++) this.oscDetectCH[1][band][ch] = (res & (1<<(ch+4)))!=0;//adj
				}
			}
		}

		if (typeof(factUnit)!=="undefined"){ //Se asume que si factUnit no está definido, es que no se necesita info de ch single band
			//arreglo para single band.
			//si single band0 stat1-32 band 1 --> stat33-64 band0
			if (factUnit.singleBandEnabled[0]){
				for (var ch=0;ch<this.CHNR;ch++){
					this.oscDetectCH[0][0][ch+this.CHNR] = this.oscDetectCH[0][1][ch];
					for (var i=0;i<2;i++){
						this.signalDet[0][0][i][ch+this.CHNR] = this.signalDet[0][1][i][ch];
						this.level[0][0][i][ch+this.CHNR] = this.level[0][1][i][ch];
						this.gain[0][0][i][ch+this.CHNR] = this.gain[0][1][i][ch];
					}
				}
			}
			//si single band1 stat1-32 band 0 --> stat33-64 band1
			if (factUnit.singleBandEnabled[1]){
				for (var ch=0;ch<this.CHNR;ch++){
					this.oscDetectCH[0][1][ch+this.CHNR] = this.oscDetectCH[0][0][ch];
					for (var i=0;i<2;i++){
						this.signalDet[0][1][i][ch+this.CHNR] = this.signalDet[0][0][i][ch];
						this.level[0][1][i][ch+this.CHNR] = this.level[0][0][i][ch];
						this.gain[0][1][i][ch+this.CHNR] = this.gain[0][0][i][ch];
					}
				}
			}
		}

		//NFPA Status
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<7;k++){
				this.relayONOFF[k] = (res & (1<<k))!=0;
				this.relayOpenClosed[k] = (res2 & (1<<k))!=0;
			}
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++)
				this.gralAlarm[k] = (res & (1<<k))!=0;
			
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++)
				this.gralAlarm[8+k] = (res & (1<<k))!=0;			
			
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++) {
				this.fiberOpticAlarm[k] = (res & (1<<k))!=0;
			}
			for (var b = 0; b < 2; b++) {
				for (var i=0;i<2;i++) {
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					for (var k=0;k<8;k++){
						this.bandAlarm[b][k+8*i] = (res & (1<<k))!=0;
					}
				}
			}
			for (var k=0;k<7;k++){
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				this.delayTimerRunning[k] = (res & 0x80000000)!=0;
				this.delayTimer[k] = res & 0x7fffffff;
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				this.latchTimerRunning[k] = (res & 0x80000000)!=0;
				this.latchTimer[k] = res & 0x7fffffff;
			}
		// FO
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k = 0, mask = 1; k < 2; k++, mask <<= 1) {
			this.FOmoduleConnected[k] = !!(res & mask);
		}
		this.FOActiveOpticalLink = (res & mask) ? 1 : 0;	// sólo remoto
		for (var k = 0; k < 2; k++) {
			this.FOTemperature[k] = to_float(parseInt(s.substring(ind,ind+4), 16)); ind+=4;
			this.FOVolt[k] = parseInt(s.substring(ind,ind+4),16) / 10000; ind+=4;
			this.FOBias[k] = parseInt(s.substring(ind,ind+4),16) / 500; ind+=4;
			this.FOTxPow[k] = 10 * Math.log(parseInt(s.substring(ind,ind+4),16) + 1e-9)/Math.LN10 - 40; ind+=4;
			this.FORxPow[k] = 10 * Math.log(parseInt(s.substring(ind,ind+4),16) + 1e-9)/Math.LN10 - 40; ind+=4;
			this.FOsfpAlarmMask[k] = parseInt(s.substring(ind,ind+2),16); ind+=2;
			this.FOgtpAlarmMask[k] = parseInt(s.substring(ind,ind+2),16); ind+=2;
			this.FOerrors[k] = parseInt(s.substring(ind,ind+4),16); ind+=4;
			this.FOlossOpticalSignal[k] = !!(this.FOgtpAlarmMask[k] & this.FOlossOpticalSignalMask);
			this.FOlossCommunication[k] = !!(this.FOgtpAlarmMask[k] & this.FOlossCommunicationMask);
			this.FOtransceiverAlarm[k] = !!(this.FOgtpAlarmMask[k] & this.FOtransceiverAlarmMask);
			this.FOtransceiverWarning[k] = !!(this.FOgtpAlarmMask[k] & this.FOtransceiverWarningMask);
			this.FOgtpPLLUnlock[k] = !!(this.FOgtpAlarmMask[k] & this.FOgtpPLLUnlockMask);
			this.FOdataUnlock[k] = !!(this.FOgtpAlarmMask[k] & this.FOdataUnlockMask);
			this.FOdataUnsync[k] = !!(this.FOgtpAlarmMask[k] & this.FOdataUnsyncMask);
			this.FOfrequencyUnsync[k] = !!(this.FOgtpAlarmMask[k] & this.FOfrequencyUnsyncMask);
			this.FOsfpTxFault[k] = !!(this.FOsfpAlarmMask[k] & this.FOsfpTxFaultMask);
			this.FOsfpRxLos[k] = !!(this.FOsfpAlarmMask[k] & this.FOsfpRxLosMask);
			this.FOtransceiverAlarm[k] = this.FOtransceiverAlarm[k] || this.FOsfpTxFault[k]; //adding FOsfpTxFault to FOtransceiverAlarm
			this.FOtransceiverAlarm[k] = this.FOtransceiverAlarm[k] || this.FOgtpPLLUnlock[k]; //adding FOgtpPLLUnlock to FOtransceiverAlarm

		}
		this.FORemotesOpticalPort = parseInt(s.substring(ind,ind+2), 16); ind+=2; // sólo maaster
		// for (var nfib=1;nfib<=2;nfib++)
		// {
		// 	bitmask = parseInt(serverResponse.substr(shift,2),16);
		// 	shift+=2;
		// 	num  =  parseInt(serverResponse.substr(shift,4),16);
		// 	optErrorsSet(nfib, num);
		// 	warning = false;
		// 	alarm = false;
		// 	shift-=24;

		// 	var temp = to_float(parseInt(s.substring(ind,ind+4), 16)); ind+=4;
		// 	if ((temp < foDataLimitsAlarm.temperature.min) 
		// 		|| (temp > foDataLimitsAlarm.temperature.max))
		// 	{
		// 		alarm = true;
		// 	} else 	if ((temp < foDataLimitsWarning.temperature.min) 
		// 		|| (temp > foDataLimitsWarning.temperature.max))
		// 	{
		// 		warning = true;
	 // 		}
		// 	shift+=4;
		// 	volt = parseInt(serverResponse.substr(shift,4),16) / 10000;
		// 	if ((volt < foDataLimitsAlarm.voltage.min) 
		// 		|| (volt > foDataLimitsAlarm.voltage.max))
		// 	{
		// 		alarm = true;
		// 	} else if ((volt < foDataLimitsWarning.voltage.min) 
		// 		|| (volt > foDataLimitsWarning.voltage.max))
		// 	{
		// 		warning = true;
	 // 		}
		// 	shift+=4;
		// 	bias = parseInt(serverResponse.substr(shift,4),16) / 500;
		// 	if ((bias < foDataLimitsAlarm.bias.min) 
		// 		|| (bias > foDataLimitsAlarm.bias.max))
		// 	{
		// 		alarm = true;
		// 	} else if ((bias < foDataLimitsWarning.bias.min) 
		// 		|| (bias > foDataLimitsWarning.bias.max))
		// 	{
		// 		warning = true;
	 // 		}
		// 	shift+=4;
		// 	txpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		// 	if ((txpow < foDataLimitsAlarm.txpow.min) 
		// 		|| (txpow > foDataLimitsAlarm.txpow.max))
		// 	{
		// 		alarm = true;
		// 	} else if ((txpow < foDataLimitsWarning.txpow.min) 
		// 		|| (txpow > foDataLimitsWarning.txpow.max))
		// 	{
		// 		warning = true;
	 // 		}
		// 	//fiberPowerOutSet(nfib, txpow);
		// 	shift+=4;
		// 	rxpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		// 	if (rxpow > foDataLimitsAlarm.rxpow.max) {
		// 		alarm = true;
		// 	}
		// 	fiberPowerSet(nfib, rxpow);
		// 	shift+=4;
		// 	sfpalarm = parseInt(serverResponse.substr(shift,2),16);
		// 	shift+=2;
		// 	gtpalarm = parseInt(serverResponse.substr(shift,2),16);
		// 	if ((sfpalarm & 0x01) != 0) {
		// 		alarm = true;
		// 	}
		// 	if ((gtpalarm & 0x01) != 0) {
		// 		alarm = true;
		// 	}
		// 	optStatusLedSet(nfib, alarm? "red" : (warning? "yellow" : "green"));
		// 	warning = false;
		// 	alarm = false;
			
		// 	var s = (nfib == 1 ? 36 : 64);
		// 	var v = parseInt(serverResponse.substr(s, 2), 16);
		// 	alarm  = ((v & 0x10) != 0);
		// 	optRxLedSet(nfib, alarm? "red": "green");
		// 	alarm = ((v & 0x0E) != 0);
		// 	optRxCommLedSet(nfib, alarm? "red": "green");
		// 	shift+=28;
		// }
	}
	this.isFOlinkOn = function(nfib) {
		return (nfib < 2 
			&& this.FOmoduleConnected[nfib]
			&& !this.FOlossCommunication[nfib]);
	}
	this.isOneFOlinkOn = function() {
		for (var nfib = 0; nfib < 2; nfib++ ) {
			if ( this.isFOlinkOn(nfib) ) {
				return true;
			}
		}
		return false;
	}
}