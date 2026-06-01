function Monitor() {
	this.FrameLength	 			= 778;
	this.NR_OF_RELAYS_MAX			= 10;
	this.NrOfPorts 					= 8;
	this.blocked					= false;
	this.boardTemp					= 0;
	this.boardCurrent				= 0;
	this.bbAgc						= [0,0]; //band 0/1
	this.relayONOFF					= []; // 7 boolean/relay
	this.relayOpenClosed			= []; // 7 boolean/relay
	this.gralAlarm					= []; //24 boolean/alarm
	this.delayTimerRunning			= []; // 7 boolean/relay
	this.delayTimer					= []; // 7 int/relay
	this.latchTimerRunning			= []; // 7 boolean/relay
	this.latchTimer					= []; // 7 int/relay	
	this.isZeros = false;
	this.FORemotesOpticalPort		= []; // 8 alarmas de fibra, previsión das centric
	
	this.bbuDeepDischarge;
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

	this.FOmoduleConnected = [];
	this.FOTemperature = [];
	this.FOVolt = [];
	this.FOBias = [];
	this.FOTxPow = [];
	this.FORxPow = [];
	this.FOsfpAlarmMask = [];
	this.FOgtpAlarmMask = [];
	this.FOerrors = [];
	this.FOlossOpticalSignal = [];
	this.FOlossCommunication = [];
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
	
	this.adTempSense			= 0;
	this.adBoardCurr			= 0;
	
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

	this.device_version_index		= 0;
	
	this.frm						= "";
	
	for (var k=0;k<7;k++){
		this.relayONOFF.push(false);
		this.relayOpenClosed.push(false);
		this.delayTimerRunning.push(false);
		this.latchTimerRunning.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}
	for (var k=0;k<24;k++)
		this.gralAlarm.push(false);
	
	for (var k=0;k<this.NrOfPorts;k++) {
		this.FORemotesOpticalPort.push(0);
		this.FOmoduleConnected.push(false);
		this.FOTemperature.push(0);
		this.FOVolt.push(0);
		this.FOBias.push(0);
		this.FOTxPow.push(0);
		this.FORxPow.push(0);
		this.FOsfpAlarmMask.push(0);
		this.FOgtpAlarmMask.push(0);
		this.FOerrors.push(0);
		this.FOlossOpticalSignal.push(false);
		this.FOlossCommunication.push(false);
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
		if ( this.checkIsZeros(statusResponse) ) {
			this.isZeros = true;
			return;
		}
		this.isZeros = false;

		var s = statusResponse;
		if (s.length<this.FrameLength) return -1; 
		var res,res2;
		var ind = 0;
		this.frm = s;

		this.device_version_index = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		//GLOBAL
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		this.boardCurrent = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
		//BAND0
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.blocked = (res & 0x1)!=0;
		this.bbAgc[0] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
		//BAND1
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbAgc[1] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4;
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
		//BBU ALARM STATUS
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++) {
			this.bbuAlarm[k] = (res & (1<<k))!=0;
		}
		// FO
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k = 0, mask = 1; k < this.NrOfPorts; k++, mask <<= 1) {
			this.FOmoduleConnected[k] = !!(res & mask);
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k = 0, mask = 1; k < this.NrOfPorts; k++, mask <<= 1) {
			this.FORemotesOpticalPort[k] = !!(res & mask)?1:0;
		}
		//FIBER INFO
		for (var k = 0; k < this.NrOfPorts; k++) {
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
		this.adTempSense = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.adBoardCurr = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		//BBU factory parameters
		this.parseFactoryStatusDataMvo2(s.substring(ind,ind+274), this.bbu_type);ind+=274;

	}
	this.getBbuSerialMode = function() {
		return (this.bbu_serial_mode!=0);
	}
	this.getBbuType = function() {
		return (this.bbu_type);
	}
	this.getNrOfRelaysSupported = function() {
		if (!this.getBbuSerialMode()) return 7;
		if (this.bbu_type == 0) {
			return 7;	// bbu_type == 0 ---> MMS only, do as if dry contacts mode
		} else if (this.bbu_type == 1) {
			return 10; 	// BBU MVO.2 standard
		} else if (this.bbu_type == 2) {
			return 9; 	// BBU MVO.2 high power
		} else {
			return 7;	// default
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