function MonitorGlobal() {
	this.isAggBasic = true;
	this.isZeros = false;
	this.remoteResponseValid = [];
	this.frameUnit = [];
	this.monitorUnit = [];
	this.frameSeparator = "\t\t\t";

	this.parse = function(statusResponse) {
		if ( this.checkIsZeros(statusResponse) ) {
			this.isZeros = true;
			return -1;
		}
		this.isZeros = false;

		this.frameUnit = statusResponse.split(this.frameSeparator);
		if (this.frameUnit[0].length < (statMasterLength+remoteHeaderLength) || this.frameUnit[0].length >= (masterGlobalConfigLength+remoteHeaderLength)) {
			this.remoteResponseValid[0] = false;
			this.isZeros = true;
			return -1;
		}
		this.monitorUnit[0] = new Monitor(0);
		this.monitorUnit[0].parse(this.frameUnit[0]);
		this.remoteResponseValid[0] = true;
		for (var n = 1; n < this.frameUnit.length; n++ ) {
			var indexRemote = parseInt(this.frameUnit[n].substring(0,4),16); if (indexRemote<0) indexRemote+=65536;
			if (indexRemote==0){
				console.log("Unexpected master frame");
				continue; //Unexpected master frame
			}
			var statLengthMin = statBasicRemoteLength;
			var statLengthMax = remoteBasicGlobalConfigLength;
			if ((indexRemote & 0xff)==0){
				statLengthMin = statBasicExpLength;
				statLengthMax = expBasicGlobalConfigLength;
			}
			if (this.frameUnit[n].length < (statLengthMin+remoteHeaderLength) || this.frameUnit[n].length >= (statLengthMax+remoteHeaderLength)) {
				this.remoteResponseValid[indexRemote] = false;
				console.log("Unexpected remote/exp frame");
			}else{
				this.remoteResponseValid[indexRemote] = (1 === parseInt(this.frameUnit[n].substring(4,6),16));
				this.monitorUnit[indexRemote] = new BasicMonitor(indexRemote);
				this.monitorUnit[indexRemote].parse(this.frameUnit[n].substr(remoteHeaderLength));
			}
		}
		return 0;
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

function Monitor(remoteNr) {
	this.isAggBasic					= false;
	this.Nr							= remoteNr;
	this.isMaster					= this.Nr == 0;
	this.isExp						= ((this.Nr & 0xff) == 0) && !this.isMaster;
	this.isRemote					= this.Nr != 0 && !this.isExp;
	this.responseValid				= false;
	this.NR_OF_RELAYS_MAX			= 10;
	this.nPorts 					= this.isRemote ? 2 : 8;
	this.isValidFrame 				= true;
	this.CHNR 						= 64;
	this.ADJNR 						= 4;
	this.blocked					= false;
	this.extremeTempActionOn		= false;
	this.ulBandPAIndependent		= true;
	this.chBandEnabled				= [true,true]; //activación sección NB band0/1
	this.adjBandEnabled				= [true,true]; //activación sección ADJ band0/1
	this.boardTemp					= 0;
	this.boardCurrent				= 0;
	this.isolMeasRunning			= [false,false]; //band 0/1
	this.configAtt					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.configInputAgc				= [0,0]; //band 0/1
	this.signalDet					= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.oscDetectCH				= []; // nb/adj band0/1 nfilter [2][2][32]
	this.cnDet						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.maxAllowGain				= [0,0]; //band 0/1
	this.retryTime					= [0,0]; //band 0/1
	this.inputAgc					= [0,0]; //band 0/1, old bbAGC renamed for clarity
	this.bbAgc						= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.level						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.gain						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.statePaOn					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.rfBBLevel					= [[0,0],[0,0]]; //band 0/1 rx/tx
	this.paCurrent					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.relayONOFF					= []; // 7 boolean/relay
	this.relayOpenClosed			= []; // 7 boolean/relay
	this.gralAlarm					= []; //24 boolean/alarm
	this.gralAlarmR					= []; //24 boolean/alarm
	this.bandAlarm					= []; //2band x 16boolean/alarm
	this.bandAlarmR					= []; //2band x 16boolean/alarm
	this.delayTimerRunning			= []; // 7 boolean/relay
	this.delayTimer					= []; // 7 int/relay
	this.latchTimerRunning			= []; // 7 boolean/relay
	this.latchTimer					= []; // 7 int/relay	
	this.isZeros = false;
	this.delayMeas					= [];
	this.isPrimary					= true;
	this.bbuDeepDischarge;
	
	this.fibInfo					= new fiberInfo(this.Nr);
	this.crcConf					= [0,0,0,0,0]; //4: 0-Gain/Power, 1-Filter Band 0, 2-Filter Band 1, 3-Squelch, 4-Alarm. Only used Filter in master
	
	var self = this;
		
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

	this.FOTemperature = [];
	this.FOVolt = [];
	this.FOBias = [];
	this.FOTxPow = [];
	this.FORxPow = [];
	this.FOsfpAlarmMask = [];
	this.FOgtpAlarmMask = [];
	this.FOerrors = [];
	this.FOlossOpticalSignal = [];
	this.FOtransceiverAlarm = [];
	this.FOtransceiverWarning = [];
	this.FOgtpPLLUnlock = [];
	this.FOdataUnlock = [];
	this.FOdataUnsync = [];
	this.FOfrequencyUnsync = [];
	this.FOsfpTxFault = [];
	this.FOsfpRxLos = [];
	this.bbu_serial_mode;
	this.bbu_type;
	
	this.powDirect				= [0,0];// 2 --> 1double/band
	this.powReverse				= [0,0];// 2 --> 1double/band
	this.retLoss				= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeHigh	= [0,0];// 2 --> 1double/band only master
	this.txLowerPowerTimeLow	= [0,0];// 2 --> 1double/band only master
	this.adPowDirect			= [0,0];// 2 --> 1double/band
	this.adPowReverse			= [0,0];// 2 --> 1double/band
	this.adDlPaCurr				= [0,0];// 2 --> 1double/band
	this.adTempSense			= 0;
	
	this.bbLevel = [-128, -128]; //only master
	this.bbuChargerTemperature;
	this.bbuBatteryTemperature;
	this.bbuIndividualBatteryVoltage;
	this.bbuBatteryStatusVoltage = [0,0];
	this.bbuSystemVoltage;
	this.bbuBatteryVoltageBank;
	this.bbuMainCurrent;
	this.bbuBatteryCurrent;
	this.bbuBuzzerStatus;
	this.bbuBuzzerMuteTime;
	this.bbuBuzzerRemainingTime;
	this.bbuChargerErrorCode;
	this.bbuAlarm = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]; //16 boolean/alarm
	this.bbuAlarmR = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]; //16 boolean/alarm
	this.bbuDeepDischargeCounter;
	/* BBU MVO2 status parameters for factory */
	this.bbuStatusFactoryParams = [
		[
			{id: 'MAX_CHARGE_TIMER'     , val: 0, valueStr: '-'},
			{id: 'CV_TIMER'             , val: 0, valueStr: '-'},
			{id: 'ABSORB_TIMER'         , val: 0, valueStr: '-'},
			{id: 'EQUALIZE_TIMER'       , val: 0, valueStr: '-'},
			{id: 'CHARGER_STATE'        , val: 0, valueStr: '-'},
			{id: 'CHARGE_STATUS'        , val: 0, valueStr: '-'},
			{id: 'LIMIT_ALERTS'         , val: 0, valueStr: '-'},
			{id: 'CHARGER_STATE_ALERTS' , val: 0, valueStr: '-'},
			{id: 'CHARGE_STATUS_ALERTS' , val: 0, valueStr: '-'},
			{id: 'SYSTEM_STATUS'        , val: 0, valueStr: '-'},
			{id: 'VBAT'                 , val: 0, valueStr: '-'},
			{id: 'VIN'                  , val: 0, valueStr: '-'},
			{id: 'VSYS'                 , val: 0, valueStr: '-'},
			{id: 'IBAT'                 , val: 0, valueStr: '-'},
			{id: 'IIN'                  , val: 0, valueStr: '-'},
			{id: 'DIE_TEMP'             , val: 0, valueStr: '-'},
			{id: 'NTC_RATIO'            , val: 0, valueStr: '-'},
			{id: 'BSR'                  , val: 0, valueStr: '-'},
			{id: 'JEITA_REGION'         , val: 0, valueStr: '-'},
			{id: 'CHEM_CELLS'           , val: 0, valueStr: '-'},
			{id: 'ICHARGE_DAC'          , val: 0, valueStr: '-'},
			{id: 'VCHARGE_DAC'          , val: 0, valueStr: '-'},
			{id: 'IIN_LIMIT_DAC'        , val: 0, valueStr: '-'},
			{id: 'VBAT_FILT'            , val: 0, valueStr: '-'},
			{id: 'ICHARGE_BSR'          , val: 0, valueStr: '-'},
			{id: 'RESERVED'             , val: 0, valueStr: '-'},
			{id: 'MEAS_SYS_VALID'       , val: 0, valueStr: '-'},
			{id: 'MAX_CHARGE_TIMER'     , val: 0, valueStr: '-'}
		],
		[
			{id: 'VOUT_SET'             , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'IOUT_SET'             , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'FAULT_STATUS'         , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: false },
			{id: 'READ_VOUT'            , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'READ_IOUT'            , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'READ_TEMPERATURE_1'   , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'MFR_ID_B0B5'          , val: 0, valueStr: '-', type: 'str',    nchars: 12, showAsHex: false },
			{id: 'MFR_MODEL_B0B5'       , val: 0, valueStr: '-', type: 'str',    nchars: 12, showAsHex: false },
			{id: 'MFR_REVISION_B0B5'    , val: 0, valueStr: '-', type: 'rev',    nchars: 6,	 showAsHex: false },
			{id: 'MFR_LOCATION_B0B2'    , val: 0, valueStr: '-', type: 'str',    nchars: 3,	 showAsHex: false },
			{id: 'MFR_DATE_B0B5'        , val: 0, valueStr: '-', type: 'str',    nchars: 6,	 showAsHex: false },
			{id: 'MFR_SERIAL_B0B5'      , val: 0, valueStr: '-', type: 'str',    nchars: 12, showAsHex: false },
			{id: 'CURVE_CC'             , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'CURVE_CV'             , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'CURVE_FV'             , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'CURVE_TC'             , val: 0, valueStr: '-', type: 'float',  nchars: 4,	 showAsHex: false },
			{id: 'CURVE_CONFIG'         , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: true  },
			{id: 'CURVE_CC_TIMEOUT'     , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: false },
			{id: 'CURVE_CV_TIMEOUT'     , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: false },
			{id: 'CURVE_FV_TIMEOUT'     , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: false },
			{id: 'CHG_STATUS'           , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: true  },
			{id: 'SCALING_FACTOR'       , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: false },
			{id: 'SYSTEM_STATUS'        , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: true  },
			{id: 'SYSTEM_CONFIG'        , val: 0, valueStr: '-', type: 'uint16', nchars: 2,	 showAsHex: true  },
		]
	];
	this.future_upgrade = [];
	for (var i=0; i<this.C_BBUMVO2_UPGRADE_BYTES;i++) this.future_upgrade.push(0); 
	//new flex2.0 features:
	this.globalDetection			= [[false,false],[false,false]]; //nb/adj band 0/1
	this.plaMeas					= [0,0];// 2 PLA meas
	this.plaElapsedTime				= 0;
	this.device_version_index		= 0;
	
	this.frm						= "";
	
	for (var nbadj=0;nbadj<2;nbadj++){
		this.signalDet.push([]);	
		this.oscDetectCH.push([]);
		this.cnDet.push([]);
		this.level.push([]);
		this.gain.push([]);
		for (var band=0;band<2;band++){
			this.signalDet[nbadj].push([]);	
			this.oscDetectCH[nbadj].push([]);
			this.cnDet[nbadj].push([]);
			this.level[nbadj].push([]);
			this.gain[nbadj].push([]);
			for (var ch=0;ch<(this.CHNR);ch++){
				this.oscDetectCH[nbadj][band].push(false);
				this.cnDet[nbadj][band].push(false);	
			}
			for (var uldl=0;uldl<2;uldl++){
				this.signalDet[nbadj][band].push([]);	
				this.level[nbadj][band].push([]);
				this.gain[nbadj][band].push([]);
				for (var ch=0;ch<(this.CHNR);ch++){
					this.signalDet[nbadj][band][uldl].push(false);
					this.level[nbadj][band][uldl].push(0);
					this.gain[nbadj][band][uldl].push(0);
				}
			}
		}
	}
	for (var band=0;band<2;band++){
		this.bandAlarm.push([]);
		this.bandAlarmR.push([]);
		for (var k=0;k<16;k++){
			this.bandAlarm[band].push(false);
			this.bandAlarmR[band].push(false);
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
	for (var k=0;k<24;k++){
		this.gralAlarm.push(false);
		this.gralAlarmR.push(false);
	}	
	for (var k=0;k<this.nPorts;k++) {
		this.FOTemperature.push(0);
		this.FOVolt.push(0);
		this.FOBias.push(0);
		this.FOTxPow.push(0);
		this.FORxPow.push(0);
		this.FOsfpAlarmMask.push(0);
		this.FOgtpAlarmMask.push(0);
		this.FOerrors.push(0);
		this.FOlossOpticalSignal.push(false);
		this.FOtransceiverAlarm.push(false);
		this.FOtransceiverWarning.push(false);
		this.FOgtpPLLUnlock.push(false);
		this.FOdataUnlock.push(false);
		this.FOdataUnsync.push(false);
		this.FOfrequencyUnsync.push(false);
		this.FOsfpTxFault.push(false);
		this.FOsfpRxLos.push(false);
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

	this.parse = function(statusResponse) {
		this.isZeros = false;
		var s = statusResponse;
		if ((s.length-remoteHeaderLength)<(this.isMaster ? statMasterLength : this.isExp? statExpLength : statRemoteLength)){
			this.responseValid = false;
			return;
		}
		var res,res2;
		var ind = 4;
		this.frm = s;
		var rxud = this.isMaster?1:0;
		var txud = this.isMaster?0:1;
		res =  parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.responseValid = (res & 0x1)!=0;
		if (this.isMaster){
			this.device_version_index = 2;
		}else{
			this.device_version_index = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		}
		//GLOBAL
		if (!this.isExp){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.ulBandPAIndependent = (res & 0x4)!=0;
			this.chBandEnabled[0] = (res & 0x10)!=0;
			this.adjBandEnabled[0] = (res & 0x20)!=0;
			this.chBandEnabled[1] = (res & 0x40)!=0;
			this.adjBandEnabled[1] = (res & 0x80)!=0;
		}
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		this.boardCurrent = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
		if (this.isRemote){
			this.retryTime[0] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		}
		//BAND
		for (var band=0;band<2;band++){
			if (this.isRemote){
				//GENERAL
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.globalDetection[0][band] = (res & 0x4)!=0;
				this.globalDetection[1][band] = (res & 0x8)!=0;
				if (band == 0) {
					this.isolMeasRunning[band] = (res & 0x40)!=0;
					this.extremeTempActionOn = (res & 0x80) != 0;
				}
			}
			//PA ENABLED UL + BLOCKED
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.statePaOn[band][0] = (res & 0x80)!=0; 
			if ( band == 0 ) {
				this.blocked = (res & 0x1)!=0;
			}
			if (!this.isExp){
				//PA ENABLED DL
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (this.isMaster){
					if (band==0) this.isPrimary = (res & 0x10)==0;
					this.globalDetection[0][band] = (res & 0x4)!=0;
					this.globalDetection[1][band] = (res & 0x8)!=0;
				}
				this.statePaOn[band][1] = (res & 0x80)!=0; 
				//GAIN, POWER, MAX ALLOW GAIN
				this.configAtt[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
				this.configAtt[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;if (res>127) res-=256;
				this.configInputAgc[band] = res;
				if (!this.isMaster){
					this.maxAllowGain[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				}
				//SIGNAL DETECTION NB
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				for (var ch=0;ch<this.CHNR/2;ch++) this.signalDet[0][band][rxud][ch] = (res & (1<<ch))!=0; //nb (1-32)
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				for (var ch=0;ch<this.CHNR/2;ch++) this.signalDet[0][band][rxud][ch+this.CHNR/2] = (res & (1<<ch))!=0; //nb (33-64)
				if (!this.isMaster){
				//OSCILLATION DETECTION NB
					res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
					for (var ch=0;ch<this.CHNR/2;ch++) this.oscDetectCH[0][band][ch] = (res & (1<<ch))!=0; //nb (1-32)
					res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
					for (var ch=0;ch<this.CHNR/2;ch++) this.oscDetectCH[0][band][ch+this.CHNR/2] = (res & (1<<ch))!=0; //nb (33-64)
					//CN UL LOW DETECTION NB
					res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
					for (var ch=0;ch<this.CHNR/2;ch++) this.cnDet[0][band][ch] = (res & (1<<ch))!=0; //nb (1-32)
					res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
					for (var ch=0;ch<this.CHNR/2;ch++) this.cnDet[0][band][ch+this.CHNR/2] = (res & (1<<ch))!=0; //nb (33-64)
				}
				//SIGNAL AND OSCILLATION DETECTION ADJ
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var ch=0;ch<this.ADJNR;ch++) this.signalDet[1][band][rxud][ch] = (res & (1<<ch))!=0;//adj
				if (!this.isMaster){
					for (var ch=0;ch<this.ADJNR;ch++) this.oscDetectCH[1][band][ch] = (res & (1<<(ch+4)))!=0;//adj
					//CN UL LOW DETECTION ADJ
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					for (var ch=0;ch<this.ADJNR;ch++) this.cnDet[1][band][ch] = (res & (1<<ch))!=0;//adj
				}
				//DL/UL INPUT AGC
				this.inputAgc[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl master/ul remote
				//UL/DL PA CURRENT, RFOUT, FWD/REV POWER
				this.paCurrent[band][txud] = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
				if (this.isMaster){
					this.rfBBLevel[band][0] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
				}
				this.rfBBLevel[band][1] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
				if (!this.isMaster){
					this.powDirect[band] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
					this.powReverse[band] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
					this.retLoss[band] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
				}
			}
			//DIGITAL BB AGCs
			this.bbAgc[band][0] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //uls
			if(!this.isExp){
				if (!this.isMaster){
					this.bbAgc[band][1] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //dl
				}
				//LEVEL/AGC NB CH 1-64
				for (var ch=0;ch<this.CHNR;ch++){
					this.level[0][band][rxud][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
					this.gain[0][band][rxud][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
				}
				//LEVEL/AGC ADJ CH 1-4
				for (var ch=0;ch<this.ADJNR;ch++){
					this.level[1][band][rxud][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
					this.gain[1][band][rxud][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
				}
			}
		}
		if (this.isRemote){
			//LEVEL IN UL min/max - AUTO UL GAIN & SQUELCH FUNCTION: DISAPPEARS 42UNUSED CHARS
			ind+=42;
			//PATH LOSS ANALYZER
			for (var i=0; i<2; i++) {
				this.plaMeas[i] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
			}
			this.plaElapsedTime = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		}
		//RELAY STATUS
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		res2 = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			this.relayONOFF[k] = (res & (1<<k))!=0;
			this.relayOpenClosed[k] = (res2 & (1<<k))!=0;
		}
		//RELAY TIMER
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerRunning[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerRunning[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		//GLOBAL ALARM STATUS
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<24;k++)
			this.gralAlarm[k] = (res & (1<<k))!=0;
		
		if (!this.isExp){
			//BAND ALARM STATUS
			for (var band=0;band<2;band++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var k=0;k<16;k++){
					this.bandAlarm[band][k] = (res & (1<<k))!=0;
				}
			}
		}
		//BBU ALARM STATUS
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++) {
			this.bbuAlarm[k] = (res & (1<<k))!=0;
		}
		if (this.isMaster){
			//GLOBAL ALARM STATUS OF REMOTES AND EXPANSIONS
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<24;k++)
				this.gralAlarmR[k] = (res & (1<<k))!=0;
			//BAND ALARM STATUS OF REMOTES
			for (var band=0;band<2;band++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var k=0;k<16;k++){
					this.bandAlarmR[band][k] = (res & (1<<k))!=0;
				}
			}
			//BBU ALARM STATUS OF REMOTES AND EXPANSIONS
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<16;k++) {
				this.bbuAlarmR[k] = (res & (1<<k))!=0;
			}
		}
		// FO
		if (!this.isMaster){
			this.fibInfo.parse(s.substring(ind,ind+this.fibInfo.FrameLength));ind+=this.isExp?4:2;
		}
		//FIBER INFO
		for (var k = 0; k < this.nPorts; k++) {
			this.FOTemperature[k] = to_float(parseInt(s.substring(ind,ind+4), 16)); ind+=4;
			this.FOVolt[k] = parseInt(s.substring(ind,ind+4),16) / 10000; ind+=4;
			this.FOBias[k] = parseInt(s.substring(ind,ind+4),16) / 500; ind+=4;
			this.FOTxPow[k] = 10 * Math.log(parseInt(s.substring(ind,ind+4),16) + 1e-9)/Math.LN10 - 40; ind+=4;
			this.FORxPow[k] = 10 * Math.log(parseInt(s.substring(ind,ind+4),16) + 1e-9)/Math.LN10 - 40; ind+=4;
			this.FOsfpAlarmMask[k] = parseInt(s.substring(ind,ind+2),16); ind+=2;
			this.FOgtpAlarmMask[k] = parseInt(s.substring(ind,ind+2),16); ind+=2;
			this.FOerrors[k] = parseInt(s.substring(ind,ind+4),16); ind+=4;
			this.FOlossOpticalSignal[k] = !!(this.FOgtpAlarmMask[k] & this.FOlossOpticalSignalMask);
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
		//BBU
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbuDeepDischarge = (res & 0x80) != 0;
		this.bbu_serial_mode = (res & 0x01);
		this.bbu_type = ((res >> 1) & 0x07);
		
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuChargerErrorCode = res;
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbuChargerTemperature = cSignedByte(res);
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbuBatteryTemperature = cSignedByte(res);
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuIndividualBatteryVoltage = res;
		for (var i=0; i<4; i++) {
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.bbuBatteryStatusVoltage[i] = res;
		}
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuSystemVoltage = res;
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuBatteryVoltageBank = res;
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuMainCurrent = res;
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuBatteryCurrent = cSignedInt(res);
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbuBuzzerStatus = (res & (1))!=0;
		res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
		this.bbuBuzzerMuteTime = res;
		res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
		this.bbuBuzzerRemainingTime = res;
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuDeepDischargeCounter = res;
		//A/D DETECTORS
		if (!this.isExp){
			for (var b=0; b<2; b++) {
				if (!this.isMaster){
					this.adPowDirect[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					this.adPowReverse[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				}
				this.adDlPaCurr[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			}
		}
		this.adTempSense = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		if (this.isMaster){
			//TIMERS RX POWER LOW (ONLY MASTER)
			for (var b=0; b<2; b++) {
				res = parseInt(s.substring(ind,ind+6), 16); ind+=6;
				this.txLowerPowerTimeHigh[b] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;
				res = parseInt(s.substring(ind,ind+6), 16); ind+=6;
				this.txLowerPowerTimeLow[b] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;
			}
			//BROADBAND INPUT LEVELS (ONLY MASTER)
			for (var b=0; b<2; b++) {
				this.bbLevel[b] = to_float(parseInt(s.substring(ind,ind+4),16));ind+=4;
			}
		}
		//BBU factory parameters
		this.parseFactoryStatusDataMvo2(s.substring(ind,ind+274), this.bbu_type);ind+=274;
		if (this.isMaster){
			//DELAY MEASUREMENTS ONLY MASTER (FIRST 8 DIRECT REMOTES, LAST 56 REMOTES CONNECTED THROUGH EXPANSION) 
			for (var k=0; k<=8; k++){
				for (var j=1; j<=(k==0?8:7); j++){
					this.delayMeas[(k<<8)+j] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				}
			}
			this.fibInfo.parse(s.substring(ind,ind+this.fibInfo.FrameLength));ind+=this.fibInfo.FrameLength;
			//CRC CONFSs
			this.crcConf[1] = parseInt(s.substring(ind,ind+8),16);ind+=8;//FilterBand0 CRC
			this.crcConf[2] = parseInt(s.substring(ind,ind+8),16);ind+=8;//FilterBand1 CRC

		}
	}
	this.isFOlinkOn = function(nfib) {
		return (nfib < this.nPorts && this.fibInfo.FOmoduleConnected[nfib+1] && !this.fibInfo.FOlossCommunication[nfib]);
	}
	this.isOneFOlinkOn = function() {
		for (var nfib = 0; nfib < this.nPorts; nfib++ ) {
			if ( this.isFOlinkOn(nfib) ) {
				return true;
			}
		}
		return false;
	}
	this.getBbuSerialMode = function() {
		var isSerialMode = this.bbu_serial_mode!=0;
		if (this.isRemote && this.device_version_index==0) isSerialMode = false; //remotes < BBUMVO2 only dry contact mode
		return isSerialMode;
	}
	this.getBbuType = function() {
		return (this.bbu_type);
	}
	this.getNrOfRelaysSupported = function(version) {
		if (!this.getBbuSerialMode() || this.bbu_type == 0){
			if (this.isRemote){
				return 4;
			}else{
				return (this.isMaster && version.compareSw(6,0)>=0? 4:7);//master SDRP only has 4 relays in dry contact mode
			}
		}
		if (this.bbu_type == 1) {
			return 10; 	// BBU MVO.2 standard
		} else if (this.bbu_type == 2) {
			return 9; 	// BBU MVO.2 high power
		} else {
			return (!this.isRemote? 7: 4);	// default
		}
	}
	this.isBbuDisconnectionAlarm = function() {
		if (!this.getBbuSerialMode()) {
			return false;
		}
		return this.bbuAlarm[4];
	}
	this.parseFactoryStatusDataMvo2 = function (s, bbu_type) {
		if ( bbu_type == 1) {
			this.parseFactoryStatusDataMvo2Std(s);
		} else if (bbu_type == 2) {
			this.parseFactoryStatusDataMvo2HP(s);
		}
	}
	this.parseFactoryStatusDataMvo2Std = function(s) {
		var n = 0;	/* BBU MVO2 Std */
		var ind = 0;
		var res = 0;
		for (var i=0; i < this.bbuStatusFactoryParams[n].length; i++) {
			res = this.parseUInt16Pic(s.substring(ind,ind+4)); ind+=4;
			this.bbuStatusFactoryParams[n][i].val = res;
			this.bbuStatusFactoryParams[n][i].valueStr = hexformat(res, 4);
		}
		for (var i=0; i<this.C_BBUMVO2_UPGRADE_BYTES;i++) {
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.future_upgrade[i] = res;
		}
	}
	this.parseFactoryStatusDataMvo2HP = function(s) {
		var n = 1;	/* BBU MVO2 HP */
		var ind = 0;
		for (var i=0; i < this.bbuStatusFactoryParams[n].length; i++) {
			if (this.bbuStatusFactoryParams[n][i].type == 'float') {
				var res = this.parseFloatPic(s.substring(ind,ind+8)); ind+=8;
				this.bbuStatusFactoryParams[n][i].val = res;
				this.bbuStatusFactoryParams[n][i].valueStr = res.toFixed(2) ;
			} else if (this.bbuStatusFactoryParams[n][i].type == 'uint16') {
				var res = this.parseUInt16Pic(s.substring(ind,ind+4)); ind+=4;
				this.bbuStatusFactoryParams[n][i].val = res;
				if (this.bbuStatusFactoryParams[n][i].showAsHex) {
					this.bbuStatusFactoryParams[n][i].valueStr = hexformat(res, 4);
				} else {
					this.bbuStatusFactoryParams[n][i].valueStr = res;
				}
			} else if (this.bbuStatusFactoryParams[n][i].type == 'str') {
				var nchars = this.bbuStatusFactoryParams[n][i].nchars;
				var res = this.parseStringPic(s.substring(ind,ind+nchars*2)); ind+=nchars*2;
				this.bbuStatusFactoryParams[n][i].val = res;
				this.bbuStatusFactoryParams[n][i].valueStr = res;
			} else if (this.bbuStatusFactoryParams[n][i].type == 'rev') {
				var nchars = this.bbuStatusFactoryParams[n][i].nchars;
				var res = this.parseRevision(s.substring(ind,ind+nchars*2)); ind+=nchars*2;
				this.bbuStatusFactoryParams[n][i].val = res;
				this.bbuStatusFactoryParams[n][i].valueStr = (Math.floor(res/10)).toString(10) + '.' + (res%10).toString(10);
			}
		}
		for (var i=0; i<this.C_BBUMVO2_UPGRADE_BYTES;i++) {
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.future_upgrade[i] = res;
		}
	}
	this.parseUInt16Pic = function(s) {
		var res = 0;
		var k = 1;
		var ind = 0;
		/* 2-byte unsigned integer LSB-first */
		for (var i=0; i < 2; i++) {
			res += parseInt(s.substring(ind,ind+2), 16)*k; ind+=2;
			k *= 256;
		}
		return res;
	}
	this.parseInt32Pic = function(s) {
		var res = 0;
		var k = 1;
		var ind = 0;
		/* 4-byte integer LSB-first */
		for (var i=0; i < 4; i++) {
			res += parseInt(s.substring(ind,ind+2), 16)*k; ind+=2;
			k *= 256;
		}
		return res;
	}
	this.parseFloatPic = function(s) {
		var res = this.parseInt32Pic(s);
		return this.pic32IntToFloat(res);
	}
	this.pic32IntToFloat = function(vint) {
		/* IEEE 754 */
		var s = 1;
		if (vint & 0x80000000) s = -1;			/* sign bit */
		var exp =  ((vint & 0x7F800000) >> 23); /* 8-bit exponent */
		var mant = (vint & 0x007FFFFF);         /* 23-bit mantisa */
		exp -= 127;
		if (exp>127) {
			exp = 127;
		} else if (exp < -126) {
			exp = -126
		}
		var E = Math.pow(2,exp);
		var M = mant*Math.pow(2, -23) + 1.0;
		var res = s*E*M;
		return res;
	}
	this.parseStringPic = function(s) {
		var res = "";
		for (var i = 0; i < s.length/2 ; i++) {
			var c = parseInt(s.substring(i*2,i*2+2), 16);
			if (c >= 0x20 && c < 0x7F) {
				res += String.fromCharCode(c);
			} else {
				res += ' ';
			}
		}
		return res;
	}
	this.parseRevision = function(s) {
		var res = 0;
		var k = 1;
		var ind = 0;
		/* 6-byte unsigned integer LSB-first, only 1st one is used actually */
		for (var ind=0; ind < s.length-1; ind+=2) {
			if (s.substring(ind,ind+2) == 'FF') break;
			res += parseInt(s.substring(ind,ind+2), 16)*k;
			k *= 256;
		}
		return res;
	}
}
function BasicMonitor(remoteNr){
	//only considered parameters for DAS Overview GUI
	this.Nr							= remoteNr;
	this.isRemote					= (this.Nr & 0xff)!=0;
	this.isExp						= !this.isRemote;
	this.nPorts						= this.isRemote ? 2 : 8;
	this.NR_OF_RELAYS_MAX			= 10;
	this.device_version_index		= 0;
	this.boardTemp					= 0;
	this.globalDetection			= [[false,false],[false,false]];//nb/adj band0/1
	this.blocked					= false;
	this.statePaOn					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.configAtt					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.configInputAgc				= [0,0]; //band 0/1
	this.rfBBLevel					= [[0,0],[0,0]]; //band 0/1 rx/tx
	this.gralAlarm					= []; //24 boolean/alarm
	this.bandAlarm					= []; //2band x 16boolean/alarm
	this.bbuAlarm 					= [];
	this.FOTxPow 					= []; 
	this.FORxPow  					= [];
	this.FOsfpAlarmMask 			= [];
	this.FOsfpTxFault 				= [];
	this.FOsfpRxLos 				= [];
	this.FOmoduleConnected			= [];
	this.FOActiveOpticalLink		= 0;
	this.FOgtpAlarmMask 			= [];
	this.FOgtpPLLUnlock 			= [];
	this.FOdataUnlock 				= [];
	this.FOdataUnsync 				= [];
	this.FOfrequencyUnsync 			= [];
	this.FOlossOpticalSignal 		= [];
	this.FOtransceiverAlarm 		= [];
	this.FOtransceiverWarning 		= [];
	this.FOerrors 					= [];
	this.bbu_serial_mode;
	this.bbu_type;
	this.bbuDeepDischarge;

	this.crcConf					= [0,0,0,0,0]; //4: 0-Gain/Power, 1-Filter Band 0, 2-Filter Band 1, 3-Squelch, 4-Alarm. Only used Filter in master
	
	for (var k=0;k<this.nPorts;k++){
		this.FOTxPow.push(0);
		this.FORxPow.push(0);
		this.FOsfpAlarmMask.push(0);
		this.FOsfpTxFault.push(false);
		this.FOsfpRxLos.push(false);
		this.FOmoduleConnected.push(false);
		this.FOgtpAlarmMask.push(0);
		this.FOgtpPLLUnlock.push(false);
		this.FOdataUnlock.push(false);
		this.FOdataUnsync.push(false);
		this.FOfrequencyUnsync.push(false);
		this.FOlossOpticalSignal.push(false);
		this.FOtransceiverAlarm.push(false);
		this.FOtransceiverWarning.push(false);
		this.FOerrors.push(0);
	}
	for (var k=0;k<24;k++) this.gralAlarm.push(false);
	for (var k=0;k<16;k++) this.bbuAlarm.push(false);
	for (var band=0;band<2;band++){
		this.bandAlarm.push([]);
		for (var k=0;k<16;k++){
			this.bandAlarm[band].push(false);
		}
	}

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

	this.parse = function(s){
		if (s.length<(this.isExp?statBasicExpLength:statBasicRemoteLength)){
			return -1;
		}
		var ind = 0;
		var res,res2;
		//GLOBAL
		this.device_version_index = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		if (this.isRemote) ind=4;
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		if (this.isRemote){
			//BAND
			for (var band=0;band<2;band++){
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.globalDetection[0][band] = (res & 0x4)!=0;
				this.globalDetection[1][band] = (res & 0x8)!=0;
				//PA ENABLED UL + BLOCKED
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.statePaOn[band][0] = (res & 0x80)!=0; 
				if ( band == 0 ) {
					this.blocked = (res & 0x1)!=0;
				}
				//PA ENABLED DL
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.statePaOn[band][1] = (res & 0x80)!=0; 
				//GAIN, POWER, EST. POWER DL
				this.configAtt[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
				this.configAtt[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
				this.configInputAgc[band] = res;
				for (var b=0;b<2;b++){
					this.rfBBLevel[band][b] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
				}
			}
			ind = 56;
		}else{
			ind = 18;
		}
		//GLOBAL ALARM STATUS
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<24;k++)
			this.gralAlarm[k] = (res & (1<<k))!=0;
		if (this.isRemote){
			//BAND ALARM STATUS
			for (var band=0;band<2;band++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var k=0;k<16;k++){
					this.bandAlarm[band][k] = (res & (1<<k))!=0;
				}
			}
		}
		//BBU ALARM STATUS
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++) {
			this.bbuAlarm[k] = (res & (1<<k))!=0;
		}
		//FIBER INFO
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<this.nPorts;k++) this.FOmoduleConnected[k] = (res & (1<<k))!=0;
		this.FOActiveOpticalLink = (res & 0x4)>>2;
		for (var k=0;k<this.nPorts;k++){
			this.FOTxPow[k] = 10 * Math.log(parseInt(s.substring(ind,ind+4),16) + 1e-9)/Math.LN10 - 40; ind+=4;
			this.FORxPow[k] = 10 * Math.log(parseInt(s.substring(ind,ind+4),16) + 1e-9)/Math.LN10 - 40; ind+=4;
			this.FOsfpAlarmMask[k] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.FOsfpTxFault[k] = !!(this.FOsfpAlarmMask[k] & this.FOsfpTxFaultMask);
			this.FOsfpRxLos[k] = !!(this.FOsfpAlarmMask[k] & this.FOsfpRxLosMask);
			this.FOgtpAlarmMask[k] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.FOgtpPLLUnlock[k] = !!(this.FOgtpAlarmMask[k] & this.FOgtpPLLUnlockMask);
			this.FOdataUnlock[k] = !!(this.FOgtpAlarmMask[k] & this.FOdataUnlockMask);
			this.FOdataUnsync[k] = !!(this.FOgtpAlarmMask[k] & this.FOdataUnsyncMask);
			this.FOfrequencyUnsync[k] = !!(this.FOgtpAlarmMask[k] & this.FOfrequencyUnsyncMask);
			this.FOlossOpticalSignal[k] = !!(this.FOgtpAlarmMask[k] & this.FOlossOpticalSignalMask);
			this.FOtransceiverAlarm[k] = !!(this.FOgtpAlarmMask[k] & this.FOtransceiverAlarmMask);
			this.FOtransceiverWarning[k] = !!(this.FOgtpAlarmMask[k] & this.FOtransceiverWarningMask);
			this.FOtransceiverAlarm[k] = this.FOtransceiverAlarm[k] || this.FOsfpTxFault[k]; //adding FOsfpTxFault to FOtransceiverAlarm
			this.FOtransceiverAlarm[k] = this.FOtransceiverAlarm[k] || this.FOgtpPLLUnlock[k]; //adding FOgtpPLLUnlock to FOtransceiverAlarm
			this.FOerrors[k] = parseInt(s.substring(ind,ind+4),16); ind+=4;
		}
		//BBU
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbuDeepDischarge = (res & 0x80) != 0;
		this.bbu_serial_mode = (res & 0x01);
		this.bbu_type = ((res >> 1) & 0x07);
		//CRC
		if (this.isRemote){
			for (i=0;i<5;i++){ this.crcConf[i] = parseInt(s.substring(ind,ind+8),16);ind+=8;}
		}else{
			this.crcConf[4] = parseInt(s.substring(ind,ind+8),16);ind+=8; //expansion only CRC alarm
		}
	}
	this.getBbuSerialMode = function() {
		var isSerialMode = this.bbu_serial_mode!=0;
		if (this.isRemote && this.device_version_index==0) isSerialMode = false; //remotes < BBUMVO2 only dry contact mode
		return isSerialMode;
	}
	this.isBbuDisconnectionAlarm = function() {
		if (!this.getBbuSerialMode()) {
			return false;
		}
		return this.bbuAlarm[4];
	}
	this.getNrOfRelaysSupported = function() {
		if (!this.getBbuSerialMode()) return (!this.isRemote? 7: 4);
		if (this.bbu_type == 0) {
			return (!this.isRemote? 7: 4);	// bbu_type == 0 ---> MMS only, do as if dry contacts mode
		} else if (this.bbu_type == 1) {
			return 10; 	// BBU MVO.2 standard
		} else if (this.bbu_type == 2) {
			return 9; 	// BBU MVO.2 high power
		} else {
			return (!this.isRemote? 7: 4);	// default
		}
	}
}
function fiberInfo(nr){
	this.isMaster				= (nr == 0);
	this.isExp					= ((nr & 0xff) == 0) && !this.isMaster;
	this.isRemote				= (nr != 0) && !this.isExp;
	this.FrameLength 			= this.isMaster ? 74 : this.isRemote ? 58 : 228;
	this.nPorts					= this.isRemote ? 2 : 8; 
	this.FOmoduleConnected		= []; //master/remote
	this.FORemotesOpticalPort	= []; //master
	this.FOlossCommunication 	= [];
	this.FOActiveOpticalLink 	= false; //remote
	this.FOSecondPortLicense 	= false; //remote
	this.isExpansionPort		= []; //master
	this.linkActive				= []; //master
	
	this.parse = function(s){
		this.FOmoduleConnected		= []; //to restart FOModuleConnected identification
		if (s.length<this.FrameLength) return -1;
		var ind = 0;
		var res,mask;
		var k,n;
		var portsExp = 7;
		if (this.isMaster){
			this.FOmoduleConnected[0] = true; //true for index=0, this array is used to check device unit presence (master is always present)
			//EXPANSION IDENTIFICATION
			res = parseInt(s.substring(2,4), 16);
			for (k = 0, mask = 1; k < this.nPorts; k++, mask <<= 1) {
				this.isExpansionPort[k] = !!(res & mask);
			}
			//SFP DETECTION ON 8 MASTER LOCAL PORTS
			res = parseInt(s.substring(0,2), 16);
			for (k = 1, mask = 1; k <=this.nPorts; k++, mask <<= 1) {
				var index = k;
				if (this.isExpansionPort[k-1]) index = k<<8;
				this.FOmoduleConnected[index] = !!(res & mask); //this vector starts in 1 for remotes
			}
			ind=4;
			//CONNECTION TO REMOTE PORT (1/2) ON 8 DIRECT REMOTES
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (k = 1, mask = 1; k <= this.nPorts; k++, mask <<= 1) {
				this.FORemotesOpticalPort[k] = !!(res & mask)?1:0;
			}
			//LINK STATUS ON 8 MASTER LOCAL PORTS
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (k = 1, mask = 1; k <= this.nPorts; k++, mask <<= 1) {
				var index = k;
				if (this.isExpansionPort[k-1])
					index = k<<8;
				else
					this.FOlossCommunication[k<<8] = 1; //loss comm Expansion forced to yes, if it is not an exp
				this.FOlossCommunication[index] = !!(res & mask)?1:0;
			}
			//LINK ACTIVE ON 8 DIRECT REMOTES
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (k = 0, mask = 1; k < this.nPorts; k++, mask <<= 1) {
				this.linkActive[k] = !!(res & mask);
			}
			//SFP DETECTION FOR EACH EXPANSION, 
			for (n = 1; n <= this.nPorts; n++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (k = 0, mask = 1; k < portsExp; k++, mask <<= 1) {
					this.FOmoduleConnected[(n<<8)|(k+1)] = !!(res & mask);
				}
			}
			//CONNECTION TO REMOTE PORT (1/2) FOR REMOTES CONNECTED TO EACH EXPANSION, 
			for (n = 1; n <= this.nPorts; n++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (k = 0, mask = 1; k < this.nPorts; k++, mask <<= 1) {
					this.FORemotesOpticalPort[(n<<8)|(k+1)] = !!(res & mask)?1:0;
				}
			}
			//LINK STATUS FOR REMOTES CONNECTED TO EACH EXPANSION, 
			for (n = 1; n <= this.nPorts; n++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (k = 0, mask = 1; k < this.nPorts; k++, mask <<= 1) {
					this.FOlossCommunication[(n<<8)|(k+1)] = !!(res & mask)?1:0;
					if (this.isExpansionPort[n-1] && this.FOlossCommunication[n<<8]) this.FOlossCommunication[(n<<8)|(k+1)]=1;
					if (!this.isExpansionPort[n-1]) this.FOlossCommunication[(n<<8)|(k+1)]=1;
				}
			}
			//LINK ACTIVE FOR REMOTES CONNECTED TO EACH EXPANSION
			for (n = 1; n <= this.nPorts; n++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (k = 0, mask = 1; k < this.nPorts; k++, mask <<= 1) {
					this.linkActive[(n<<8)|(k+1)] = !!(res & mask);
				}
			}
		}else{
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (k = 1, mask = 1; k <= this.nPorts; k++, mask <<= 1) {
				this.FOmoduleConnected[k] = !!(res & mask); //this vector starts in 1
			}
			if (this.isExp){
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (k = 0, mask = 1; k < this.nPorts; k++, mask <<= 1) {
					this.FORemotesOpticalPort[k] = !!(res & mask)?1:0;
				}
			}
			if (this.isRemote){
				this.FOActiveOpticalLink = (res & mask) ? 1 : 0;
				this.FOSecondPortLicense = (res & 0x8)!=0;
			}
			ind = this.isExp?26:24;
			for (k = 0; k < this.nPorts; k++) {
				res = parseInt(s.substring(ind+28*k,ind+2+28*k), 16);
				this.FOlossCommunication[k+1] = (res & 0x20)!=0; //this vector starts in 1
			}
		}
	}
}