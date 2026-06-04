var NrOfGralSystemAlarms = 3;

function Config(remoteNr) {
	this.NR_OF_RELAYS_MAX			= 10
	this.CHNR 						= 64;
	this.ADJNR 						= 4;
	
	this.Nr							= remoteNr;
	
	this.isMaster					= this.Nr == 0;
	this.isExp						= ((this.Nr & 0xff) == 0) && !this.isMaster;
	this.isRemote					= this.Nr != 0 && !this.isExp;
	
	this.resetSoft					= false;
	this.uldlLinkedFreq				= [false,false];
	this.numberOfFilterNonGrouped	= [[0,0],[0,0]];
	
	this.gainIsolMargin				= [20,20];
	this.runIsolationMeas			= [false,false];
	this.oscTimeThSeconds			= [0,0];
	this.oscRetryTimeHours			= [0,0];
	this.oscActionAfterAlarm		= [0,0];
	this.clearOscAlarm				= [false,false];
	this.allSameSquelch				= [false,false]; //band0/1 [2]
	
	this.firstADJisFirstNet			= false;
	
	this.allChSameBW				= []; //band0/1 ul/dl[2][2]
	this.paEnabled					= []; //band0/1 ul/dl [2][2]
	
	this.sqChEnabled				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][32] en UL NB se utiliza CH0 para el que aplica a todos los filtros
	this.sqChThreshold				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][32] en UL NB se utiliza CH0 para el que aplica a todos los filtros
	
	this.att						= []; //band0/1 ul/dl [2][2]
	this.inputAgc					= []; //band0/1 ul/dl [2][2]
	
	this.filterEnabled				= []; // nb/adj ul/dl band0/1 ul/dl nfilter [2][2][2][32]
	this.isFilterGrouped			= []; // band0/1 ul/dl nfilter [2][2][32]
	this.bwIndex					= []; // band0/1 ul/dl nfilter [2][2][32]
	this.bwKHz						= []; // band0/1 ul/dl nfilter [2][2][32]
	this.freqHz						= []; // band0/1 ul/dl nfilter [2][2][32]
	this.fineGainFilter				= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	
	this.fstartHzAdjFilter			= []; // band0/1 ul/dl nfilter [2][2][4]
	this.fstopHzAdjFilter			= []; // band0/1 ul/dl nfilter [2][2][4]
	
	this.delayTimerON				= []; // 7 --> 1boolean/relay ---
	this.latchTimerON				= []; // 7 --> 1boolean/relay ---
	this.delayTimer					= []; // 7 --> 1int/relay ---
	this.latchTimer					= []; // 7 --> 1int/relay ---	
	
	this.autoUlPaOffTimer			= 0;
	this.extremeTempAction 			= 0;
	this.forcePaOn					= []; //band0/1 ul/dl [2][2]
	this.forcePaOff					= []; //band0/1 ul/dl [2][2]	
	this.controlChannel 			= [];
	this.masterMode					= 0;
	this.masterModeAlarmEnables		= []; //13enables
	
	this.runDelayMeasuarement		= false;
	this.forceSystemAlarm 			= [false, false, false];

	this.device_version_index = 0;

	this.bbu_serial_mode = false;
	this.bbu_type;
	this.bbu_dismiss_deep_discharge;
	this.system_force_rf_off;	// only for Master
	
	this.retLossTh				= [0,0];
	this.minPowerVSWR			= [0,0];
	this.alarmNumSens			= [0,0];
	this.timeTxLowPowHigh		= [0,0];
	this.timeTxLowPowLow		= [0,0];
	this.antennaDisconnectionThreshold = [0,0];
	this.relayLogicConfigNormal	= []; // 7 --> 1boolean/relay ---
	this.globalAlarmsEnabled	= []; //24 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //24 --> 1boolean/alarm ---
	this.bandAlarmsEnabled		= []; //2x16 --> 1boolean/alarm ---
	this.bandAlarmsInstalled	= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsInstalled		= []; //16 --> 1boolean/alarm ---
	this.relayAssignGlobalAlarm	= []; //16 alarm x 7 --> 1boolean/relay ---
	this.relayAssignBandAlarm	= []; //8 alarm x 7 --> 1boolean/relay ---
	this.relayAssignBbuAlarm	= []; //16 alarm x 8 --> 1boolean/relay ---
	this.alarmNames				= [["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","Path Loss 1","Path Loss 2","Fiber Optic 1","Fiber Optic 2",
								    "External Input 1","External Input 2","External Input 3","Force RF OFF",
									"General System Alarm 1","General System Alarm 2","General System Alarm 3","Undefined"],
								   ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","Rx Power Low","DL AGC Fail","DL Output Power","UL PA Fail","Antenna Disconnection",
								    "C/N UL Low","","","","",""]];
	this.alarmNamesBbu =
    ["Normal AC Power","Loss Normal AC Power","Battery Capacity < 30%","Battery Charger Fail","BBU Comm. Error","Charger Temperature","Battery Temperature","Individual Batt. Voltage",
     "Battery Disconnection","System Voltage","Battery Bank Voltage","Battery Deep Discharge","Annunciator 1","Annunciator 2","Annunciator 3","Annunciator 4"];
	this.externalAlarmPolarity 	= [];
	this.buzzerMuteCommand = 0;
	this.relayAssignPolicy = 0;
	this.buzzerMuteTime = 0;
	
	this.generalSystemAlarm 	= [[[],[],[]], [[],[],[]], [[],[],[]],]; // 2 global,band,bbu
	

	//Extra features for flex2.0 remotes (coming from DH7S improvements)
	this.agcBandMode = [0,0]; //band0/1
	this.cnAlarmTime = 0;
	this.cn_threshold_nb = [0,0];	// band0/1 [2]
	this.cn_threshold_adj = [[0,0,0,0],[0,0,0,0]];	// band0/1 nfilter [2][4]
	this.base_station_power = [];	//BAND0, BAND1, BAND14(only for 700/800)
	this.base_station_sensitivity = [];	//BAND0, BAND1, BAND14(only for 700/800)
	//Extra features for flex2.0: path loss analyzer
	this.fstartHzPlaFilter = 0;
	this.fstopHzPlaFilter = 0;
	this.plaEn = false;
	this.plaMeasPeriod = 0;
	this.forcePlaMeas = false;
	
	this.limitCnAlarmTime = {MIN: 10, MAX: 2400};
	this.CNLimitdBm = {MIN: -120, MAX: -40};
	
	for (var band=0;band<3;band++){
		this.base_station_power.push(0);
		this.base_station_sensitivity.push(0);
	}
	for (var k=0;k<24;k++){
		this.globalAlarmsEnabled.push(false);
		this.globalAlarmsInstalled.push(false);
		this.relayAssignGlobalAlarm.push([]);
		for (var j=0;j<this.NR_OF_RELAYS_MAX;j++) this.relayAssignGlobalAlarm[k].push(false);
		for (var i=0; i < NrOfGralSystemAlarms; i++ ) {
			this.generalSystemAlarm[i][0].push(false);
		}
	}
	for (var k = 0; k < 4; k++) {
		this.externalAlarmPolarity.push(false);
	}
	//bandAlarmsEnabled matrix 2x16, 2 arrays per band
	for (var b=0;b<2;b++){
		this.bandAlarmsEnabled.push([]);
		for (var k=0;k<16;k++) this.bandAlarmsEnabled[b].push(false);
	}
	//bandAlarmsInstalled unified array size 16
	for (var k=0;k<16;k++){
		this.bandAlarmsInstalled.push(false);
		for (var i=0; i < NrOfGralSystemAlarms; i++ ) {
			this.generalSystemAlarm[i][1].push(false);
		}
	}
	//relayAssignBandAlarm matriz única de 16x7
	for (var k=0;k<16;k++){
		this.relayAssignBandAlarm.push([]);
		for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
			this.relayAssignBandAlarm[k].push(false);
		}
	}
	for (var k=0;k<16;k++){
		this.bbuAlarmsEnabled.push(false);
		this.bbuAlarmsInstalled.push(false);
		for (var i=0; i < NrOfGralSystemAlarms; i++ ) {
			this.generalSystemAlarm[i][2].push(false);
		}
	}
	for (var k=0;k<16;k++){
		this.relayAssignBbuAlarm.push([]);
		for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
			this.relayAssignBbuAlarm[k].push(false);
		}
	}
	this.alarmThrshItems = (this.isRemote ? 7 : 9);
	this.alarmThrshData = [];
	for ( var i = 0; i < this.alarmThrshItems; i++ ) {
		this.alarmThrshData.push({ valueThr: 0, hysteresis: 0});
	}
	this.alarmThrshOrder = [
		{
			RX_POWER_FIBER_1: 0,
			RX_POWER_FIBER_2: 1,
			RX_POWER_FIBER_3: 2,
			RX_POWER_FIBER_4: 3,
			RX_POWER_FIBER_5: 4,
			RX_POWER_FIBER_6: 5,
			RX_POWER_FIBER_7: 6,
			RX_POWER_FIBER_8: 7,
			TEMPERATURE: 8
		}
		,{
			RX_POWER_FIBER_1: 0,
			RX_POWER_FIBER_2: 1,
			TEMPERATURE: 2,
			TX_POWER_LOW_B0: 3,
			TX_POWER_LOW_B1: 4,
			PATH_LOSS1: 5,
			PATH_LOSS2: 6
		}
	];
	this.alarmThrshLimits = [
		[
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: 0, max: 85}
		],
		[
			{min: -30, max: 0},
			{min: -30, max: 0},
			{min: 0, max: 85},
			{min: -10, max: 37},
			{min: -10, max: 37},
			{min: -90, max: 0},
			{min: -90, max: 0}
		]
	];
	this.alrmThrshHystLimits = {min: 0, max: 10};

	this.setDefaultRelayAssign = function(mode,ndev){ //mode = 0 - dry contacts / 1 - serial
		this.clearRelayAssign();
		this.clearRelayLogic();
		var isMaster = ndev==0;
		var isExp = ((ndev&0xff)==0) && !isMaster;
		var isRemote = (ndev>0) && !isExp;

		var dryc = (mode==0);
		//BBU ALARMS
		//relay 1/not assigned(for master dry contact): normal AC power
		this.relayAssignBbuAlarm[0][0] = !dryc;
		//relay 2/not assigned(for master dry contact): loss normal AC power
		this.relayAssignBbuAlarm[1][1] = !dryc;
		//relay 3/not assigned(for master dry contact): batt capacity and batt disconnection
		var alr = [2,8];
		for (var k=0;k<alr.length;k++) this.relayAssignBbuAlarm[alr[k]][2] = !dryc;
		//relay 4/not assigned(for master dry contact): batt charger fail
		this.relayAssignBbuAlarm[3][3] = !dryc;
		//relay 8/not assigned(for master dry contact): bbu comm error, charger/batt temp, individual batt voltage, system voltage, batt bank voltage, batt deep discharge, annunciators
		var alr = [4,5,6,7,9,10,11,12,13,14,15];
		for (var k=0;k<alr.length;k++) this.relayAssignBbuAlarm[alr[k]][7] = !dryc;
		//GENERAL AND BAND ALARMS
		if (mode==1){
			//relay 7: hw fail, high temp
			var alr = [0,1];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][6] = true;
			if (!isExp){
				//relay 7: overload UL, DL PA Fail, tx power low, VSWR, DL AGC Fail
				var alr = [0,2,3,4,6];
				for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][6] = true;
				//relay 7: osc detection, fiber optic 1, fiber optic 2
				var alr = [3,6,7];
				for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][6] = true;
			}
			if (isMaster){
				//relay 5: ant disconnection
				this.relayAssignBandAlarm[9][4] = true;
				//relay 6: rx power low
				this.relayAssignBandAlarm[5][5] = true;
				//relay 7: overload DL, UL PA Fail
				var alr = [1,8];
				for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][6] = true;
				this.enableAllBBUAlarms(); //if master, all BBU are enabled while relay default settings are applied
			}
			if (!isRemote){
				//relay 7: fiber alarms
				var alr = [16,17,18,19,20,21,22,23];
				for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][6] = true;
			}
		}else{
			//relay 4: hw fail, high temp
			var alr = [0,1];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;
			if (!isExp){
				//relay 2: VSWR
				this.relayAssignBandAlarm[4][1] = true;
				//relay 4: overload UL, DL PA Fail, tx power low, DL AGC Fail
				var alr = [0,2,3,6];
				for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][3] = true;
				//relay 4: osc detection, fiber optic 1, fiber optic 2
				var alr = [3,6,7];
				for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;
			}
			if (isMaster){
				//relay 1: rx power low
				this.relayAssignBandAlarm[5][0] = true;
				//relay 3: ant disconnection
				this.relayAssignBandAlarm[9][2] = true;
				//relay 4: overload DL, UL PA Fail
				var alr = [1,8];
				for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][3] = true;
			}
			if (!isRemote){
				//relay 4: fiber alarms
				var alr = [16,17,18,19,20,21,22,23];
				for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;
			}
		}
	}
	this.enableAllBBUAlarms = function(){
		for (var i=0;i<this.bbuAlarmsEnabled.length;i++){
			this.bbuAlarmsEnabled[i] = true;
		}
	}
	this.clearRelayAssign = function(){
		for (var i=0;i<this.relayAssignGlobalAlarm.length;i++){
			for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
				this.relayAssignGlobalAlarm[i][j] = false;
			}
		}//4 LSBits of relayAssignGlobalAlarm[15] byte  is being used for gen sys alarm assign to external inputs
			for (var i=0;i<this.relayAssignBandAlarm.length;i++){
				for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
					this.relayAssignBandAlarm[i][j] = false;
				}
			}
		for (var i=0;i<this.relayAssignBbuAlarm.length;i++){
			for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
				this.relayAssignBbuAlarm[i][j] = false;
			}
		}
	}
	this.clearRelayLogic = function(){
		for (var i=0;i<this.relayLogicConfigNormal.length;i++){
			this.relayLogicConfigNormal[i]= false;
		}
	}
	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
		this.relayLogicConfigNormal.push(true);
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}	
	for (var k=0;k<16;k++)
		this.masterModeAlarmEnables.push(false);
		
	for (var nbadj=0;nbadj<2;nbadj++){
		this.filterEnabled.push([]);
		this.fineGainFilter.push([]);
		this.sqChEnabled.push([]);
		this.sqChThreshold.push([]);
		for (var band=0;band<2;band++){
			this.filterEnabled[nbadj].push([]);
			this.fineGainFilter[nbadj].push([]);
			this.sqChEnabled[nbadj].push([]);
			this.sqChThreshold[nbadj].push([]);			
			for (var uldl=0;uldl<2;uldl++){
				this.filterEnabled[nbadj][band].push([]);
				this.fineGainFilter[nbadj][band].push([]);
				this.sqChEnabled[nbadj][band].push([]);
				this.sqChThreshold[nbadj][band].push([]);					
				for (var ch=0;ch<this.CHNR;ch++){
					this.filterEnabled[nbadj][band][uldl].push(false);
					this.fineGainFilter[nbadj][band][uldl].push(0);
					this.sqChEnabled[nbadj][band][uldl].push(false);
					this.sqChThreshold[nbadj][band][uldl].push(0);					
				}
			}
		}
	}
	
	for (var band=0;band<2;band++){
		this.allChSameBW.push([]);			
		this.paEnabled.push([]);
		this.forcePaOn.push([]);
		this.forcePaOff.push([]);
		this.att.push([]);					
		this.inputAgc.push([]);					
		this.isFilterGrouped.push([]);		
		this.bwIndex.push([]);					
		this.bwKHz.push([]);					
		this.freqHz.push([]);				
		this.fstartHzAdjFilter.push([]);		
		this.fstopHzAdjFilter.push([]);		
		for (var uldl=0;uldl<2;uldl++){
			this.allChSameBW[band].push(false);			
			this.paEnabled[band].push(false);
			this.forcePaOn[band].push(false);
			this.forcePaOff[band].push(false);
			this.att[band].push(0);					
			this.inputAgc[band].push(0);
			this.isFilterGrouped[band].push([]);		
			this.bwIndex[band].push([]);					
			this.bwKHz[band].push([]);	
			this.freqHz[band].push([]);	
			this.fstartHzAdjFilter[band].push([]);		
			this.fstopHzAdjFilter[band].push([]);
			for (var ch=0;ch<this.CHNR;ch++){
				this.isFilterGrouped[band][uldl].push(false);		
				this.bwIndex[band][uldl].push(0);					
				this.bwKHz[band][uldl].push(0);	
				this.freqHz[band][uldl].push(0);
			}
			for (var ch=0;ch<this.ADJNR;ch++){
				this.fstartHzAdjFilter[band][uldl].push(0);		
				this.fstopHzAdjFilter[band][uldl].push(0);				
			}			
		}
	}
	if (!this.isRemote){
		for (var k=0;k<8;k++){
			this.alarmNames[0].push("Fiber Optic "+(k+1));
		}
	}
	this.frm					= "";
	
	this.SqModeVals = {
		'NOTLINKED': 	0,
		'LINKED': 	1
	}
	this.sqThrLimits = function(b, ULlowGainMode) {
		if (b == 0) {
			var isULlowGainMode = ULlowGainMode || false;
			if (!isULlowGainMode) {
				return {MIN: -110, MAX: -40};
			} else {
				return {MIN: -75, MAX: -40};
			}
		} else {
			return {MIN: -90, MAX: -40};
		}
	}
	this.GfineRange = -40;
	this.GmainRange = [-30, -30];
	this.limitPowerRange = [20, 20];
	this.limitgFine = [
		{MIN: -40,	MAX: 0},
		{MIN: -40,	MAX: 0}
	];
	this.limitAbnSqTime = {MIN: 10,	MAX: 2400};
	this.limitRetryTime = {MIN: 0,	MAX: 48};
	this.limitAutoPaUlOffTime = {MIN: 1,	MAX: 60000};
	
	this.FOconfigMask = 0;
	this.FOgroupDelayEnable = false;
	this.FOclearErrorCounters = false;
	this.FOgroupDelay = [[0, 0], [0, 0]];
	this.getDelayMax = function(){
		return (this.device_version_index > 1 ? 400:200); //delay max was increased to 400 us in Flex2.0
	}
	this.FOconfigSettingsMasks = {
		runDelayMeas: 0x80,
		groupDelayEnable: 0x02,
		clearErrorCountersMaster: 0x02,
		clearErrorCountersRemote: 0x04,
		masterPriority: 0x04,
		masterModeAuto: 0x08,
	}
	this.parse = function(s,factory) {
		var frameLength = this.isMaster ? masterConfigLength : this.isExp ? expConfigLength : remoteConfigLength;
		if (s.length<frameLength) return -1;
		var i;
		var res;
		var ind = 0;
		if (this.isMaster){
			this.device_version_index = 2;
		}else{
			this.device_version_index = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		}
		//GENERAL CONFIGURATION
		ind = this.parseGeneral(s,ind,factory);
		if (!this.isExp){
			//FILTER CONFIGURATIONS
			ind = this.parseFilter(s,ind,factory);
			//SQUELCH CONFIGURATION
			if (this.isMaster){
				ind = this.parseSquelchMaster(s,ind);
			}else{
				ind = this.parseSquelchRemote(s,ind);
			}
		}
		//ALARM CONFIGURATION
		ind = this.parseAlarm(s,ind,factory);
		//OTHER CONFIGURATION
		ind = this.parseOtherConf(s,ind,factory);
		
		this.frm = this.getFrm(factory);
	}
	this.parseGeneral = function(s,ind,factory){
		var res;
		if (!this.isExp){
			for (var b=0;b<2;b++){ //Band0/1
				for (var i=0;i<2;i++){//UL/DL
					//PA Enabled, AGC Mode, Linked UL/DL
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					this.paEnabled[b][i] = (res & 0x80)!=0;
					this.forcePaOn[b][i] = false;
					this.forcePaOff[b][i] = false;	
					if (i==0 && !this.isMaster){
						this.agcBandMode[b] = (res & 0xc)>>2;
						if (this.agcBandMode[b]==3) this.agcBandMode[b]=2;
					}
					if (i==1 && this.isMaster){
						this.uldlLinkedFreq[b] = (res & 0x10)==0;
						if ((factory.fstop[2*b+1]-factory.fstart[2*b+1])!=(factory.fstop[2*b]-factory.fstart[2*b])) this.uldlLinkedFreq[b]=false;
					}
					//ATT
					this.att[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					//POWER: ONLY UL IF REMOTE
					if (i==0 || this.isMaster){
						this.inputAgc[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
						if (this.inputAgc[b][i]>127) this.inputAgc[b][i]-=256;	
					}
				}
			}
		}
		//RESET, clearErrorCounter, relay assign policy, force general system, measure delay
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.resetSoft = false;//(res & 0x1)!=0;
		this.FOclearErrorCounters = false;
		this.runDelayMeasuarement = false;
		this.FOconfigMask = res;
		if (this.isMaster){
			this.relayAssignPolicy = this.relayAssignPolicy = (res & 0xc) >> 2;
			if (this.relayAssignPolicy==3) this.relayAssignPolicy=2;
			this.forceSystemAlarm[0] = (res & 0x40)!=0;
			this.forceSystemAlarm[1] = (res & 0x20)!=0;
			this.forceSystemAlarm[2] = (res & 0x10)!=0;
		}
		
		return ind;
	}
	this.parseFilter = function(s,ind,factory){
		var res;
		var ud = this.isMaster ? 1:0;
		for (var b=0;b<2;b++){ //Band0/1
			//All SAME BW, BAND14_ADJ1
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.allChSameBW[b][ud] = (res & 0x1)!=0;
			if (b==0){
				this.firstADJisFirstNet = (res & 0x2)!=0;
				if (!factory.commonUl) this.firstADJisFirstNet = false; //forced to false if V/U
			}
			//NGROUPS
			this.numberOfFilterNonGrouped[b][ud] = parseInt(s.substring(ind,ind+2), 16) & 0x3f; ind+=2;
			//FILTERS NB
			for (var ch=0;ch<this.CHNR;ch++){//64CH
				//CHON,GROUPED,BW
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.filterEnabled[0][b][ud][ch] = (res & 0x80)==0;
				this.isFilterGrouped[b][ud][ch] = (res & 0x40)!=0;
				this.freqHz[b][ud][ch] = 0;
				if (factory.fstep<1.5e3) this.freqHz[b][ud][ch] = ((res & 0x20)>>5)*factory.fstep/2; //1 extra bit for freq only if fstep<1.5KHz
				res = res & 0x7;
				if (!factory.commonUl && res==0) res=1; //filter 150KHz not allowed in V/U
				this.bwIndex[b][ud][ch] = (res);
				this.bwKHz[b][ud][ch] = this.computeBWFromIndex(res);
				//FINE GAIN
				this.fineGainFilter[0][b][ud][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (this.fineGainFilter[0][b][ud][ch]>127) this.fineGainFilter[0][b][ud][ch]-=256;
				//FREQ
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				if (res>32767) res-=65536;
				this.freqHz[b][ud][ch] += factory.fref[2*b+ud]+res*factory.fstep;
			}
			//ADJ ENABLE
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++){
				this.filterEnabled[1][b][ud][ch] = (res & (1<<(ch+4)))==0;
			}
			//FILTERS ADJ
			for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
				//FINE GAIN
				this.fineGainFilter[1][b][ud][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (this.fineGainFilter[1][b][ud][ch]>127) this.fineGainFilter[1][b][ud][ch]-=256;
				//FSTART
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				if (res>32767) res-=65536;
				this.fstartHzAdjFilter[b][ud][ch] = factory.fref[2*b+ud]+res*factory.fstepAdj;
				//FSTOP
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				if (res>32767) res-=65536;
				this.fstopHzAdjFilter[b][ud][ch] = factory.fref[2*b+ud]+res*factory.fstepAdj;
			}
		}
		return ind;
	}
	this.parseSquelchRemote = function(s,ind){
		var res;
		//SQ ENABLE
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.sqChEnabled[0][0][0][0] = (res & 0x1)!=0;
		this.sqChEnabled[0][1][0][0] = (res & 0x4)!=0;
		this.cnAlarmTime = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		for (var b=0;b<2;b++){ //Band0/1
			//SQTH NB
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
			this.sqChThreshold[0][b][0][0] = res;
			//CNTH NB
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
			this.cn_threshold_nb[b] = res;
			//SQENADJ
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++){
				this.sqChEnabled[1][b][0][ch] = (res & (1<<ch))!=0;
			}
			for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
				//SQTH ADJ
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
				this.sqChThreshold[1][b][0][ch] = res;
				//CNTH ADJ
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
				this.cn_threshold_adj[b][ch] = res;
			}
		}
		return ind;
	}
	this.parseSquelchMaster = function(s,ind){
		var res;
		//ALL SAME SQUELCH
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.allSameSquelch[0] = (res & 0x2)!=0;
		this.allSameSquelch[1] = (res & 0x8)!=0;

		for (var b=0;b<2;b++){ //Band0/1
			//SQ ENABLE
			for (var i = 0; i < 2; i++) {
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				for (var ch=0;ch<this.CHNR/2;ch++){
					var channel = ch + (1-i)*this.CHNR/2;
					this.sqChEnabled[0][b][1][channel] = (res & (1<<ch))!=0;
				}
			}
			//SQENADJ
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++){
				this.sqChEnabled[1][b][1][ch] = (res & (1<<ch))!=0;
			}
			//SQTH NB
			for (var ch=0;ch<this.CHNR;ch++){//64CH
				res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
				this.sqChThreshold[0][b][1][ch] = res;
			}
			//SQTH ADJ
			for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2; if (res>127) res-=256;
				this.sqChThreshold[1][b][1][ch] = res;
			}
		}
		return ind;
	}
	this.parseAlarm = function(s,ind,factory){
		var res,res2;
		if (this.isRemote){
			//OSCFEATURE GENERAL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.oscActionAfterAlarm[0] = (res & 0x3);
			if (this.oscActionAfterAlarm[0]==3) this.oscActionAfterAlarm[0]=2;
			this.clearOscAlarm[0] = false;//(res & 0x4)!=0;
			this.runIsolationMeas[0] = false;//(res & 0x10)!=0;
			//OSCTIMETH
			this.oscTimeThSeconds[0] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			//OSCRETRYTIME
			this.oscRetryTimeHours[0] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			//EXT TEMP ACTION
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.extremeTempAction = ((res & 0x0c) >> 2);
			if (this.extremeTempAction==3) this.extremeTempAction=2;
		}
		//RELAY TIMERS
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			//DELAY
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerON[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			//LATCH
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerON[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		//BBU
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		this.bbu_serial_mode = (res & 0x01);
		this.bbu_type = ((res >> 1) & 0x07);
		this.bbu_dismiss_deep_discharge = false;	// write-only
		if (this.isMaster) this.system_force_rf_off = (res & 0x20)==0x20;
		
		if (this.isMaster){
			//MASTER MODE PRIORITY
			this.FOconfigMask = parseInt(s.substr(ind,2), 16); ind+=2;
			this.masterMode = !!(this.FOconfigMask & this.FOconfigSettingsMasks.masterPriority)?1:0;
			if (!!(this.FOconfigMask & this.FOconfigSettingsMasks.masterModeAuto)) this.masterMode = 2;
			//ALARM ENABLES WITH MASTER MODE AUTO
			res = parseInt(s.substr(ind,4), 16); ind+=4;
			for (var k=0;k<this.masterModeAlarmEnables.length;k++){
				this.masterModeAlarmEnables[k] = (res & (1<<k))!=0;
			}
			//RX POWER LOW TIMERS
			for (var k=0;k<2;k++){
				this.timeTxLowPowHigh[k] = parseInt(s.substring(ind,ind+6), 16); ind+=6;
				this.timeTxLowPowLow[k]  = parseInt(s.substring(ind,ind+6), 16); ind+=6;
			}
			//ANTENNA DISCONNECTION TH
			for (var b = 0; b < 2; b++ ) {
				this.antennaDisconnectionThreshold[b] = cSignedByte(parseInt(s.substring(ind,ind+2), 16)); ind+=2;
			}
		}
		if (this.isRemote){
			//VSWR DETECTORS
			for (var b=0;b<2;b++){ //Band0/1
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;	if (res>32767) res-=65536;
				this.retLossTh[b] = res/100;
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;	if (res>32767) res-=65536;
				this.minPowerVSWR[b] = res/100;
				this.alarmNumSens[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			}
		}
		//GLOBAL ALARM ENABLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;

		for (var k=0;k<24;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k>=4 && k<6 && !factory.plaAvailable) this.globalAlarmsEnabled[k]=false; //path loss alarms forced to disable if pla is not available
			if (!this.isMaster && k==3) this.globalAlarmsEnabled[k]= true; //Alarm Oscillation detection always "Enabled"
			if ( k < 6 ) {
				this.globalAlarmsInstalled[k] = true;
			} else if ( k >= 6 && k < 13 ) {
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		for (var k = 13; k < 15; k++) {											// general system alarm 2 & 3
			if (this.supportsBBU()) {			// for master and remotes>=BBU MVO2
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];	// installed if enabled
			}
		}
		if (this.isExp){
			for (var k=2;k<8;k++){
				this.globalAlarmsInstalled[k] = false; //opf, path loss and fiber1/2 remote alarms not installed in expansion
			}
			this.globalAlarmsInstalled[11] = false; //force rf off not available in expansions
		}
		if (!this.isExp){
			//BAND ALARM ENABLED BAND0/COMMON
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<16;k++){
				this.bandAlarmsEnabled[0][k] = (res & (1<<k))!=0;
				this.bandAlarmsInstalled[k] = (k<11); //Forced available first 11
			}
			if (!this.isMaster && !this.supportsFlex2()){ //C/N alarm not installed if remote is not flex2.0
				this.bandAlarmsInstalled[10] = false;
				this.bandAlarmsEnabled[0][10] = false;
			}
			if (this.isMaster){
				//BAND ALARM ENABLED BAND1 (ONLY MASTER)
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var k=0;k<16;k++) this.bandAlarmsEnabled[1][k] = (res & (1<<k))!=0;

			}else{ //some alarms not available on remotes
				this.bandAlarmsInstalled[1] = false;//no Overload DL
				this.bandAlarmsInstalled[5] = false;//no Rx Low Power
				this.bandAlarmsInstalled[8] = false;//no UL PA Fail
				this.bandAlarmsInstalled[9] = false;//no Antenna Disconnection
			}
		}
		//BBU ALARM ENABLED/INSTALLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++){
			this.bbuAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k<12) {
				this.bbuAlarmsInstalled[k] = !this.isRemote || this.device_version_index>0; //only false if remote does not supports BBU
			} else if (k>11) {
				this.bbuAlarmsInstalled[k] = (res2 & (1<<k))!=0;
			}
		}
		//RELAY LOGIC
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<7;k++){
			this.relayLogicConfigNormal[k] = (res & (1<<k))!=0;
		}
		//EXTERNAL ALARM POLARITY
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<4;k++){
			this.externalAlarmPolarity[k] = (res & (1<<k))!=0;
		}
		//GLOBAL RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
		for (var k=0;k<24;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignGlobalAlarm[k][j] = (res & (1<<j))!=0;
				if (!this.isMaster && k>=4 && k<6 && !factory.plaAvailable) this.relayAssignGlobalAlarm[k][j] = false; //path loss relay assign forced to unassigned on remotes if pla is not available
			}
			this.generalSystemAlarm[0][0][k] = (res & 0x80) != 0;
			if (k>=4 && k<6 && !factory.plaAvailable) this.generalSystemAlarm[0][0][k] = false; //path loss gen sys assign forced to unassigned if pla is not available
		}
		if (!this.isExp){
			//BAND RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
			for (var k=0;k<16;k++){
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var j=0;j<7;j++){
					this.relayAssignBandAlarm[k][j] = (res & (1<<j))!=0;
				}
				this.generalSystemAlarm[0][1][k] = (res & 0x80) != 0;
			}
		}
		//BBU RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
		for (var k=0;k<16;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignBbuAlarm[k][j] = (res & (1<<j))!=0;
				if (this.alarmNamesBbu[k].length == 0) this.relayAssignBbuAlarm[k][j] = 0; /* k==11 unused alarm */
			}
			this.generalSystemAlarm[0][2][k] = (res & 0x80) != 0;
		}
		//GLOBAL RELAY ASIGN RELAY8
		for (var k=0;k<24;k++){
			var n = ~~Math.floor(k/8);
			var m = (k - n*8);
			res = parseInt(s.substring(ind,ind+2), 16); if (m==7) ind+=2;
			for (var j=0;j<1;j++){
				this.relayAssignGlobalAlarm[k][7] = (res & (1<<(j+m)))!=0;
				if (!this.isMaster && k>=4 && k<6 && !factory.plaAvailable) this.relayAssignGlobalAlarm[k][7] = false; //path loss relay assign forced to unassigned on remotes if pla is not available
			}
		}
		if (!this.isExp){
			//BAND RELAY ASIGN RELAY8
			for (var k=0;k<16;k++){
				var n = ~~Math.floor(k/8);	// n= 0
				var m = (k - n*8);			// m= 0,1,2,3,4,5,6,7
				res = parseInt(s.substring(ind,ind+2), 16); if (m==7) ind+=2;
				for (var j=0;j<1;j++){
					this.relayAssignBandAlarm[k][7] = (res & (1<<(j+m)))!=0;
				}
			}
		}
		//BBU RELAY ASIGN RELAY8
		for (var k=0;k<16;k++){
			var n = ~~Math.floor(k/8);
			var m = (k - n*8);
			res = parseInt(s.substring(ind,ind+2), 16); if (m==7) ind+=2; 
			for (var j=0;j<1;j++){
				this.relayAssignBbuAlarm[k][7] = (res & (1<<(j+m)))!=0;
			}
		}
		//GLOBAL RELAY ASIGN RELAY9-10
		for (var k=0;k<24;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2;
			for (var j=0;j<2;j++){
				this.relayAssignGlobalAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
				if (!this.isMaster && k>=4 && k<6 && !factory.plaAvailable) this.relayAssignGlobalAlarm[k][j] = false; //path loss relay assign forced to unassigned on remotes if pla is not available
			}
		}
		if (!this.isExp){
			//BAND RELAY ASIGN RELAY9-10
			for (var k=0;k<16;k++){
				var n = ~~Math.floor(k/4);	// n= 0,1
				var m = (k - n*4)*2;		// m= 0,2,4,6
				res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2;
				for (var j=0;j<2;j++){
					this.relayAssignBandAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
				}
			}
		}
		//BBU RELAY ASIGN RELAY9-10
		for (var k=0;k<16;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2; 
			for (var j=0;j<2;j++){
				this.relayAssignBbuAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
			}
		}
		//GEN SYS ALARM 2-3
		for (var i=1;i<NrOfGralSystemAlarms;i++) {
			//GLOBAL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0; k<24; k++) {
				this.generalSystemAlarm[i][0][k] = (res & (1<<k))!=0;
				if (k>=4 && k<6 && !factory.plaAvailable) this.generalSystemAlarm[i][0][k] = false; //path loss gen sys assign forced to unassigned if pla is not available
			}
			if (!this.isExp){
				//BAND
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var k=0; k<16; k++) {
					this.generalSystemAlarm[i][1][k] = (res & (1<<k))!=0;
				}
			}
			//BBU
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0; k<16; k++) {
				this.generalSystemAlarm[i][2][k] = (res & (1<<k))!=0;
			}
		}
		//BUZZER
		res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
		this.buzzerMuteCommand = (res & 0x80000000)!=0;
		this.buzzerMuteTime = res & 0x7fffffff;
		//ALARM THRESHOLDS
		var nAlarmTh = !this.isRemote ? this.alarmThrshItems : 5;
		for (var k = 0; k < nAlarmTh; k++) { //first 5, other 2 are read in pla section
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			if (res > 127) res -= 256;
			this.alarmThrshData[k].valueThr = res;
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res /= 2;
			this.alarmThrshData[k].hysteresis = res;
		}
		return ind;
	}
	this.parseOtherConf = function(s,ind,factory) {
		var res;
		if (this.isMaster){
			//CONTROL CHANNEL
			for (var b=0;b<2;b++){
				res = parseInt(s.substring(ind,ind+2), 16);ind+=2;if (res>127) res-=256;
				this.controlChannel[b] = res;
			}
			//AUTO UL PA OFF
			this.autoUlPaOffTimer = parseInt(s.substr(ind,4), 16); ind+=4;
			//AUTO UL POWER FUNCTION BASE STATION DATA
			for (var b=0;b<3;b++){
				res = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
				this.base_station_power[b] = res;
				res = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
				this.base_station_sensitivity[b] = res;
			}
			
		}
		if (this.isRemote){
			//DELAY COMPENSATION
			for (var port = 0; port < 2; port++) {
				for (var k = 0; k < 2; k++) {
					res = parseInt(s.substr(ind,4), 16); ind+=4;
					this.FOgroupDelay[port][k] = res / 10;
				}
			}
			//PATH LOSS ANALYZER
			//PLA EN + MEAS + DELAY ENABLE
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.plaEn = (res & 0x1)!=0;
			if (!factory.plaAvailable) this.plaEn = false; //path loss forced to disable if pla is not available
			this.forcePlaMeas = false; //(res & 0x2)!=0;
			this.FOgroupDelayEnable = (res & 0x4)!=0;
			//PLA FSTART
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			if (res>32767) res-=65536;
			this.fstartHzPlaFilter = factory.fref[2*factory.plaBand+1]+res*factory.fstepAdj;
			//PLA FSTOP
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			if (res>32767) res-=65536;
			this.fstopHzPlaFilter = factory.fref[2*factory.plaBand+1]+res*factory.fstepAdj;
			//PLA PERIOD
			this.plaMeasPeriod = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			//PLA ALARM THRESHOLDS
			for (var k = 5; k < this.alarmThrshItems; k++) {
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (res > 127) res -= 256;
				this.alarmThrshData[k].valueThr = res;
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				res /= 2;
				this.alarmThrshData[k].hysteresis = res;
			}
		}
		//EXTERNAL INPUT NAMES
		for (var k=0;k<4;k++){ 
			this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
		if (this.isMaster || this.supportsFlex2()) this.alarmNames[0][11] = "Force RF OFF"; //Fixed name
		//ANNUNCIATOR NAMES
		for (var k=0;k<4;k++){ 
			this.alarmNamesBbu[12+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
		return ind;
	}
	this.getFrm = function(factory){
		var i;
		var res,fr;
		var mask = 0;
		var b,ch;
		var cfg = "";
		if (!this.isMaster) cfg += hexformat(this.device_version_index,2);
		//GENERAL CONFIGURATION
		cfg += this.getFrmGeneral();
		if (!this.isExp){
			//FILTER CONFIGURATIONS
			cfg += this.getFrmFilter(factory);
			//SQUELCH CONFIGURATION
			if (this.isMaster){
				cfg += this.getFrmSquelchMaster();
			}else{
				cfg += this.getFrmSquelchRemote();
			}
		}
		//ALARM CONFIGURATION
		cfg += this.getFrmAlarm();
		//OTHER CONFIGURATION
		cfg += this.getFrmOtherConf(factory);
		
		//this.frm = cfg; no se actualiza el string al generar para poder guardar conf para tool
		return cfg;
	}
	this.getFrmGeneral = function(){
		var res;
		var mask = 0;
		var cfg = "";
		if (!this.isExp){
			//GENERAL CONFIGURATION
			for (var b=0;b<2;b++){ //Band0/1
				for (var i=0;i<2;i++){//UL/DL
					//PA Enabled, AGC Mode, Linked UL/DL
					mask = 0;
					if (this.paEnabled[b][i]) mask|=0x80;
					if (this.forcePaOff[b][i]) mask|=0x1;
					if (this.forcePaOn[b][i]) mask|=0x2;
					if (i==0 && !this.isMaster){
						if (this.agcBandMode[b]==3) this.agcBandMode[b]=2;
						mask|=(this.agcBandMode[b]&0x3)<<2;
					}
					if (i==1 && this.isMaster){
						if (!this.uldlLinkedFreq[b]) mask|=0x10;
					}
					cfg += hexformat(mask,2);
					//ATT
					cfg += hexformat(this.att[b][i],2);
					//INPUT AGC: ONLY UL IF REMOTE
					if (i==0 || this.isMaster){
						res= this.inputAgc[b][i];if (res<0) res+=256;
						cfg += hexformat(res,2);
					}
				}
			}
		}
		//RESET, clearErrorCounter, relay assign policy, force general system, measure delay
		mask = 0;
		if (this.resetSoft) mask|=0x1; //bit0
		if (this.isMaster){
			mask |= this.FOclearErrorCounters ? this.FOconfigSettingsMasks.clearErrorCountersMaster : 0; //bit1
			if (this.relayAssignPolicy==3) this.relayAssignPolicy=2;
			mask |= (this.relayAssignPolicy & 0x3)<<2; //bit 3,2
			if (this.forceSystemAlarm[2]) mask |= 0x10; //bit 4
			if (this.forceSystemAlarm[1]) mask |= 0x20; //bit 5
			if (this.forceSystemAlarm[0]) mask |= 0x40; //bit 6
			mask |= this.runDelayMeasuarement ? this.FOconfigSettingsMasks.runDelayMeas : 0; //bit7
		}else{
			mask |= this.FOclearErrorCounters ? this.FOconfigSettingsMasks.clearErrorCountersRemote : 0; //bit2
		}
		cfg += hexformat(mask,2);
		return cfg;
	}
	this.getFrmFilter = function(factory){
		var res;
		var mask = 0;
		var ud = this.isMaster ? 1:0;
		var cfg = "";
		
		for (b=0;b<2;b++){ //Band0/1
			//All SAME BW, BAND14_ADJ1
			mask = 0;
			if (this.allChSameBW[b][ud]) mask|=0x1;
			if (b==0){
				if (!factory.commonUl) this.firstADJisFirstNet = false; //forced to false if V/U
				if (this.firstADJisFirstNet) mask|=0x2;
			}
			cfg += hexformat(mask,2);
			//NGROUPS
			cfg += hexformat(this.numberOfFilterNonGrouped[b][ud] & 0x3f,2);
			//FILTERS NB
			for (ch=0;ch<this.CHNR;ch++){//32CH (los filtros UL son 1-32, los filtros DL 33-64)
				mask=0;
				//CHON,GROUPED,BW
				if (!this.filterEnabled[0][b][ud][ch]) mask|=0x80;
				if (this.isFilterGrouped[b][ud][ch]) mask|=0x40;
				this.bwIndex[b][ud][ch] = this.bwIndex[b][ud][ch] & 0x7;
				if (!factory.commonUl && this.bwIndex[b][ud][ch]==0) this.bwIndex[b][ud][ch]=1; //filter 150KHz not allowed in V/U
				mask|=this.bwIndex[b][ud][ch];
				this.bwKHz[b][ud][ch] = this.computeBWFromIndex(this.bwIndex[b][ud][ch]);
				if (factory.fstep<1.5e3){
					fr = ~~Math.round((this.freqHz[b][ud][ch]-factory.fref[2*b+ud])/factory.fstep*2);if (fr<0) fr+=131072; 
					mask|= (fr & 0x1)<<5; //1extra bit for freq only if fstep<1.5KHz
				}else{
					fr = 2*(~~Math.round((this.freqHz[b][ud][ch]-factory.fref[2*b+ud])/factory.fstep));if (fr<0) fr+=131072;
				}
				cfg += hexformat(mask,2);
				//FINE GAIN
				res=this.fineGainFilter[0][b][ud][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
				//FREQ
				cfg += hexformat((fr>>1) & 0xffff,4);
			}
			//ADJ ENABLE
			mask=0;
			for (ch=0;ch<this.ADJNR;ch++){
				if (!this.filterEnabled[1][b][ud][ch]) mask|=(1<<(ch+4));
			}
			cfg += hexformat(mask,2);
			//FILTERS ADJ
			for (ch=0;ch<this.ADJNR;ch++){//4ADJ
				//FINE GAIN
				res=this.fineGainFilter[1][b][ud][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
				//FSTART
				res =~~Math.round((this.fstartHzAdjFilter[b][ud][ch]-factory.fref[2*b+ud])/factory.fstepAdj);if (res<0) res+=65536;
				cfg += hexformat(res,4);
				//FSTOP
				res =~~Math.round((this.fstopHzAdjFilter[b][ud][ch]-factory.fref[2*b+ud])/factory.fstepAdj);if (res<0) res+=65536;
				cfg += hexformat(res,4);
			}
		}
		return cfg;
	}
	this.getFrmSquelchRemote = function(){
		var res;
		var mask = 0;
		var cfg = "";
		//SQ ENABLE
		mask=0;
		if (this.sqChEnabled[0][0][0][0]) mask|=0x1;
		if (this.sqChEnabled[0][1][0][0]) mask|=0x4;
		cfg += hexformat(mask,2);
		//C/N Time Threshold
		cfg += hexformat(this.cnAlarmTime,4);
		for (var b=0;b<2;b++){ //Band0/1
			//SQTH NB
			res = this.sqChThreshold[0][b][0][0];if (res<0) res+=256;
			cfg += hexformat(res,2);
			//CNTH NB
			res = this.cn_threshold_nb[b];if (res<0) res+=256;
			cfg += hexformat(res,2);
			//SQENADJ
			mask=0;
			for (ch=0;ch<this.ADJNR;ch++){
				if (this.sqChEnabled[1][b][0][ch]) mask|=(1<<ch);
			}
			cfg += hexformat(mask,2);
			for (ch=0;ch<this.ADJNR;ch++){//4ADJ
				//SQTH ADJ
				res = this.sqChThreshold[1][b][0][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
				//CNTH ADJ
				res = this.cn_threshold_adj[b][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
		}
		return cfg;
	}
	this.getFrmSquelchMaster = function(){
		var res;
		var mask = 0;
		var cfg = "";
		//ALL SAME SQUELCH
		if (this.allSameSquelch[0]) mask|=0x2;
		if (this.allSameSquelch[1]) mask|=0x8;
		cfg += hexformat(mask,2);
		for (var b=0;b<2;b++){ //Band0/1
			//SQ ENABLE CH
			var nrOfSquelchEnabledBytes = this.CHNR/8;
			for ( var i = 0; i < nrOfSquelchEnabledBytes; i++ ) {
				var mask = 0;
				for ( var j = 0; j < 8; j++ ) {
					var ch = (nrOfSquelchEnabledBytes-1-i)*8+j;
					if (this.sqChEnabled[0][b][1][ch]) mask|=1<<j;
				}
				cfg += hexformat(mask,2);
			}
			//SQENADJ
			mask=0;
			for (ch=0;ch<this.ADJNR;ch++){
				if (this.sqChEnabled[1][b][1][ch]) mask|=(1<<ch);
			}
			cfg += hexformat(mask,2);
			//SQTH NB
			for (ch=0;ch<this.CHNR;ch++){//4ADJ
				res = this.sqChThreshold[0][b][1][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
			for (ch=0;ch<this.ADJNR;ch++){//4ADJ
				//SQTH ADJ
				res = this.sqChThreshold[1][b][1][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
		}
		return cfg;
	}
	this.getFrmAlarm = function(){
		var res;
		var mask = 0,mask2 = 0;
		var cfg = "";
		if (this.isRemote){
			//OSCFEATURE GENERAL
			if (this.oscActionAfterAlarm[0]==3) this.oscActionAfterAlarm[0]=2;
			mask = this.oscActionAfterAlarm[0] & 0x3;
			if (this.clearOscAlarm[0]) mask|=0x4;
			if (this.runIsolationMeas[0]) mask|=0x10;
			cfg += hexformat(mask,2);
			//OSCTIMETH
			cfg += hexformat(this.oscTimeThSeconds[0],4);
			//OSCRETRYTIME
			cfg += hexformat(this.oscRetryTimeHours[0],4);
			//EXT TEMP ACTION
			if (this.extremeTempAction==3) this.extremeTempAction=2;
			mask = (this.extremeTempAction << 2) & 0x0C;
			cfg += hexformat(mask,2);
		}
		//RELAY TIMERS
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			mask = (this.delayTimer[k]>>16) & 0x7fff; 
			if (this.delayTimerON[k]) mask|=0x8000;
			if (mask<0) mask+=65536;
			cfg += hexformat(mask,4);
			mask = this.delayTimer[k] & 0xffff; if (mask<0) mask+=65536;
			cfg += hexformat(mask,4);			
			mask = (this.latchTimer[k]>>16) & 0x7fff; 
			if (this.latchTimerON[k]) mask|=0x8000;
			if (mask<0) mask+=65536;
			cfg += hexformat(mask,4);
			mask = this.latchTimer[k] & 0xffff; if (mask<0) mask+=65536;
			cfg += hexformat(mask,4);	
		}
		//BBU
		var bbu_config_mask = 0;
		if (this.bbu_serial_mode!=0) bbu_config_mask |= 0x01;
		bbu_config_mask |= ((this.bbu_type & 0x07) << 1);
		if (this.bbu_dismiss_deep_discharge) bbu_config_mask |= 0x10;
		if (this.isMaster && this.system_force_rf_off) bbu_config_mask |= 0x20;
		cfg += hexformat(bbu_config_mask, 2);
		
		if (this.isMaster){
			//MASTER MODE PRIORITY
			var FOmoduleMask = 0;
			FOmoduleMask |= this.masterMode == 1 ? this.FOconfigSettingsMasks.masterPriority : 0;
			FOmoduleMask |= this.masterMode == 2 ? this.FOconfigSettingsMasks.masterModeAuto : 0;
			cfg += hexformat(FOmoduleMask, 2);
			//ALARM ENABLES WITH MASTER MODE AUTO
			var mask=0;
			for (var k = 0; k < this.masterModeAlarmEnables.length; k++) { 
				if (this.masterModeAlarmEnables[k]) mask|=1<<k;
			}
			cfg+=hexformat(mask, 4);
			//RX POWER LOW TIMERS
			for (var k=0;k<2;k++){
				cfg += hexformat(this.timeTxLowPowHigh[k],6);
				cfg += hexformat(this.timeTxLowPowLow[k],6);
			}
			//ANTENNA DISCONNECTION TH
			for (var b = 0; b < 2; b++ ) {
				if (this.antennaDisconnectionThreshold[b] < -128) {
					this.antennaDisconnectionThreshold[b] = -128;
				} else if (this.antennaDisconnectionThreshold[b] > 127) {
					this.antennaDisconnectionThreshold[b] = 127;
				}
				cfg += hexformat(rSignedByte(this.antennaDisconnectionThreshold[b]),2);
			}
		}
		if (this.isRemote){
			//VSWR DETECTORS
			for (var k=0;k<2;k++){
				res = ~~Math.round(100*this.retLossTh[k]); if (res<0) res+=65536;
				cfg += hexformat(res,4);
				res = ~~Math.round(100*this.minPowerVSWR[k]); if (res<0) res+=65536;
				cfg += hexformat(res,4);			
				cfg += hexformat(this.alarmNumSens[k],4);
			}
		}
		//GLOBAL ALARM ENABLED
		for (var k=0, mask=0;k<24;k++){
			if (this.globalAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat((mask & 0xff0000)>>16,2);
		if (!this.isExp){
			//BAND ALARM ENABLED BAND0/COMMON
			for (var k=0,mask=0;k<16;k++){
				if (this.bandAlarmsEnabled[0][k]) mask|= 1<<k;
			}
			cfg += hexformat(mask & 0xff,2);
			cfg += hexformat((mask & 0xff00)>>8,2);
			if (this.isMaster){
				//BAND ALARM ENABLED BAND1 (ONLY MASTER)
				for (var k=0,mask=0;k<16;k++){
					if (this.bandAlarmsEnabled[1][k]) mask|= 1<<k;
				}
				cfg += hexformat(mask & 0xff,2);
				cfg += hexformat((mask & 0xff00)>>8,2);
			}
		}
		//BBU ALARM ENABLED/INSTALLED
		mask=0,mask2=0;
		for (var k=0;k<16;k++){
			if (this.bbuAlarmsEnabled[k]) mask|= 1<<k;
			if (this.bbuAlarmsInstalled[k]) mask2|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat(mask2 & 0xff,2);
		cfg += hexformat((mask2 & 0xff00)>>8,2);
		//RELAY LOGIC
		for (var k=0, mask=0 ;k<7;k++){
			if (this.relayLogicConfigNormal[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask,2);
		//EXTERNAL ALARM POLARITY
		for (var k=0, mask=0 ;k<4;k++){
			if (this.externalAlarmPolarity[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask,2);
		//GLOBAL RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
		for (var k=0;k<24;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignGlobalAlarm[k][j]) mask|= 1<<j;
			}
			if (this.generalSystemAlarm[0][0][k]) {
				mask |= 0x80;
			}
			cfg += hexformat(mask,2);
		}
		if (!this.isExp){
			//BAND RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
			for (var k=0;k<16;k++){
				for (var j=0,mask=0;j<7;j++){
					if (this.relayAssignBandAlarm[k][j]) mask|= 1<<j;
				}
				if (this.generalSystemAlarm[0][1][k]) {
					mask |= 0x80;
				}
				cfg += hexformat(mask,2);
			}
		}
		//BBU RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
		for (var k=0;k<16;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignBbuAlarm[k][j]) mask|= 1<<j;
			}
			if (this.generalSystemAlarm[0][2][k]) mask |= 0x80;
			cfg += hexformat(mask,2);
		}
		//GLOBAL RELAY ASIGN RELAY8
		for (var k=0, mask2=0;k<24;k++){
			var n = ~~Math.floor(k/8);
			var m = (k - n*8);
			if (this.relayAssignGlobalAlarm[k][7]) mask2|= 1<<m;
			if (m==7) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		if (!this.isExp){
			//BAND RELAY ASIGN RELAY8
			for (var k=0, mask2=0;k<16;k++){
				var n = ~~Math.floor(k/8);
				var m = (k - n*8);
				if (this.relayAssignBandAlarm[k][7]) mask2|= 1<<m;
				if (m==7) {
					cfg += hexformat(mask2,2);
					mask2 = 0;
				}
			}
		}
		//BBU RELAY ASIGN RELAY8
		for (var k=0, mask2=0;k<16;k++){
			var n = ~~Math.floor(k/8);
			var m = (k - n*8);
			if (this.relayAssignBbuAlarm[k][7]) mask2|= 1<<m;
			if (m==7) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		//GLOBAL RELAY ASIGN RELAY9-10
		for (var k=0, mask2=0;k<24;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			mask = 0;
			for (var j=0;j<2;j++){
				if (this.relayAssignGlobalAlarm[k][8+j]) mask|= 1<<j;
			}
			mask2 |= (mask << m);
			if (m==6) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		if (!this.isExp){
			//BAND RELAY ASIGN RELAY9-10
			for (var k=0, mask2=0;k<16;k++){
				var n = ~~Math.floor(k/4);	// n= 0,1
				var m = (k - n*4)*2;		// m= 0,2,4,6
				mask = 0;
				for (var j=0;j<2;j++){
					if (this.relayAssignBandAlarm[k][8+j]) mask|= 1<<j;
				}
				mask2 |= (mask << m)
				if (m==6) {
					cfg += hexformat(mask2,2);
					mask2 = 0;
				}
			}
		}
		//BBU RELAY ASIGN RELAY9-10
		for (var k=0, mask2=0;k<16;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			mask = 0;
			for (var j=0;j<2;j++){
				if (this.relayAssignBbuAlarm[k][8+j]) mask|= 1<<j;
			}
			mask2 |= (mask << m);
			if (m==6) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		//GEN SYS ALARM 2-3
		for (var i=1;i<NrOfGralSystemAlarms;i++) {
			var gralSystemAlarmMask = 0;
			//GLOBAL
			for (var k=0; k<24; k++) {
				if (this.generalSystemAlarm[i][0][k]) gralSystemAlarmMask |= 1<<k;
			}
			cfg += hexformat(gralSystemAlarmMask & 0xff,2);
			cfg += hexformat((gralSystemAlarmMask & 0xff00)>>8,2);
			cfg += hexformat((gralSystemAlarmMask & 0xff0000)>>16,2);
			if (!this.isExp){
			//BAND
				gralSystemAlarmMask = 0;
				for (var k=0; k<16; k++) {
					if (this.generalSystemAlarm[i][1][k]) gralSystemAlarmMask |= 1<<k;
				}
				cfg += hexformat(gralSystemAlarmMask & 0xff,2);
				cfg += hexformat((gralSystemAlarmMask & 0xff00)>>8,2);
			}
			//BBU
			gralSystemAlarmMask = 0;
			for (var k=0; k<16; k++) {
				if (this.generalSystemAlarm[i][2][k]) gralSystemAlarmMask |= 1<<k;
			}
			cfg += hexformat(gralSystemAlarmMask & 0xff,2);
			cfg += hexformat((gralSystemAlarmMask & 0xff00)>>8,2);
		}
		//BUZZER
		mask = (this.buzzerMuteTime>>16) & 0x7fff; 
		if (this.buzzerMuteCommand) mask|=0x8000;
		if (mask<0) mask+=65536;
		cfg += hexformat(mask,4);
		mask = this.buzzerMuteTime & 0xffff; if (mask<0) mask+=65536;
		cfg += hexformat(mask,4);
		//ALARM THRESHOLDS
		var m = (!this.isRemote ? 0 : 1);
		var nAlarmTh = !this.isRemote ? this.alarmThrshItems : 5;
		for (var k = 0; k < nAlarmTh; k++) { //first 5, other 2 are read in pla section
			var v = this.alarmThrshData[k].valueThr;
			if (v < this.alarmThrshLimits[m][k].min) {
				v = this.alarmThrshLimits[m][k].min;
			} else if (v > this.alarmThrshLimits[m][k].max) {
				v = this.alarmThrshLimits[m][k].max;
			}
			if (v < 0) {
				v += 256;
			}
			cfg += hexformat(v, 2);
			var v = Math.round(this.alarmThrshData[k].hysteresis*2)/2;
			if (v < this.alrmThrshHystLimits.min) {
				v = this.alrmThrshHystLimits.min;
			} else if (v > this.alrmThrshHystLimits.max) {
				v = this.alrmThrshHystLimits.max;
			}
			v = Math.round(this.alarmThrshData[k].hysteresis*2);
			cfg += hexformat(v, 2);
		}
		return cfg;
	}
	this.getFrmOtherConf = function(factory){
		var res;
		var mask = 0;
		var cfg = "";
		if (this.isMaster){
			//CONTROL CHANNEL
			for (var b=0;b<2;b++){
				res=this.controlChannel[b]; if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
			//AUTO UL PA OFF
			cfg += hexformat(this.autoUlPaOffTimer,4);
			//AUTO UL POWER FUNCTION BASE STATION DATA
			for (var band=0;band<3;band++){
				res = double_to_uint(this.base_station_power[band]);
				cfg += hexformat(res,4);
				res = double_to_uint(this.base_station_sensitivity[band]);
				cfg += hexformat(res,4);
			}
		}
		if (this.isRemote){
			//DELAY COMPENSATION
			for (var port = 0; port < 2; port++) {
				for (var k = 0; k < 2; k++) {
					var delay = this.FOgroupDelay[port][k];
					if (delay < 0) delay=0;
					var max = this.getDelayMax();
					if (delay > max) delay=max;
					cfg += hexformat(Math.round(delay*10), 4);
				}
			}
			//PATH LOSS ANALYZER
			//PLA EN + MEAS + DELAY ENABLE
			mask = 0;
			if (this.plaEn) mask|=0x1;
			if (this.forcePlaMeas) mask|=0x2;
			if (this.FOgroupDelayEnable) mask|=0x4;
			cfg += hexformat(mask,2);
			//PLA FSTART
			res =~~Math.round((this.fstartHzPlaFilter-factory.fref[2*factory.plaBand+1])/factory.fstepAdj);if (res<0) res+=65536;
			cfg += hexformat(res,4);
			//PLA FSTOP
			res =~~Math.round((this.fstopHzPlaFilter-factory.fref[2*factory.plaBand+1])/factory.fstepAdj);if (res<0) res+=65536;
			cfg += hexformat(res,4);
			//PLA PERIOD
			cfg += hexformat(this.plaMeasPeriod, 4);
			var m = (this.isMaster ? 0 : 1);
			//PLA ALARM THRESHOLDS 
			for (var k = 5; k < this.alarmThrshItems; k++) {
				var v = this.alarmThrshData[k].valueThr;
				if (v < this.alarmThrshLimits[m][k].min) {
					v = this.alarmThrshLimits[m][k].min;
				} else if (v > this.alarmThrshLimits[m][k].max) {
					v = this.alarmThrshLimits[m][k].max;
				}
				if (v < 0) {
					v += 256;
				}
				cfg += hexformat(v, 2);
				var v = Math.round(this.alarmThrshData[k].hysteresis*2)/2;
				if (v < this.alrmThrshHystLimits.min) {
					v = this.alrmThrshHystLimits.min;
				} else if (v > this.alrmThrshHystLimits.max) {
					v = this.alrmThrshHystLimits.max;
				}
				v = Math.round(this.alarmThrshData[k].hysteresis*2);
				cfg += hexformat(v, 2);
			}
		}
		//EXTERNAL INPUT NAMES
		for (var k=0;k<4;k++){
			var aux = this.alarmNames[0][8+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		//ANNUNCIATOR NAMES
		for (var k=0;k<4;k++){ 
			var aux = this.alarmNamesBbu[12+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		return cfg;
	}
	this.computeBWFromIndex = function(index){
		var bw;
		if (index<=0) bw=150;
		else if (index==1)	bw=100;
		else if (index==2) bw=75;
		else if (index==3) bw=62.5;
		else if (index==4) bw=50;
		else if (index==5) bw=37.5;
		else if (index==6) bw=25;
		else bw=12.5;
		return bw;
	}
	this.saveFrameStr = function(sr) {
		localStorage.setItem("Conf_"+this.Nr+"_"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("Conf_"+this.Nr+"_"+Prjstr+window.location.host);
	}
	this.getFrmBuzzerMuteCommand = function() {
		// this function can be used if a button is implemented for muting the buzzer
		this.buzzerMuteCommand = 1;
		return this.getFrm();
	}
	this.isRelayAssignNormalACpowerExclusive = function(relayNr) {
		if (!(relayNr<12)) {
			return false;
		}
		if (this.isRemote && !this.supportsBBU()){ //remotes legacy
			return false;
		}
		// NormalACPower = BBU alarm num #0 
		if (!this.relayAssignBbuAlarm[0][relayNr]) {
			return false;
		}
		var alarmsToConsider=[];
		for (var k=0;k<(!this.isRemote?24:16);k++){ //max: 24 alarms in master/expansion, 16 in remote
			var en = k!=15; //alarm[15] do not exist in any device
			en = en && !(!this.isRemote && (k==6||k==7)); //fiber optic 1/2 on master/expansion
			en = en && !(this.isRemote && !this.supportsBBU() && (k==13||k==14)); // gen sys alarm 2 and 3 in legacy remotes
			alarmsToConsider.push(en);
		}
		// if relaNr is also assigned to other alarm, then it is not "Normal AC Power" exclusive
		for (var k=0;k<alarmsToConsider.length;k++){
			if (alarmsToConsider[k] && this.relayAssignGlobalAlarm[k][relayNr]) {
				return false;
			}
		}
		if (!this.isExp){
			var alarmsToConsider=[];
			for (var k=0;k<11;k++){ //max: 10 alarms in master, 8 in remote
				var en = !(this.isRemote && (k==1||k==5||k==8||k==9)); //overload DL, Rx Power Low, UL PA Fail and antenna disconnection do not exist in remotes
				en = en && !(this.isRemote && k==10 && !this.supportsFlex2()); //C/N not considered in remotes without this feature
				alarmsToConsider.push(en);
			}
			for (var k=0;k<this.bandAlarmsEnabled[0].length;k++){
				if (alarmsToConsider[k] && this.relayAssignBandAlarm[k][relayNr]) {
					return false;
				}
			}
		}
		for (var k=1;k<13;k++){	// skip alarm num 0, "Normal AC Power", individual annunciators are not considered
			if (this.bbuAlarmsEnabled[k] && this.relayAssignBbuAlarm[k][relayNr]) {
				return false;
			}
		}
		return true;
	}
	this.supportsBBU = function() {
		return (!this.isRemote || this.device_version_index > 0);
	}
	this.supportsFlex2 = function(){
		return (this.device_version_index > 1);
	}
	this.genConfigFilterULFromDL = function(cnfM, factM, cnfBR){ //to be used with arguments: cnfM = config Master, factM = factory Master, cnfBR = basic config remote containing relevant factory parameters(fstart,fstep)
		var b,c;
		this.firstADJisFirstNet = cnfM.firstADJisFirstNet;
		for (b=0;b<2;b++){
			this.allChSameBW[b][0] = cnfM.allChSameBW[b][1];
			this.numberOfFilterNonGrouped[b][0] = cnfM.numberOfFilterNonGrouped[b][1];
			for (c=0;c<this.CHNR;c++){
				this.filterEnabled[0][b][0][c] = cnfM.filterEnabled[0][b][1][c];
				this.isFilterGrouped[b][0][c] = cnfM.isFilterGrouped[b][1][c];
				this.bwKHz[b][0][c] = cnfM.bwKHz[b][1][c];
				this.bwIndex[b][0][c] = cnfM.bwIndex[b][1][c];
				this.freqHz[b][0][c] = cnfM.freqHz[b][1][c]-factM.fstart[2*b+1]+cnfBR.fstart[b];
				this.fineGainFilter[0][b][0][c] = cnfM.fineGainFilter[0][b][1][c]; 
			}
			for (c=0;c<this.ADJNR;c++){
				this.filterEnabled[1][b][0][c] = cnfM.filterEnabled[1][b][1][c];
				this.fstartHzAdjFilter[b][0][c] = cnfM.fstartHzAdjFilter[b][1][c]-factM.fstart[2*b+1]+cnfBR.fstart[b];
				this.fstopHzAdjFilter[b][0][c] = cnfM.fstopHzAdjFilter[b][1][c]-factM.fstart[2*b+1]+cnfBR.fstart[b];
				this.fineGainFilter[1][b][0][c] = cnfM.fineGainFilter[1][b][1][c];
			}
		}
	}
	this.genConfigFilterDLFromUL = function(cnfR, factM, cnfBR, b){
		//cnfR = config Remote
		//factM = factory Master
		//cnfBR = basic config remote containing relevant factory parameters(fstart,fstep)
		//b = band
		var c;
		this.firstADJisFirstNet = cnfR.firstADJisFirstNet;
		this.allChSameBW[b][1] = cnfR.allChSameBW[b][0];
		this.numberOfFilterNonGrouped[b][1] = cnfR.numberOfFilterNonGrouped[b][0];
		for (c=0;c<this.CHNR;c++){
			this.filterEnabled[0][b][1][c] = cnfR.filterEnabled[0][b][0][c];
			this.isFilterGrouped[b][1][c] = cnfR.isFilterGrouped[b][0][c];
			this.bwKHz[b][1][c] = cnfR.bwKHz[b][0][c];
			this.bwIndex[b][1][c] = cnfR.bwIndex[b][0][c];
			this.freqHz[b][1][c] = cnfR.freqHz[b][0][c]-cnfBR.fstart[b]+factM.fstart[2*b+1];
			this.fineGainFilter[0][b][1][c] = cnfR.fineGainFilter[0][b][0][c]; 
		}
		for (c=0;c<this.ADJNR;c++){
			this.filterEnabled[1][b][1][c] = cnfR.filterEnabled[1][b][0][c];
			this.fstartHzAdjFilter[b][1][c] = cnfR.fstartHzAdjFilter[b][0][c]-cnfBR.fstart[b]+factM.fstart[2*b+1];
			this.fstopHzAdjFilter[b][1][c] = cnfR.fstopHzAdjFilter[b][0][c]-cnfBR.fstart[b]+factM.fstart[2*b+1];
			this.fineGainFilter[1][b][1][c] = cnfR.fineGainFilter[1][b][0][c];
		}

	}
	this.getFrmFilterWithBasicConfig = function(factM, cnfBR){
		//factM = factory Master
		//cnfBR = basic config remote containing relevant factory parameters(fstart,fstep)
		var k;
		var fact = new Factory();
		//set relevant factory fields: commonUl, fref, fstep, fstepAdj
		fact.commonUl = factM.commonUl; //from master
		for (k=0;k<4;k++) fact.fref[k] = factM.fref[k]; //from master
		fact.fstep = cnfBR.fstep; //from remote
		fact.fstepAdj = factM.fstepAdj; //from master
		return this.getFrmFilter(fact);
	}
	this.parseFilterWithBasicConfig = function(s, factM, cnfBR){//factM = factory Master, cnfBR = basic config remote containing relevant factory parameters(fstart,fstep)
		var k;
		var fact = new Factory();
		//set relevant factory fields: commonUl, fref, fstep, fstepAdj
		fact.commonUl = factM.commonUl; //from master
		for (k=0;k<4;k++) fact.fref[k] = factM.fref[k]; //from master
		fact.fstep = cnfBR.fstep; //from remote
		fact.fstepAdj = factM.fstepAdj; //from master
		this.parseFilter(s, 0, fact);
	}
}
function BasicConf(remoteNr){
	//only considered parameters for DAS Overview GUI
	this.Nr							= remoteNr;
	this.isRemote					= (this.Nr & 0xff)!=0;
	this.isExp						= !this.isRemote;
	this.device_version_index 		= 0;
	this.paEnabled					= [[false,false],[false,false]]; //band0/1 ul/dl [2][2]
	this.forcePaOn					= [[false,false],[false,false]]; //band0/1 ul/dl [2][2]
	this.forcePaOff					= [[false,false],[false,false]]; //band0/1 ul/dl [2][2]
	this.bbu_serial_mode = false;
	this.bbu_type;
	this.bbu_dismiss_deep_discharge;
	this.globalAlarmsEnabled	= []; //24 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //24 --> 1boolean/alarm ---
	this.bandAlarmsEnabled		= []; //2x16 --> 1boolean/alarm ---
	this.bandAlarmsInstalled	= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsInstalled		= []; //16 --> 1boolean/alarm ---
	this.FOgroupDelayEnable		= false;
	this.FOgroupDelay 			= [0,0]; //ul/dl only fiber connected to the own master
	this.att					= [[0,0],[0,0]]; //band0/1 ul/dl
	this.chBandEnabled			= [false,false];
	this.adjBandEnabled			= [false,false];
	this.oscFeatureEnable		= false;
	this.plaEn 					= false;
	this.powerlimit				= [0,0]; //band0/1
	this.fstart					= [0,0]; //band0/1
	this.fstep					= 0;
	this.fref_4MHz				= [0,0]; //fref UL band0/1 in 4MHz steps
	this.tag					= "";
	this.version 				= new Version();
	this.serNr					= new SerialNrT();

	for (var k=0;k<24;k++){
		this.globalAlarmsEnabled.push(false);
		this.globalAlarmsInstalled.push(false);
	}
	for (var k=0;k<16;k++){
		this.bandAlarmsEnabled.push(false);
		this.bandAlarmsInstalled.push(false);
		this.bbuAlarmsEnabled.push(false);
		this.bbuAlarmsInstalled.push(false);
	}
	this.parse = function(s){
		if (s.length<(this.isExp?expBasicGlobalConfigLength:remoteBasicGlobalConfigLength)) return -1;
		var i,b,k;
		var res;
		var ind = 0;
		this.device_version_index = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		if (this.isRemote){
			for (b=0;b<2;b++){ //Band0/1
				for (i=0;i<2;i++){//UL/DL
					//PA Enabled
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					this.paEnabled[b][i] = (res & 0x80)!=0;
					this.forcePaOn[b][i] = false;
					this.forcePaOff[b][i] = false;	
				}
			}
		}
		//BBU
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		this.bbu_serial_mode = (res & 0x01);
		this.bbu_type = ((res >> 1) & 0x07);
		this.bbu_dismiss_deep_discharge = false;	// write-only
		this.FOgroupDelayEnable = (res & 0x20)!=0;
		//GLOBAL ALARM ENABLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;

		for (k=0;k<24;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if ( k < 6 ) {
				this.globalAlarmsInstalled[k] = true;
			} else if ( k >= 6 && k < 13 ) {
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		for (k = 13; k < 15; k++) {		// general system alarm 2 & 3
			if (this.isExp || this.device_version_index > 0) {			// for expansion and remotes>=BBU MVO2
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];	// installed if enabled
			}
		}
		if (this.isRemote){
			//BAND ALARM ENABLED BAND0/COMMON
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (k=0;k<16;k++){
				this.bandAlarmsEnabled[0][k] = (res & (1<<k))!=0;
				this.bandAlarmsInstalled[k] = (k<11); //Forced available first 11
			}
			if (this.device_version_index < 2){ //C/N alarm not installed if remote is not flex2.0
				this.bandAlarmsInstalled[10] = false;
				this.bandAlarmsEnabled[0][10] = false;
			}
			this.bandAlarmsInstalled[1] = false;//no Overload DL
			this.bandAlarmsInstalled[5] = false;//no Rx Low Power
			this.bandAlarmsInstalled[8] = false;//no UL PA Fail
			this.bandAlarmsInstalled[9] = false;//no Antenna Disconnection
		}
		//BBU ALARM ENABLED/INSTALLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (k=0;k<16;k++){
			this.bbuAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k<12) {
				this.bbuAlarmsInstalled[k] = !this.isRemote || this.device_version_index>0;//only false if remote does not supports BBU
			} else if (k>11) {
				this.bbuAlarmsInstalled[k] = (res2 & (1<<k))!=0;
			}
		}
		if (this.isRemote){
			//DELAYS
			ind=212;
			for (k = 0; k < 2; k++) {
				res = parseInt(s.substr(ind,4), 16); ind+=4;
				this.FOgroupDelay[k] = res / 10;
			}
			//ATT
			for (var band=0;band<2;band++){
				for (var b=0;b<2;b++){
					this.att[band][b] = parseInt(s.substr(ind,2), 16); ind+=2;
				}
			}
			//FACTORY
			ind=252;
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (i=0;i<2;i++){
				this.chBandEnabled[i] = (res & (1<<(2*i)))!=0;
				this.adjBandEnabled[i] = (res & (1<<(2*i+1)))!=0;
			}
			this.oscFeatureEnable = (res & 0x10)!=0;
			this.plaEn = (res & 0x20)!=0;
			for (i=0;i<2;i++){this.powerlimit[2*b+i] = cSignedByte(parseInt(s.substring(ind, ind+2), 16)); ind+=2;}
			for (i=0;i<2;i++){this.fstart[i] = parseInt(s.substring(ind, ind+8), 16); ind+=8;}
			this.fstep = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			for (i=0;i<2;i++){this.fref_4MHz[i] = parseInt(s.substring(ind, ind+2), 16); ind+=2;}
		}else{
			ind = 148;
		}
		//SERIAL
		this.serNr.parse(s.substring(ind,ind+15));ind+=15;
		//TAG
		this.tag = s.substring(ind,ind+30);ind+=30;
		//VERSION
		this.version.parse(s.substring(ind,ind+16));ind+=16;
		
		//forcing installed:
		this.globalAlarmsInstalled[4] = this.isRemote && this.plaEn; //path loss1 alarm not installed if not available and enabled
		this.globalAlarmsInstalled[5] = this.isRemote && this.plaEn; //path loss2 alarm not installed if not available and enabled
		this.globalAlarmsInstalled[2] = this.isRemote && this.oscFeatureEnable; //ant. isol  not installed if opf not enabled
		this.globalAlarmsInstalled[3] = this.isRemote && this.oscFeatureEnable; //osc detect not installed if opf not enabled

		this.supportsBBU = function() {
			return (!this.isRemote || this.device_version_index > 0);
		}

		this.getDelayMax = function(){
			return (this.device_version_index > 1 ? 400:200); //delay max was increased to 400 us in Flex2.0
		}

	}
}
function overallConfigToTextFile(config, factory, tagstr, ethstr, serial, version, nr){
	var cfg = "";
	var i1 = nr & 0xff; var i2 = nr>>8 & 0xff;
	if (nr==0)
		type=0;//master
	else if (i1==0)
		type=2;//expansion
	else
		type=1;//remote
	cfg += "TAG: " + tagstr.trim() + "\n\n";
	cfg += rfConfigToText(config,factory, type);
	if (type==1) {//remote
		cfg += fiberConfigToText(config) + "\n";
		if (factory.plaAvailable) cfg += pathLossConfigToText(config, factory)+ "\n";
	} else {//master or exp
		cfg += fiberConfigToTextMasterExp(config) + "\n";
	}
	cfg += alarmSettingsToText(config,factory,version, type) + "\n";
	if (type==0 && !factory.ethernetModuleNotInstalled){//only master IP config 
		cfg += ethConfigToText(ethstr)+ "\n";
	}
	cfg += versionToText(version,factory) + "\n";
	cfg += "SERIAL: " + serial + "\n";
	return cfg;
}
function versionToText(version,factory){
	var cfg = "";
	cfg += "VERSION:\n";
	cfg += "\tFPGA: " + version.fwStr + "\n";
	cfg += "\tuC: " + version.swStr + "\n";
	if ( !factory.ethernetModuleNotInstalled ) {
		cfg += "\tETH: " + version.ethStr + "\n";
	}
	return cfg;
}
function ethConfigToText(s){
	var cfg = "";
	var ethData = [];
	var ind=0;
	for (i=0;i<5;i++){
		ethData.push("");
		for (j=0;j<4;j++){
			ethData[i]+= parseInt(s.substr(ind,2),16);
			if (j<3) ethData[i]+=".";
			ind+=2;
		}
	}
	cfg+="IP CONFIG:\n";
	cfg+="\tIP Adress: " + ethData[0] + "\n";
	cfg+="\tNetwork Mask: " + ethData[1] + "\n";
	cfg+="\tGateway: " + ethData[2] + "\n";
	cfg+="\tSNMP Manager Address: " + ethData[3] + ", " + ethData[4] + "\n";
	
	ethData = s.substring(ind,s.length).split("\t");
	
	cfg+="\tSNMP Manager Enable: " + boolToYN((parseInt(ethData[12],16) & 0x1)!=0) + ", ";
	cfg+= boolToYN((parseInt(ethData[13],16) & 0x1)!=0) + "\n";
	cfg+="\tRead-Only Community: " + ethData[1].trim() + "\n";
	cfg+="\tRead-Write Community: " + ethData[2].trim() + "\n";
	cfg+="\tTrap Community: " + ethData[3].trim() + ", " + ethData[4].trim() + "\n";
	cfg+="\tTrap Port: " + (parseInt(ethData[5],16)) + ", ";
	cfg+= (parseInt(ethData[6],16)) + "\n";
	cfg+="\tTrap Repetition: " + (parseInt(ethData[10],16)) + ", ";
	cfg+= (parseInt(ethData[11],16)) + "\n";
	cfg+="\tKeep Alive Period (minutes): " + (parseInt(ethData[8],16)) + ", ";
	cfg+= (parseInt(ethData[9],16)) + "\n";
	cfg+="\tWatchdog Period (minutes): " + (parseInt(ethData[7],16)) + "\n";
	return cfg;
}
function alarmSettingsToText(config,factory,version, type){
	var j,k;
	var exist_el;
	var cfg = "";
	var gralAlarmNames = ["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","Path Loss 1","Path Loss 2","Fiber Optic 1","Fiber Optic 2","","","","",
						  "General System Alarm 1", "General System Alarm 2", "General System Alarm 3"];
	var bandAlarmNames = ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","RxPower Low / Donor Antenna", "DL AGC Fail","DL Output Power","UL PA Fail","Antenna Disconnection","C/N UL Low"];
	var bbuAlarmNames = ["Normal AC Power","Loss Normal AC Power","Battery Capacity < 30%","Battery Charger Fail","BBU Communication Error","Charger Temperature","Battery Temperature","Individual Battery Voltage",
							 "Battery Disconnection","System Voltage","Battery Bank Voltage","Battery Deep Discharge","Annunciator 1","Annunciator 2","Annunciator 3","Annunciator 4"];
		cfg+="ALARM/RELAY SETTINGS:\n";
	for (k=0;k<15;k++){
		if (k>=8 && k<12) continue; //se excluyen external inputs, pero se quiere recorrer hasta 12, que es "Other Remotes Alarms"
		if ((type!=1 || (type==1 && (!factory.plaAvailable || !config.plaEn))) && (k==4 || k==5)) continue;//path loss only for remotes with path loss available and enabled
		if (type!=1 && (k==6 || k==7)) continue; //master and exp fiber alarms shown in nex section
		if (type!=1 && (k>=2 && k<6)) continue; //master and exp don't have ant isol/osc detect/path loss
		if (type==0 && (k==2 || k==3)) config.globalAlarmsEnabled[k] = false; //en master Antenna Isolation + Oscillation Detection se fuerzan a false
		cfg+="\tAlarm Enable " + gralAlarmNames[k] + ": " + boolToYN(config.globalAlarmsEnabled[k]) + "\n";
	}
	//Master and exp fiber alarmss
	if (type!=1){
		for (k=0;k<8;k++){
			cfg+="\tAlarm Enable Fiber Optic "+(k+1)+": " + boolToYN(config.globalAlarmsEnabled[k+16]) + "\n";
		}
	}
	if (type!=2){//expansion doesn't have band alarms
		for (k=0;k<11;k++){
			if ((k==1 || k==5 || k==8 || k==9) && type==1) continue; //remote doesn't have overload DL, rx pwoer low, ul pa fail, ant disconnection
			if (type==0 && k!=1 && k!=5 && k!=8 && k!=9) continue; //master only has overload DL, rx power low, ul pa fail, ant disconnection
			if (type==0 && (k==5 || k==9)){ //exception for master ant.disconnection and rx power low
				for (var b=0;b<2;b++){
					if (factory.chBandEnabled[b] || factory.adjBandEnabled[b]){
						cfg+="\tAlarm Enable " + bandAlarmNames[k] + " " + factory.bandNames[b] + ": " + boolToYN(config.bandAlarmsEnabled[b][k]) + "\n";
					}
				}
			}else
				cfg+="\tAlarm Enable " + bandAlarmNames[k] + ": " + boolToYN(config.bandAlarmsEnabled[0][k]) + "\n";
		}
	}
	var bbuSerialMode = isBbuSerialMode(config);
	var nrOfRelaysSupported = getNrOfRelaysSupported(config, type!=1?0:1, version);
	if (bbuSerialMode) {
		for (k=0;k<12;k++) {
			if (bbuAlarmNames[k].length == 0) continue;
			cfg+="\tAlarm Enable " + bbuAlarmNames[k] + ": " + boolToYN(config.bbuAlarmsEnabled[k]) + "\n";
		}
		for (k=12; k < 16;k++) {
			cfg+="\t" + bbuAlarmNames[k] + " Installed" + ": " + boolToYN(config.bbuAlarmsInstalled[k]) + "\n";	// annunciator installed
		}
	}
	if (type==0 && config.relayAssignPolicy < relayAssignPolicies.length) { //only master
		cfg+="\tRelay Assignment policy: " + (relayAssignPolicies[config.relayAssignPolicy].text) + "\n";
	}
					
	for (k=0;k<15;k++){
		if (k>=8 && k<12) continue; //se excluyen external inputs, pero se quiere recorrer hasta 12, que es "Other Remotes Alarms"
		if (type==2 && (k==2 || k==3)) continue; //expansion doesn't have ant isolation and osc detection
		if ((type==2 || (type==1 && (!factory.plaAvailable || !config.plaEn))) && (k==4 || k==5)) continue;//path loss only for masters and remotes with path loss available and enabled
		if (type!=1 && (k==6 || k==7)) continue; //master and exp fiber alarms shown in nex section
		cfg+="\tRelay Assigned " + gralAlarmNames[k] + ": ";
		exist_el = false;
		for (j=0;j<nrOfRelaysSupported;j++){
			if (config.relayAssignGlobalAlarm[k][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	//Master and exp fiber alarmss
	if (type!=1){
		for (k=0;k<8;k++){
			cfg+="\tRelay Assigned Fiber Optic "+(k+1)+": ";
			exist_el = false;
			for (j=0;j<nrOfRelaysSupported;j++){
				if (config.relayAssignGlobalAlarm[k+16][j]){
					cfg+=(j+1)+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	// no se reportan relay assign de alarmas de fibra previsto para das centric
	if (type!=2){//expansion doesn't have band alarms
		for (k=0;k<11;k++){
			if ((k==1 || k==5 || k==8 || k==9) && type==1) continue; //remote doesn't have overload DL, rx pwoer low, ul pa fail, ant disconnection
			cfg+="\tRelay Assigned " + bandAlarmNames[k] + ": ";
			exist_el = false;
			for (j=0;j<nrOfRelaysSupported;j++){
				// no se reportan relay assign de alarmas del segundo byte de banda previsto para V/U
				if (config.relayAssignBandAlarm[k][j]){
					cfg+=(j+1)+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	if (type==0 || bbuSerialMode) { //master always prints BBU alarms relay assignment
		for (k=0;k<13;k++){
			exist_el = false;
			cfg+="\tRelay Assigned " + (k < 12?bbuAlarmNames[k]:"Annunciators") + ": ";
			for (j=0;j<nrOfRelaysSupported;j++){
				if (config.relayAssignBbuAlarm[k][j]){
					cfg+=(j+1)+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	if (bbuSerialMode) {
		cfg+="\tRelay Status On Alarm: All Closed\n";
	} else {
		cfg+="\tRelay Status On Alarm: ";
		for (k=0;k<nrOfRelaysSupported;k++){
			cfg+=config.relayLogicConfigNormal[k]?"Open":"Closed"+ ", ";
		}
		cfg = cfg.substring(0,cfg.length-2);cfg+="\n";
	}

	cfg+="\tRelay Delay Enable: ";
	for (j=0;j<nrOfRelaysSupported;j++) cfg+=boolToYN(config.delayTimerON[j])+", ";
	cfg = cfg.substring(0,cfg.length-2);cfg+="\n";
	cfg+="\tRelay Delay Timer (seconds): ";
	for (j=0;j<nrOfRelaysSupported;j++) cfg+=config.delayTimer[j]+", ";
	cfg = cfg.substring(0,cfg.length-2);cfg+="\n";
	cfg+="\tRelay Latch Enable: ";
	for (j=0;j<nrOfRelaysSupported;j++) cfg+=boolToYN(config.latchTimerON[j])+", ";
	cfg = cfg.substring(0,cfg.length-2);cfg+="\n";
	cfg+="\tRelay Latch Timer (seconds): ";
	for (j=0;j<nrOfRelaysSupported;j++) cfg+=config.latchTimer[j]+", ";
	cfg = cfg.substring(0,cfg.length-2);cfg+="\n";

	var nUserAlarm = type==2?3:4;//in expansion 4th ext input (RF OFF) is not considered
	cfg+="\tUser Alarm Enable: ";
	for (k=0;k<nUserAlarm;k++)
		cfg+=boolToYN(config.globalAlarmsEnabled[8+k])+", ";		
	cfg = cfg.substring(0,cfg.length-2)+"\n";	
	cfg+="\tUser Alarm Name: ";
	for (k=0;k<nUserAlarm;k++)
		cfg+=config.alarmNames[0][8+k].trim()+", ";
	cfg = cfg.substring(0,cfg.length-2)+"\n";		
	cfg+="\tUser Alarm Polarity: ";
	for (k=0;k<nUserAlarm;k++)
		cfg+=(config.externalAlarmPolarity[k]?"HIGH":"LOW")+", ";	
	cfg = cfg.substring(0,cfg.length-2)+"\n";
	for (k=0;k<nUserAlarm;k++){
		cfg+="\tRelay Assigned User Alarm " + (k+1) + ": ";
		exist_el = false;
		for (j=0;j<nrOfRelaysSupported;j++){
			if (config.relayAssignGlobalAlarm[k+8][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";			
	}
	if (bbuSerialMode) {
		cfg+="\tAnnunciator Tag Name: ";
		for (k=0;k<4;k++)
			cfg+=config.alarmNamesBbu[12+k].trim()+", ";
		cfg = cfg.substring(0,cfg.length-2)+"\n";
		cfg+="\tBuzzer Mute Time (seconds): "+config.buzzerMuteTime+ "\n";
	}

	for (k=0;k<15;k++){
		if ((k>=8 && k<=14) || (type!=1 && (k>=2 && k<6))) continue; //se excluyen external inputs y General System Alarm siempre, Ant Isol/Osc Det/Path Loss in master
		if (type!=1 && (k==6 || k==7)) continue; //master and exp fiber alarms shown in nex section
		cfg+="\t"+gralAlarmNames[k] + " Assigned to General System Alarm: ";
		exist_el = false;
		for (var i = 0; i < NrOfGralSystemAlarms; i++) {
			if (config.generalSystemAlarm[i][0][k]){
				cfg+=(i+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	//Master and exp fiber alarmss
	if (type!=1){
		for (k=0;k<8;k++){
			cfg+="\tFiber Optic " + (k+1) + " Assigned to General System Alarm: ";
			exist_el = false;
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				if (config.generalSystemAlarm[i][0][k+16]){
					cfg+=(i+1)+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	if (type!=2){//expansion doesn't have band alarms
		for (k=0;k<11;k++){
			if ((k==1 || k==5 || k==8 || k==9) && type==1) continue; //remote doesn't have overload DL, rx pwoer low, ul pa fail, ant disconnection
			if (type==0 && k!=1 && k!=5 && k!=8 && k!=9) continue; //master only has overload DL, rx power low, ul pa fail, ant disconnection
			cfg+="\t"+bandAlarmNames[k] + " Assigned to General System Alarm: ";
			exist_el = false;
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				if (config.generalSystemAlarm[i][1][k]){
					cfg+=(i+1)+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	for (k=0;k<nUserAlarm;k++){
		cfg+="\tUser Alarm " + (k+1) + " Assigned to General System Alarm: ";
		exist_el = false;
		for (var i = 0; i < NrOfGralSystemAlarms; i++) {
			if (config.generalSystemAlarm[i][0][8+k]){
				cfg+=(i+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	if (bbuSerialMode) {
		for (k=0;k<12;k++){
			cfg+="\t"+bbuAlarmNames[k] + " Assigned to General System Alarm: ";
			exist_el = false;
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				if (config.generalSystemAlarm[i][2][k]){
					cfg+=(i+1)+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
		for (k=0;k<4;k++){
		cfg+="\tAnnunciator Alarm " + (k+1) + " Assigned to General System Alarm: ";
		exist_el = false;
		for (var i = 0; i < NrOfGralSystemAlarms; i++) {
			if (config.generalSystemAlarm[i][2][12+k]){
				cfg+=(i+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		}
	}
	return cfg;
}
function rfConfigToText(config, factory, type){
	var i;
	var cfg = "";
	cfg += rfConfigGeneralAlarmToText(config, factory, type)+"\n";
	if (type!=2){//expansion doesn't have RF info
		for (i=0;i<2;i++){
			if (factory.chBandEnabled[i] || factory.adjBandEnabled[i]){
				cfg += "CONFIG "+factory.bandNames[i]+"\n";
				//General
				cfg += rfConfigGeneralBandToText(config, factory, i, type);
				//Narrow Filters
				cfg += rfConfigNarrowBandFiltersToText(config, factory, i, type);
				//ADJBW Filters
				cfg += rfConfigAdjBwFiltersToText(config, factory, i, type);
				//RF Alarm Settings
				cfg += rfConfigAlarmToText(config, factory, i, type)+"\n";
			}
		}
	}
	return cfg;
}
function rfConfigGeneralAlarmToText(config, factory, type){
	var cfg = "";
	var exist_el;
	cfg+="CONFIG GENERAL:\n";
	cfg+="\tType of BBU Connection: " + (config.bbu_serial_mode?"Serial":"Dry Contacts") + "\n";
	if (type==1){ //only for remotes
		cfg+="\tOscillation Delay Threshold (seconds): " + config.oscTimeThSeconds[0] + "\n";
		cfg+="\tAction After Oscillation Alarm: ";
		if (config.oscActionAfterAlarm[0]==0)
			cfg+="Automatic Shut Down\n";
		else if (config.oscActionAfterAlarm[0]==1)
			cfg+="Run Isolation Meas.\n";
		else
			cfg+="Only Alarm\n";
		cfg+="\tRetry Timer After Automatic PA OFF (hours): " + config.oscRetryTimeHours[0] + "\n";
		cfg+="\tExtreme Temperature Action: ";
		if (config.extremeTempAction==0)
			cfg+="No Action\n";
		else if (config.extremeTempAction==1)
			cfg+="Reduce 6dB DL Power\n";
		else
			cfg+="PA Off\n";
		cfg+="\tC/N UL Low Alarm Time Threshold (seconds): " + config.cnAlarmTime + "\n";
	}else if (type==0){ //only for master
		cfg+="\tAutomatic UL PA OFF Timer (minutes): " + config.autoUlPaOffTimer + "\n";
		//Master mode
		cfg+="\tMaster Mode: " + masterModeText(config.masterMode) + "\n";
		if (config.masterMode==2){//Automatic mode
			//Alarms considered to switch
			cfg+="\tAlarms considered for master priority switch: ";
			var alNames = ["HW Fail","High Temp","UL PA Fail","Antenna Disconnection","Overload DL","Rx Power Low"];
			exist_el = false;
			for (var k=0;k<2;k++){
				if (config.masterModeAlarmEnables[k]){
					cfg+=alNames[k]+", ";
					exist_el = true;
				}
			}
			for (var k=0;k<4;k++){
				for (var j=0;j<2;j++){
					if ((factory.chBandEnabled[j] || factory.adjBandEnabled[j]) && config.masterModeAlarmEnables[2+k*2+j]){
						cfg+=alNames[2+k]+" "+factory.bandNames[j]+", ";
						exist_el = true;
					}
				}
			}
			for (var k=0;k<3;k++){
				if (config.masterModeAlarmEnables[10+k]){
					cfg+=config.alarmNames[0][8+k]+", ";
					exist_el = true;
				}
			}
			for (var k=0;k<3;k++){		// general system alarm 1, 2 & 3
				if (config.masterModeAlarmEnables[13+k]){
					cfg+=config.alarmNames[0][12+k]+", ";
					exist_el = true;
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
		//Force RF OFF and Force Gen Sys Alarms
		cfg+="\tForce RF OFF: " + boolToYN(config.system_force_rf_off) + "\n";
		cfg+="\tForce General System Alarm: ";
		exist_el = false;
		for (var k=0;k<3;k++){
			if (config.forceSystemAlarm[k]){
				cfg+=(k+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	var m = (type!=1?0:1);
	var n = config.alarmThrshOrder[m].TEMPERATURE;
	cfg+="\tTemperature Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
	cfg+="\tTemperature Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
	return cfg;
}
function fiberConfigToText(config){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	cfg+="\tGroup Delay Adjust Enable: "+boolToYN(config.FOgroupDelayEnable)+"\n";
	for (var k = 0; k < 2; k++) {
		cfg+="\tOptical Port "+(k+1)+":\n";
		for (var i = 0; i < 2; i++) {
			var m = (i==0?"UL":"DL");
			cfg+="\t\tGroup Delay "+m+" (us): "+ config.FOgroupDelay[k][i] + "\n";
		}
		var n = (k==0 ? config.alarmThrshOrder[1].RX_POWER_FIBER_1 : config.alarmThrshOrder[1].RX_POWER_FIBER_2);
		cfg+="\t\tLoss Of Optical Signal Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tLoss Of Optical Signal Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}
function fiberConfigToTextMasterExp(config){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	for (var k = 0; k < 8; k++) {
		cfg+="\tOptical Port "+(k+1)+":\n";
		var n = config.alarmThrshOrder[0].RX_POWER_FIBER_1 + k;
		cfg+="\t\tLoss Of Optical Signal Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tLoss Of Optical Signal Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}
function pathLossConfigToText(config, factory){
	var cfg = "";
	cfg+="PATH LOSS ANALYZER:\n";
	cfg+="\tPath Loss Enabled: "+boolToYN(config.plaEn)+"\n";
	cfg+="\tPath Loss Meas Bandwidth (MHz): "+(config.fstartHzPlaFilter/1e6)+"-"+(config.fstopHzPlaFilter/1e6) + "\n";
	cfg+="\tPath Loss Meas Period (minutes): "+config.plaMeasPeriod+"\n";
	for (var k = 0; k < 2; k++) {
		cfg+="\tPath Loss Analyzer Threshold "+(k+1)+" (dBm): " + (config.alarmThrshData[k+5].valueThr) + "\n";
		cfg+="\tPath Loss Analyzer Hysteresis "+(k+1)+" (dB): " + (config.alarmThrshData[k+5].hysteresis) + "\n";
	}
	return cfg;
}
function rfConfigGeneralBandToText(config, factory, band, type){
	var j;
	var uldl = ["UL","DL"];
	var cfg = "";
	cfg+="\tGeneral\n";
	for (j=0;j<2;j++){
		var inout;
		if (type==0){
			inout = ["Output","Input"];
		} else {
			inout = ["Input","Output"];
		}
		if (j!=0 || type==1){
			cfg+="\t\t"+uldl[j]+" "+inout[j]+" Attenuation (dB): "+(config.att[band][j]) +"\n";
		}
	}
	for (j=0;j<2;j++){
		if (j==0 ^ type==0) cfg+="\t\tInput AGC per channel Composite Power Set " + uldl[j]+ " (dBm): " + (config.inputAgc[band][j])+"\n";
	}
	for (j=0;j<2;j++) cfg+="\t\tRF Enabled " + uldl[j]+ ": " + boolToYN(config.paEnabled[band][j])+"\n";
	if (type==0){
		cfg+="\t\tLinked UL/DL Frequencies: " + boolToYN(config.uldlLinkedFreq[band])+"\n";
		cfg+="\t\tUL Output Attenuation (dB): " + config.att[band][0] +"\n";
		cfg+="\t\tControl channel: ";
		if (config.controlChannel[band]==0)
			cfg+="Not Assigned\n";
		else if (config.controlChannel[band]<0)
			cfg+="Adj.Bw filter "+(-config.controlChannel[band])+"\n";
		else
			cfg+="Narrow band filter "+config.controlChannel[band]+"\n";
	}else{
		cfg+="\t\tAGC Mode: " + agcModeText(config.agcBandMode[band])+"\n";
	}
	return cfg;
}

function rfConfigNarrowBandFiltersToText(config, factory, band, type){
	var k, j;
	var b = type==0?1:0;
	var nfilters;
	var filterson = [];
	var uldl = ["UL","DL"];	
	var cfg = "";
	var maxch = config.CHNR;
	
	if (factory.chBandEnabled[band]){
		nfilters = 0;
		for (j=0;j<maxch;j++){
			if (config.filterEnabled[0][band][b][j]){
				filterson.push(j);
				nfilters++;
			}
		}					
		cfg+="\tNarrow Band Filters\n";
		//Enable
		cfg+="\t\tFilter ON: ";
		for (j=0;j<nfilters;j++) cfg+=(filterson[j]+1)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";	
		//Frequency
		cfg+="\t\tFilter Frequency " + uldl[b] + " (MHz): ";
		for (k=0;k<nfilters;k++) cfg+=(config.freqHz[band][b][filterson[k]]/1e6)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//BW
		cfg+="\t\tFilter Bandwidth " + uldl[b] + " (KHz): ";
		for (k=0;k<nfilters;k++) cfg+=(config.bwKHz[band][b][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//Fine Gain
		cfg+="\t\tFilter Fine Gain " + uldl[b] + " (dB): ";
		for (k=0;k<nfilters;k++) cfg+=(config.fineGainFilter[0][band][b][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//Squelch Enable
		cfg+="\t\tFilter Squelch Enable " + uldl[b] + ": ";
		if (b==0)
			cfg+=boolToYN(config.sqChEnabled[0][band][b][0])+"\n";
		else{
			for (k=0;k<nfilters;k++) cfg+=boolToYN(config.sqChEnabled[0][band][b][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
		//Squelch Threshold
		cfg+="\t\tFilter Squelch Threshold " + uldl[b] + " (dBm): ";
		if (b==0)
			cfg+=(config.sqChThreshold[0][band][b][0])+"\n";
		else{
			for (k=0;k<nfilters;k++) cfg+=(config.sqChThreshold[0][band][b][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
		if (b==1) cfg+="\t\tAll filters with same squelch settings DL: " + boolToYN(config.allSameSquelch[band])+"\n";
		cfg+="\t\tAll filters with same Bandwidth " + uldl[b] + ": "+boolToYN(config.allChSameBW[band][b])+"\n";
		if (type==1){
			cfg+="\t\tC/N Threshold UL (dBm): "+config.cn_threshold_nb[band]+"\n";
		}
	}
	return cfg;
}
function rfConfigAdjBwFiltersToText(config, factory, band, type){
	var i,j,k;
	var b = type==0?1:0;
	var nfilters;
	var filterson = [];
	var uldl = ["UL","DL"];	
	var cfg = "";
	if (factory.adjBandEnabled[band]){
		nfilters = 0;
		for (j=0;j<factory.numADJFilters;j++){
			if (config.filterEnabled[1][band][b][j]){
				filterson[nfilters]=j;
				nfilters++;
			}
		}					
		cfg+="\tADJBW Filters\n";
		if (band==0 && factory.commonUl) cfg+="\t\tAssign 1st ADJBW Filter to Band 14: " + boolToYN(config.firstADJisFirstNet) + "\n";
		//Enable
		cfg+="\t\tADJBW ON:";
		for (k=0;k<nfilters;k++) cfg+=(filterson[k]+1)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//Frequencies
		cfg+="\t\tADJBW Frequency Start-Stop " + uldl[b] + " (MHz): ";
		for (k=0;k<nfilters;k++) cfg+=(config.fstartHzAdjFilter[band][b][filterson[k]]/1e6)+"-"+(config.fstopHzAdjFilter[band][b][filterson[k]]/1e6)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//Fine Gain
		cfg+="\t\tFilter Fine Gain " + uldl[b] + " (dB): ";
		for (k=0;k<nfilters;k++) cfg+=(config.fineGainFilter[1][band][b][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//Squelch Enable
		cfg+="\t\tFilter Squelch Enable " + uldl[b] + ": ";
		for (k=0;k<nfilters;k++) cfg+=boolToYN(config.sqChEnabled[1][band][b][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//Squelch Threshold
		cfg+="\t\tFilter Squelch Threshold " + uldl[b] + " (dBm): ";
		for (k=0;k<nfilters;k++) cfg+=(config.sqChThreshold[1][band][b][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//C/N UL Low Threshold
		if (type==1){
			cfg+="\t\tC/N Threshold UL (dBm): ";
			for (k=0;k<nfilters;k++) cfg+=config.cn_threshold_adj[band][k]+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	return cfg;
}
function rfConfigAlarmToText(config, factory, band, type){
	var cfg = "";
	cfg+="\tRF Alarm Settings\n";
	if (type==1){
		cfg+="\t\tReturn Loss Threshold (dB): " + (config.retLossTh[band]) + "\n";
		cfg+="\t\tMinimum TX Power for VSWR Detection (dBm): " + (config.minPowerVSWR[band]) + "\n";
		cfg+="\t\tReturn Loss Alarm Sensitivity (seconds): " + (config.alarmNumSens[band]) + "\n";
		var n = (band == 0? config.alarmThrshOrder[1].TX_POWER_LOW_B0 : config.alarmThrshOrder[1].TX_POWER_LOW_B1 );
		cfg+="\t\tDownlink Output Power Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tDownlink Output Power Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
	}else{
		cfg+="\t\tDonor Antenna Failure Timer Threshold (seconds): " + (config.timeTxLowPowLow[band]) + "\n";
		cfg+="\t\tAntenna Disconnection Input Threshold (dBm): " + (config.antennaDisconnectionThreshold[band]) + "\n";
	}
	return cfg;
}

function boolToYN(val){
	return (val?"YES":"NO");
}
function agcModeText(val){
	var str = "";
	switch (val) {
	case 0:	str = "Stable Coverage"; break;
	case 1: str = "Max.Power"; break;
	case 2: str = "Hybrid"; break;
	}
	return str;
}
function masterModeText(val){
	var str = "";
	switch (val) {
	case 0:	str = "Primary"; break;
	case 1: str = "Secondary"; break;
	case 2: str = "Automatic"; break;
	}
	return str;
}
function isBbuSerialMode(config)
{
	var isSerialMode = false;
	isSerialMode = (config.supportsBBU() && config.bbu_serial_mode!=0);
	return isSerialMode;
}
function getNrOfRelaysSupported(config, nr, version) {
	var isRemote = ((nr & 0xff)!=0);
	var isMaster = nr==0;
	if (!isBbuSerialMode(config) || config.bbu_type == 0) {
		if (isRemote){
			return 4;
		}else{
			return (isMaster && version.compareSw(6,0)>=0? 4:7);//master SDRP only has 4 relays in dry contact mode
		}
	}
	if (config.bbu_type == 1) {
		return 10; 	// BBU MVO.2 standard
	} else if (config.bbu_type == 2) {
		return 9; 	// BBU MVO.2 high power
	} else {
		return (!isRemote? 7: 4);	// default
	}
}
function getNrOfGralSystemAlarmsSupported(config, nr) {
	if (nr == 0) return NrOfGralSystemAlarms;
	return (config.supportsBBU()? NrOfGralSystemAlarms:1);
}

function createDeepDischargeBox() {
	this.unitDiv = document.createElement("div");
	this.unitDiv.id = "deepDischargeDiv";
	this.unitDiv.className = "unitbox";
	this.unitDiv.style.display = "none";
	var headDiv = document.createElement("div");
	this.unitDiv.appendChild(headDiv);
	headDiv.className = "headbox";
	var tab = document.createElement("table");
	headDiv.appendChild(tab);
	tab.className = "headtable";
	tab.style.width = "100%";
	var tb = document.createElement("tbody");
	tab.appendChild(tb);
	var row = document.createElement("tr");
	tb.appendChild(row);
	var cell = document.createElement("td");
	cell.className = "tdBlank";
	row.appendChild(cell);
	var cell = document.createElement("td");
	row.appendChild(cell);
	cell.innerHTML = "BATTERY&nbsp;DEEP&nbsp;DISCHARGE";
	cell.className = "tag";
	cell.style.textAlign = "center";
	row.appendChild(cell);	

	var contentDiv = document.createElement("div");
	contentDiv.className = "msgbox";
	contentDiv.style.textAlign = "center";
	this.unitDiv.appendChild(contentDiv);
	this.defaultWarningText = "WARNING: the installed batteries suffered full discharge. Performance and lifetime of the batteries may be affected.";
	var txt = document.createElement("div");
	txt.innerHTML = this.defaultWarningText;
	txt.style.padding = "20px 20px 20px 40px";
	txt.style.fontWeight = "bold";
	txt.style.fontSize = "large";
	txt.id = "deepDischargeWarningTxt";
	contentDiv.appendChild(txt);
	var dismissButton = document.createElement("input");
	dismissButton.type = "button";
	dismissButton.value = "DISMISS";
	dismissButton.style.marginLeft = dismissButton.style.marginRight = "auto";
	dismissButton.style.fontWeight = "bold";
	dismissButton.style.fontSize = "14px";
	dismissButton.style.marginBottom = "10px";
	contentDiv.appendChild(dismissButton);
	dismissButton.onclick = function(ev) {
		try {
			window.parent.navi.deepDischargeButtonClicked = true;
			var frms = [];
			//code to send dismiss action
			for (var nr in self.deepDischargedDevices) {
				if (self.deepDischargedDevices[nr]) {
					self.deepDischargedDevices[nr] = false;
					var frmcnf = '('+hexformat(nr,4)+'0101'; //command to unit nr basic actions with bit0=1--> Dismiss deep discharge message
					frms.push({type: 'ctl_conf_str=', frame: frmcnf});
				}
			}
			setConfigFramesToSubmit(frms);
		} catch(e){}
	}
	this.showDeepDischargeMvo2 = function(mon) {
		try {
			var isDeepDischarge = false;
			var nrOfDeepDischargedDevices = 0;
			if (mon.isAggBasic){
				self.deepDischargedDevices = [];
				for (var nr in mon.monitorUnit[0].fibInfo.FOmoduleConnected){
					if (!mon.remoteResponseValid[nr]) continue;
					if (!mon.monitorUnit[nr].bbu_serial_mode) {
						this.deepDischargedDevices[nr] = false;
					} else {
						if (mon.monitorUnit[nr].bbuDeepDischarge) {
							isDeepDischarge = true;
							this.deepDischargedDevices[nr] = true;
							nrOfDeepDischargedDevices++;
						} else {
							this.deepDischargedDevices[nr] = false;
						}
					}
				}
			}
			var el = document.getElementById("deepDischargeDiv");
			if (isDeepDischarge && !window.parent.navi.deepDischargeButtonClicked) {
				if (nrOfDeepDischargedDevices>0) {
					var extraInfo = "<br>Devices affected:";
					var cond = false;
					for (var j=0;j<2;j++){ 
						for (var nr in this.deepDischargedDevices) {
							var i1 = nr & 0xff;var i2 = nr>>8 & 0xff;
							if ((i1==0)==cond) continue;
							if (this.deepDischargedDevices[nr]) extraInfo += "&nbsp;&nbsp;"+(nr==0?"Master":(i1==0?"Expansion "+i2+".0":"Remote "+i2+"."+i1))+",";
						}
						cond = true;
					}
					extraInfo = extraInfo.substring(0,extraInfo.length-1);
					document.getElementById("deepDischargeWarningTxt").innerHTML = this.defaultWarningText + extraInfo;
				}
				el.style.display = "block";
				return true;
			} else {
				el.style.display = "none";
				return false;
			}
		} catch(e){return false;}
	}
	this.clearDeepDischargeButtonClicked = function() {
		window.parent.navi.deepDischargeButtonClicked = false;
	}
	this.getBox = function() {return this.unitDiv;}
	this.deepDischargedDevices = [];
	var self = this;
}

// define map for remote alarm relay assign
var relayAssignPolicies = [
	{ix: 0, text: 'Remote alarm triggers master relays according to master table'},
	{ix: 1, text: 'Remote alarm triggers master relays according to each remote table'},
	{ix: 2, text: 'Remote alarm does not trigger relays on Master'}
];
