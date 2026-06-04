function Monitor() {
	this.NR_OF_RELAYS_MAX			= 10;
	this.CHNR 						= 64;
	this.ADJNR 						= 4;
	
	this.blocked					= false;
	this.extremeTempActionOn		= false;
	this.ulBandPAIndependent		= true;
	this.chBandEnabled				= [true,true]; //activación sección NB band0/1
	this.adjBandEnabled				= [true,true]; //activación sección ADJ band0/1
	this.boardTemp					= 0;
	this.boardCurrent 				= 0;
	this.ulGlobalDetection			= [[false,false],[false,false]]; //nb/adj band 0/1
	this.isolMeasRunning			= [false,false]; //band 0/1
	this.configAtt					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.configInputAgc				= [0,0]; //band 0/1
	this.signalDet					= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.oscDetectCH				= []; // nb/adj band0/1 nfilter [2][2][32]
	this.cnDet						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.maxAllowGain				= [0,0]; //band 0/1
	this.retryTime					= [0,0]; //band 0/1
	this.inputAgc					= [0,0]; //band 0/1, old bbAGC renamed for clarity
	this.bbAgc						= [[0,0],[0,0]]; //band 0/1 ul/dl, now is digital broad AGC
	this.level						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.gain						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.statePaOn					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.estTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.paCurrent					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.relayONOFF					= []; // NR_OF_RELAYS_MAX boolean/relay
	this.relayOpenClosed			= []; // NR_OF_RELAYS_MAX boolean/relay
	this.gralAlarm					= []; //24 boolean/alarm
	this.bandAlarm					= []; //2band x 16boolean/alarm
	this.delayTimerRunning			= []; // NR_OF_RELAYS_MAX boolean/relay
	this.delayTimer					= []; // NR_OF_RELAYS_MAX int/relay
	this.latchTimerRunning			= []; // NR_OF_RELAYS_MAX boolean/relay
	this.latchTimer					= []; // NR_OF_RELAYS_MAX int/relay	
	this.isZeros = false;
	
	this.powDirect					= [0,0];// 2 --> 1double/band
	this.powReverse					= [0,0];// 2 --> 1double/band
	this.retLoss					= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeHigh		= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeLow		= [0,0];// 2 --> 1double/band
	this.adPowDirect				= [0,0];// 2 --> 1double/band
	this.adPowReverse				= [0,0];// 2 --> 1double/band
	this.adDlPaCurr					= [0,0];// 2 --> 1double/band
	this.adTempSense				= 0;
	this.bbLevel = [-128, -128];

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
	this.FOSecondPortLicense = false;
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
	this.priorityLinkTimer2sec = 0;	// link priority timer in 2-second units
	this.PriorityLinkTimerFeatureAvailable = false;
	this.FOPriorityLinkTimerLSbit = 0;	// least significant bit of link priority timer
	this.FOPriorityLinkTimerRunning = 0;	// status of link priority timer (running or not)s
	
	this.bbuAlarm					= [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]; //16 boolean/alarm
	this.bbuDeepDischarge;
	this.bbu_serial_mode;
	this.bbu_type;
	this.bbuChargerTemperature;
	this.bbuBatteryTemperature;
	this.bbuIndividualBatteryVoltage;
	this.bbuBatteryStatusVoltage = [0,0];
	this.bbuSystemVoltage;
	this.bbuBatteryVoltageBank; //Power Supply Voltage
	this.bbuMainCurrent;
	this.bbuBatteryCurrent;
	this.bbuBuzzerStatus;
	this.bbuBuzzerMuteTime;
	this.bbuBuzzerRemainingTime;
	this.bbuChargerErrorCode;
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
	
	this.plaMeas					= [0,0];// 2 PLA meas
	this.plaElapsedTime				= 0;
	
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
			for (var ch=0;ch<this.CHNR;ch++){
				this.oscDetectCH[nbadj][band].push(false);
				this.cnDet[nbadj][band].push(false);
			}
			for (var uldl=0;uldl<2;uldl++){
				this.signalDet[nbadj][band].push([]);	
				this.level[nbadj][band].push([]);
				this.gain[nbadj][band].push([]);
				for (var ch=0;ch<this.CHNR;ch++){
					this.signalDet[nbadj][band][uldl].push(false);
					this.level[nbadj][band][uldl].push(0);
					this.gain[nbadj][band][uldl].push(0);
				}
			}
		}
	}
	for (var i=0;i<2;i++) {
		this.bandAlarm.push([]);
		for (var k=0;k<16;k++){
			this.bandAlarm[i].push(false);
		}
	}
	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
		this.relayONOFF.push(false);
		this.relayOpenClosed.push(false);
		this.delayTimerRunning.push(false);
		this.latchTimerRunning.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}
	for (var k=0;k<24;k++)
		this.gralAlarm.push(false);

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

	this.parse = function(s) {
		if ( this.checkIsZeros(s) ) {
			this.isZeros = true;
			return;
		}
		var statusLengthFlex2_0 = 1964;
		var statusLength = s.length;
		this.isZeros = false;
		if (statusLength<statusLengthFlex2_0) return -1; 
		var res,res2;
		var ind = 2; //to ignore device_version_index
		this.frm = s;
		//GLOBAL
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.ulBandPAIndependent = (res & 0x4)!=0;
		this.chBandEnabled[0] = (res & 0x10)!=0;
		this.adjBandEnabled[0] = (res & 0x20)!=0;
		this.chBandEnabled[1] = (res & 0x40)!=0;
		this.adjBandEnabled[1] = (res & 0x80)!=0;
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		this.boardCurrent = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
		this.retryTime[0] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		//BAND
		for (var band=0;band<2;band++){
			//GENERAL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.ulGlobalDetection[0][band] = (res & 0x4)!=0;
			this.ulGlobalDetection[1][band] = (res & 0x8)!=0;
			if (band == 0) {
				this.isolMeasRunning[band] = (res & 0x40)!=0;
				this.extremeTempActionOn = (res & 0x80) != 0;
			}
			//PA ENABLED UL + BLOCKED
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.statePaOn[band][0] = (res & 0x80)!=0; 
			if ( band == 0 ) {
				this.blocked = (res & 0x1)!=0;
			}
			//PA ENABLED DL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.statePaOn[band][1] = (res & 0x80)!=0; 
			//GAIN, POWER, MAX ALLOW GAIN
			this.configAtt[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.configAtt[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
			this.configInputAgc[band] = res;
			this.maxAllowGain[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			//SIGNAL DETECTION NB
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR/2;ch++) this.signalDet[0][band][0][ch] = (res & (1<<ch))!=0; //nb (1-32)
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR/2;ch++) this.signalDet[0][band][0][ch+this.CHNR/2] = (res & (1<<ch))!=0; //nb (33-64)
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
			//SIGNAL AND OSCILLATION DETECTION ADJ
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++) this.signalDet[1][band][0][ch] = (res & (1<<ch))!=0;//adj
			for (var ch=0;ch<this.ADJNR;ch++) this.oscDetectCH[1][band][ch] = (res & (1<<(ch+4)))!=0;//adj
			//CN UL LOW DETECTION ADJ
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++) this.cnDet[1][band][ch] = (res & (1<<ch))!=0;//adj
			//UL INPUT AGC
			this.inputAgc[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			//DL PA CURRENT, RFOUT, FWD/REV POWER
			this.paCurrent[band][1] = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
			this.estTxPow[band][1] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
			this.powDirect[band] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
			this.powReverse[band] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
			this.retLoss[band] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
			//DIGITAL BB AGCs
			this.bbAgc[band][0] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //ul
			this.bbAgc[band][1] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //dl
			//LEVEL/AGC NB CH 1-64
			for (var ch=0;ch<this.CHNR;ch++){
				this.level[0][band][0][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
				this.gain[0][band][0][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
			}
			//LEVEL/AGC ADJ CH 1-4
			for (var ch=0;ch<this.ADJNR;ch++){
				this.level[1][band][0][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
				this.gain[1][band][0][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
			}
		}
		//LEVEL IN UL min/max - AUTO UL GAIN & SQUELCH FUNCTION: DISAPPEARS 42UNUSED CHARS
		// First 2 bytes are used for MSB for Priority-Link Timer.
		this.priorityLinkTimer2sec = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		ind+=(42-4);
		//PATH LOSS ANALYZER
		for (var i=0; i<2; i++) {
			this.plaMeas[i] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
		}
		this.plaElapsedTime = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		
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
		//BAND ALARM STATUS
		for (var band=0;band<2;band++) {
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<16;k++){
				this.bandAlarm[band][k] = (res & (1<<k))!=0;
			}
		}
		//BBU ALARM STATUS
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++) {
			this.bbuAlarm[k] = (res & (1<<k))!=0;
		}
		// FO
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k = 0, mask = 1; k < 2; k++, mask <<= 1) {
			this.FOmoduleConnected[k] = !!(res & mask);
		}
		this.FOActiveOpticalLink = (res & mask) ? 1 : 0;	// only remote
		this.FOSecondPortLicense = (res & 0x8)!=0;	// only remote
		this.PriorityLinkTimerFeatureAvailable = (res & 0x20) != 0; // only remote
		this.FOPriorityLinkTimerLSbit = ((res & 0x40) == 0x40? 1 : 0);	// least significant bit of link priority timer
		this.FOPriorityLinkTimerRunning = ((res & 0x80) == 0x80? 1 : 0);	// status of link priority timer (running or not)
		//FIBER INFO
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
		//A/D Detectors
		for (var b=0; b<2; b++) {
			this.adPowDirect[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.adPowReverse[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.adDlPaCurr[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		}
		this.adTempSense = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		//BBU factory parameters
		this.parseFactoryStatusDataMvo2(s.substring(ind,ind+274), this.bbu_type);
	}
	this.getBbuSerialMode = function() {
		return (this.bbu_serial_mode!=0);
	}
	this.getBbuType = function() {
		return (this.bbu_type);
	}
	this.getNrOfRelaysSupported = function() {
		if (!this.getBbuSerialMode()) return (4);
		if (this.bbu_type == 0) {
			return (4);	// bbu_type == 0 ---> MMS only, do as if dry contacts mode
		} else if (this.bbu_type == 1) {
			return 10; 	// BBU MVO.2 standard
		} else if (this.bbu_type == 2) {
			return 9; 	// BBU MVO.2 high power
		} else {
			return (4);	// default
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
	this.FOSwitchTimerStatGet = function(){
		return (this.priorityLinkTimer2sec*2 + this.FOPriorityLinkTimerLSbit);
	}
	this.FOSwitchTimerStatIsRunning = function(){
		return this.FOPriorityLinkTimerRunning;
	}
	this.PriorityLinkTimerFeatureIsAvailable = function(){
		return this.PriorityLinkTimerFeatureAvailable;
	}
}
