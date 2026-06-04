var NrOfGralSystemAlarms = 3;

function Config() {
	this.NR_OF_RELAYS_MAX			= 10
	this.CHNR 						= 64;
	this.ADJNR 						= 4;
		
	this.resetSoft					= false;
	
	this.uldlLinkedFreq				= [false,false]; //NOT USED
	this.muteModeLinked				= [false,false]; //NOT USED
	this.numberOfFilterNonGrouped	= [[0,0],[0,0]]; //Only used for UL
	this.simplexMode				= [false,false]; //NOT USED
	
	this.gainIsolMargin				= [0,0]; //NOT USED
	this.runIsolationMeas			= [false,false];
	this.oscTimeThSeconds			= [0,0];
	this.oscRetryTimeHours			= [0,0];
	this.oscActionAfterAlarm		= [0,0];
	this.clearOscAlarm				= [false,false];
	this.allSameSquelch				= [false,false]; //band0/1 [2] //Sin uso
	
	this.firstADJisFirstNet			= false;
	
	this.allChSameBW				= []; //band0/1 ul/dl[2][2] //En realidad, sólo UL
	this.paEnabled					= []; //band0/1 ul/dl [2][2]
	
	this.sqChEnabled				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][32] en UL NB se utiliza CH0 para el que aplica a todos los filtros //En realidad, sólo UL
	this.sqChThreshold				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][32] en UL NB se utiliza CH0 para el que aplica a todos los filtros //En realidad, sólo UL
	
	this.att						= []; //band0/1 ul/dl [2][2]
	this.inputAgc					= []; //band0/1 ul/dl [2][2] //En realidad, sólo UL
	
	this.filterEnabled				= []; // nb/adj ul/dl band0/1 ul/dl nfilter [2][2][2][32] //En realidad, sólo UL
	this.isFilterGrouped			= []; // band0/1 ul/dl nfilter [2][2][32] //En realidad, sólo UL
	this.bwIndex					= []; // band0/1 ul/dl nfilter [2][2][32] //En realidad, sólo UL
	this.bwKHz						= []; // band0/1 ul/dl nfilter [2][2][32] //En realidad, sólo UL
	this.freqHz						= []; // band0/1 ul/dl nfilter [2][2][32] //En realidad, sólo UL
	this.fineGainFilter				= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32] //En realidad, sólo UL
	
	this.fstartHzAdjFilter			= []; // band0/1 ul/dl nfilter [2][2][4] //En realidad, sólo UL
	this.fstopHzAdjFilter			= []; // band0/1 ul/dl nfilter [2][2][4] //En realidad, sólo UL
	
	this.delayTimerON				= []; // 7 --> 1boolean/relay ---
	this.latchTimerON				= []; // 7 --> 1boolean/relay ---
	this.delayTimer					= []; // 7 --> 1int/relay ---
	this.latchTimer					= []; // 7 --> 1int/relay ---	
	
	this.autoUlPaOffTimer			= 0; //No existe 
	this.extremeTempAction 			= 0; //Se quita modo reduce 6dB power
	this.forcePaOn					= []; //band0/1 ul/dl [2][2]
	this.forcePaOff					= []; //band0/1 ul/dl [2][2]	

	this.bbu_serial_mode = 0;
	this.bbu_type;
	this.bbu_dismiss_deep_discharge;
	
	this.retLossTh				= [0,0];
	this.minPowerVSWR			= [0,0];
	this.alarmNumSens			= [0,0];
	this.timeTxLowPowHigh		= [0,0];
	this.timeTxLowPowLow		= [0,0];
	this.antennaDisconnectionThreshold = [0,0];
	this.relayLogicConfigNormal	= []; // 7 --> 1boolean/relay ---
	this.globalAlarmsEnabled	= []; //16 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //24 --> 1boolean/alarm ---
	this.bandAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bandAlarmsInstalled	= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsInstalled		= []; //16 --> 1boolean/alarm ---
	this.relayAssignGlobalAlarm	= []; //24 alarm x NR_OF_RELAYS_MAX --> 1boolean/relay ---
	this.relayAssignBandAlarm	= []; //16 alarm x NR_OF_RELAYS_MAX --> 1boolean/relay ---
	this.relayAssignBbuAlarm	= []; //16 alarm x NR_OF_RELAYS_MAX --> 1boolean/relay ---
	this.alarmNames				= [["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","Path Loss 1","Path Loss 2","Fiber Optic 1","Fiber Optic 2",
								    "External Input 1","External Input 2","External Input 3","External Input 4","General System Alarm 1","General System Alarm 2","General System Alarm 3","Undefined"],
								   ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","Rx Power Low","DL AGC Fail","DL Output Power","","","C/N UL Low","","","","",""]];
	this.alarmNamesBbu =
    ["Normal AC Power","Loss Normal AC Power","Battery Capacity < 30%","Battery Charger Fail","BBU Comm. Error","Charger Temperature","Battery Temperature","Individual Batt. Voltage",
     "Battery Disconnection","System Voltage","Battery Bank Voltage","Battery Deep Discharge","Annunciator 1","Annunciator 2","Annunciator 3","Annunciator 4"];
	this.externalAlarmPolarity 	= [];
	this.buzzerMuteCommand = 0;
	this.buzzerMuteTime = 0;
	this.generalSystemAlarm 	= [[[],[],[]], [[],[],[]], [[],[],[]],]; // 2 global,band,bbu
	//Extra features for flex2.0 (coming from DH7S improvements)
	this.agcBandMode = [0,0]; //band0/1
	this.cnAlarmTime = 0;
	this.cn_threshold_nb = [0,0];	// band0/1 [2]
	this.cn_threshold_adj = [[0,0,0,0],[0,0,0,0]];	// band0/1 nfilter [2][4]
	//Extra features for flex2.0: path loss analyzer
	this.plaEn = false;
	this.forcePlaMeas = false;
	this.fstartHzPlaFilter = 0;
	this.fstopHzPlaFilter = 0;
	this.plaMeasPeriod = 0;
	
	this.limitCnAlarmTime = {MIN: 10, MAX: 2400};
	this.CNLimitdBm = {MIN: -120, MAX: -40};
	
	//define vector/matrix
	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}	
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
	
	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
		this.relayLogicConfigNormal.push(true);
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.delayTimer.push(0);
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
	for (var k=0;k<16;k++){
		this.bandAlarmsEnabled.push(false);
		this.bandAlarmsInstalled.push(false);
		for (var j=0; j < NrOfGralSystemAlarms; j++ ) {
			this.generalSystemAlarm[j][1].push(false);
		}
	}
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
	this.alarmThrshItems = 7;
	//includes 2 PLA Alarm thresholds
	this.alarmThrshData = [];
	for ( var i = 0; i < this.alarmThrshItems; i++ ) {
		this.alarmThrshData.push({ valueThr: 0, hysteresis: 0});
	}
	this.alarmThrshOrder = {
		RX_POWER_FIBER_1: 0,
		RX_POWER_FIBER_2: 1,
		TEMPERATURE: 2,
		TX_POWER_LOW_B0: 3,
		TX_POWER_LOW_B1: 4
	}
	this.alarmThrshLimits = [
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: 0, max: 85},
		{min: -10, max: 37},
		{min: -10, max: 37},
		{min: -90, max: 0},
		{min: -90, max: 0}
	];
	this.alrmThrshHystLimits = {min: 0, max: 10};

	this.setDefaultRelayAssign = function(mode){ //mode = 0 - dry contacts / 1 - serial
		this.clearRelayAssign();
		this.clearRelayLogic();
		var dryc = (mode==0);
		//relay assign BBU alarms are assigned regardless mode:
		//relay 1: normal AC power
		this.relayAssignBbuAlarm[0][0] = !dryc;
		//relay 2: loss normal AC power
		this.relayAssignBbuAlarm[1][1] = !dryc;
		//relay 3: batt capacity and batt disconnection
		var alr = [2,8];
		for (var k=0;k<alr.length;k++) this.relayAssignBbuAlarm[alr[k]][2] = !dryc;
		//relay 4: batt charger fail
		this.relayAssignBbuAlarm[3][3] = !dryc;
		//relay 8: bbu comm error, charger/batt temp, individual batt voltage, system voltage, batt bank voltage, batt deep discharge, annunciators
		var alr = [4,5,6,7,9,10,11,12,13,14,15];
		for (var k=0;k<alr.length;k++) this.relayAssignBbuAlarm[alr[k]][7] = !dryc;
		if (mode==1){
			//relay 7: hw fail, high temp, osc detection, fiber optic 1, fiber optic 2
			var alr = [0,1,3,6,7];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][6] = true;
			//relay 7: overload UL, DL PA Fail, tx power low, VSWR, DL AGC Fail
			var alr = [0,2,3,4,6];
			for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][6] = true;
		}else{
			//relay 2: VSWR
			this.relayAssignBandAlarm[4][1] = true;
			//relay 4: hw fail, high temp, osc detection, fiber optic 1, fiber optic 2
			var alr = [0,1,3,6,7];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;
			//relay 4: overload UL, DL PA Fail, tx power low, DL AGC Fail
			var alr = [0,2,3,6];
			for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][3] = true;
		}
	}
	this.clearRelayAssign = function(){
		for (var i=0;i<this.relayAssignGlobalAlarm.length;i++){
			for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
				if (i!=15) this.relayAssignGlobalAlarm[i][j] = false; //4 LSBits of relayAssignGlobalAlarm[15] byte  is being used for gen sys alarm assign to external inputs
			}
		}
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
	this.setTimersFromConfig = function(cnf){
		for (var i=0;i<this.NR_OF_RELAYS_MAX;i++){
			this.delayTimerON[i] = cnf.delayTimerON[i];
			this.latchTimerON[i] = cnf.latchTimerON[i];
			this.delayTimer[i] = cnf.delayTimer[i];
			this.latchTimer[i] = cnf.latchTimer[i];
		}
	}
	this.frm					= "";
	
	this.SqModeVals = {
		'NOTLINKED': 	0,
		'LINKED': 	1
	}
	this.sqThrLimits = function(simplex, b, ULlowGainMode) {
		if (simplex) {
			return {MIN: -100, MAX: -40};
		} else {
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
	this.FOmoduleConnected = [false, false];
	this.FOgroupDelayEnable = false;
	this.FOclearErrorCounters = false;
	this.FOgroupDelay = [[0, 0], [0, 0]];
	this.delayLims = {min: 0, max: 400};
	this.FOconfigSettingsMasks = {
		groupDelayEnable: 0x02,
		clearErrorCounters: 0x04
	}
	this.PriorityLinkTimerFeatureEnable = false;
	this.parse = function(s) {
		if (s.length<configLength) return -1;
		var ind = 2; //to ignore device_version_index
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		//GENERAL CONFIGURATION
		ind = this.parseGeneral(s,ind,factory);
		//FILTER CONFIGURATIONS
		ind = this.parseFilter(s,ind,factory);
		//SQUELCH CONFIGURATION
		ind = this.parseSquelch(s,ind);
		//ALARM CONFIGURATION
		ind = this.parseAlarm(s,ind,factory);
		//OTHER CONFIGURATION
		ind = this.parseOtherConf(s,ind,factory);
		
		this.frm = this.getFrm();
	}
	this.parseGeneral = function(s,ind,factory){
		var res;
		for (var b=0;b<2;b++){ //Band0/1
			for (var i=0;i<2;i++){//UL/DL
				//PA Enabled, AGC Mode
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.paEnabled[b][i] = (res & 0x80)!=0;
				this.forcePaOn[b][i] = false;
				this.forcePaOff[b][i] = false;	
				if (i==0){
					this.agcBandMode[b] = (res & 0xc)>>2;
					if (this.agcBandMode[b]==3) this.agcBandMode[b]=2;
				}
				//ATT
				this.att[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				//POWER (only UL)
				if (i==0){
					this.inputAgc[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					if (this.inputAgc[b][i]>127) this.inputAgc[b][i]-=256;	
				}
			}
		}
		//RESET, clearErrorCounter
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.resetSoft = false;//(res & 0x1)!=0;
		this.FOconfigMask = res;

		this.FOclearErrorCounters = false;
		return ind;
	}
	this.parseFilter = function(s,ind,factory){
		var res;
		for (var b=0;b<2;b++){ //Band0/1
			//All SAME BW, BAND14_ADJ1
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.allChSameBW[b][0] = (res & 0x1)!=0;
			if (b==0){
				this.firstADJisFirstNet = (res & 0x2)!=0;
				if (!factory.commonUl) this.firstADJisFirstNet = false; //forced to false if V/U
			}
			//NGROUPS
			this.numberOfFilterNonGrouped[b][0] = parseInt(s.substring(ind,ind+2), 16) & 0x3f; ind+=2;
			//FILTERS NB
			for (var ch=0;ch<this.CHNR;ch++){//64CH
				//CHON,GROUPED,BW
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.filterEnabled[0][b][0][ch] = (res & 0x80)==0;
				this.isFilterGrouped[b][0][ch] = (res & 0x40)!=0;
				this.freqHz[b][0][ch] = 0;
				if (factory.fstep<1.5e3) this.freqHz[b][0][ch] = ((res & 0x20)>>5)*factory.fstep/2; //1 extra bit for freq only if fstep<1.5KHz
				res = res & 0x7;
				if (!factory.commonUl && res==0) res=1; //filter 150KHz not allowed in V/U
				this.bwIndex[b][0][ch] = (res);
				this.bwKHz[b][0][ch] = this.computeBWFromIndex(res);
				//FINE GAIN
				this.fineGainFilter[0][b][0][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (this.fineGainFilter[0][b][0][ch]>127) this.fineGainFilter[0][b][0][ch]-=256;
				//FREQ
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				if (res>32767) res-=65536;
				this.freqHz[b][0][ch] += factory.fref[2*b]+res*factory.fstep;
			}
			//ADJ ENABLE
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++){
				this.filterEnabled[1][b][0][ch] = (res & (1<<(ch+4)))==0;
			}
			//FILTERS ADJ
			for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
				//FINE GAIN
				this.fineGainFilter[1][b][0][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (this.fineGainFilter[1][b][0][ch]>127) this.fineGainFilter[1][b][0][ch]-=256;
				//FSTART
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				if (res>32767) res-=65536;
				this.fstartHzAdjFilter[b][0][ch] = factory.fref[2*b]+res*factory.fstepAdj;
				//FSTOP
				res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
				if (res>32767) res-=65536;
				this.fstopHzAdjFilter[b][0][ch] = factory.fref[2*b]+res*factory.fstepAdj;
			}
		}
		return ind;
	}
	this.parseSquelch = function(s,ind){
		var res;
		//SQ ENABLE
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.sqChEnabled[0][0][0][0] = (res & 0x1)!=0;
		this.sqChEnabled[0][1][0][0] = (res & 0x4)!=0;
		//C/N Time Threshold
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
	this.parseAlarm = function(s,ind,factory){
		var res,res2;
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
		this.bbu_dismiss_deep_discharge = (res & 0x10)==0x10;
		this.bbu_dismiss_deep_discharge = false;	// write-only
		//VSWR DETECTORS
		for (var b=0;b<2;b++){ //Band0/1
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;	if (res>32767) res-=65536;
			this.retLossTh[b] = res/100;
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;	if (res>32767) res-=65536;
			this.minPowerVSWR[b] = res/100;
			this.alarmNumSens[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		}
		//GLOBAL ALARM ENABLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		// se ha eliminado la parte de ALARMS INSTALLED de la trama
		for (var k=0;k<24;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k>=4 && k<6 && !factory.plaAvailable) this.globalAlarmsEnabled[k]; //path loss alarms forced to disable if pla is not available
			if (k==3) this.globalAlarmsEnabled[k]= true; //Alarm Oscillation detection always "Enabled"
			if ( k < 6 ) {
				this.globalAlarmsInstalled[k] = true;
			} else if ( k >= 6 && k < 15 ) {	// general system alarm 2 & 3 (k=13,14), installed if enabled
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		//BAND ALARM ENABLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++){
			this.bandAlarmsEnabled[k] = (res & (1<<k))!=0;
			this.bandAlarmsInstalled[k] = (k<8); //Forced available first 8
		}
		this.bandAlarmsInstalled[1] = false; //no Overload DL
		this.bandAlarmsInstalled[5] = false;//no Rx Low Power
		this.bandAlarmsInstalled[10] = true; //C/N UL Low Alarm
		//BBU ALARM ENABLED/INSTALLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++){
			this.bbuAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k<12) {
				this.bbuAlarmsInstalled[k] = true;
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
				if (k>=4 && k<6 && !factory.plaAvailable) this.relayAssignGlobalAlarm[k][j] = false; //path loss relay assign forced to unassigned if pla is not available
			}
			
			this.generalSystemAlarm[0][0][k] = (res & 0x80) != 0;
			if (k>=4 && k<6 && !factory.plaAvailable) this.generalSystemAlarm[0][0][k] = false; //path loss gen sys assign forced to unassigned if pla is not available
		}
		//BAND RELAY ASIGN RELAY1-7, GEN SYS ALARM 1
		for (var k=0;k<16;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignBandAlarm[k][j] = (res & (1<<j))!=0;
			}
			this.generalSystemAlarm[0][1][k] = (res & 0x80) != 0;
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
				if (k>=4 && k<6 && !factory.plaAvailable) this.relayAssignGlobalAlarm[k][7] = false; //path loss relay assign forced to unassigned if pla is not available
			}
			
		}
		//BAND RELAY ASIGN RELAY8
		for (var k=0;k<16;k++){
			var n = ~~Math.floor(k/8);	// n= 0
			var m = (k - n*8);			// m= 0,1,2,3,4,5,6,7
			res = parseInt(s.substring(ind,ind+2), 16); if (m==7) ind+=2;
			for (var j=0;j<1;j++){
				this.relayAssignBandAlarm[k][7] = (res & (1<<(j+m)))!=0;
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
				if (k>=4 && k<6 && !factory.plaAvailable) this.relayAssignGlobalAlarm[k][j] = false; //path loss relay assign forced to unassigned if pla is not available
			}
		}
		//BAND RELAY ASIGN RELAY9-10
		for (var k=0;k<16;k++){
			var n = ~~Math.floor(k/4);	// n= 0,1
			var m = (k - n*4)*2;		// m= 0,2,4,6
			res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2;
			for (var j=0;j<2;j++){
				this.relayAssignBandAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
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
			//BAND
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0; k<16; k++) {
				this.generalSystemAlarm[i][1][k] = (res & (1<<k))!=0;
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
		for (var k = 0; k < 5; k++) { //first 5, other 2 are read in pla section
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
		this.PriorityLinkTimerFeatureEnable = (this.plaMeasPeriod & 0x8000)!=0;
		this.PriorityLinkTimerMinutes = this.plaMeasPeriod & 0x7fff;
		//PLA ALARM THRESHOLDS
		for (var k = 5; k < this.alarmThrshItems; k++) {
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			if (res > 127) res -= 256;
			this.alarmThrshData[k].valueThr = res;
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res /= 2;
			this.alarmThrshData[k].hysteresis = res;
		}
		//EXTERNAL INPUT NAMES
		for (var k=0;k<3;k++){ 
			this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
		this.alarmNames[0][11] = "Force RF OFF"; //Fixed name
		ind+=30;
		//ANNUNCIATOR NAMES
		for (var k=0;k<4;k++){ 
			this.alarmNamesBbu[12+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
		return ind;
	}
	this.getFrm = function(){
		var i;
		var res,fr;
		var mask = 0,mask2 = 0;
		var b,ch;
		var cfg = "02"; //add 2 chars for device_version_index
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);	
		//GENERAL CONFIGURATION
		cfg += this.getFrmGeneral(factory);
		//FILTER CONFIGURATIONS
		cfg += this.getFrmFilter(factory);
		//SQUELCH CONFIGURATION
		cfg += this.getFrmSquelch();
		//ALARM CONFIGURATION
		cfg += this.getFrmAlarm(factory);
		//OTHER CONFIGURATION
		cfg += this.getFrmOtherConf(factory);
		this.frm = cfg;
		return cfg;
	}
	this.getFrmGeneral = function(factory){
		var res;
		var mask = 0;
		var cfg = "";
		//GENERAL CONFIGURATION
		for (var b=0;b<2;b++){ //Band0/1
			for (var i=0;i<2;i++){//UL/DL
				//PA Enabled, AGC Mode
				mask = 0;
				if (this.paEnabled[b][i]) mask|=0x80;
				if (this.forcePaOff[b][i]) mask|=0x1;
				if (this.forcePaOn[b][i]) mask|=0x2;
				if (i==0){
					if (this.agcBandMode[b]==3) this.agcBandMode[b]=2;
					mask|=(this.agcBandMode[b]&0x3)<<2;
				}
				cfg += hexformat(mask,2);
				//ATT
				cfg += hexformat(this.att[b][i],2);
				//POWER (only UL)
				if (i==0){
					res= this.inputAgc[b][i];if (res<0) res+=256;
					cfg += hexformat(res,2);
				}
			}
		}
		//RESET, clearErrorCounter
		mask = 0;
		if (this.resetSoft) mask|=0x1;
		mask |= this.FOclearErrorCounters ? this.FOconfigSettingsMasks.clearErrorCounters : 0;
		cfg += hexformat(mask,2);
		return cfg;
	}
	this.getFrmFilter = function(factory){
		var res;
		var mask = 0;
		var cfg = "";

		for (b=0;b<2;b++){ //Band0/1
			//All SAME BW, BAND14_ADJ1
			mask = 0;
			if (this.allChSameBW[b][0]) mask|=0x1;
			if (b==0){
				if (!factory.commonUl) this.firstADJisFirstNet = false; //forced to false if V/U
				if (this.firstADJisFirstNet) mask|=0x2;
			}
			cfg += hexformat(mask,2);
			//NGROUPS
			cfg += hexformat(this.numberOfFilterNonGrouped[b][0] & 0x3f,2);
			//FILTERS NB
			for (ch=0;ch<this.CHNR;ch++){//32CH (los filtros UL son 1-32, los filtros DL 33-64)
				mask=0;
				//CHON,GROUPED,BW
				if (!this.filterEnabled[0][b][0][ch]) mask|=0x80;
				if (this.isFilterGrouped[b][0][ch]) mask|=0x40;
				this.bwIndex[b][0][ch] = this.bwIndex[b][0][ch] & 0x7;
				if (!factory.commonUl && this.bwIndex[b][0][ch]==0) this.bwIndex[b][0][ch]=1; //filter 150KHz not allowed in V/U
				mask|=this.bwIndex[b][0][ch];
				this.bwKHz[b][0][ch] = this.computeBWFromIndex(this.bwIndex[b][0][ch]);
				if (factory.fstep<1.5e3){
					fr = ~~Math.round((this.freqHz[b][0][ch]-factory.fref[2*b])/factory.fstep*2);if (fr<0) fr+=131072; 
					mask|= (fr & 0x1)<<5; //1extra bit for freq only if fstep<1.5KHz
				}else{
					fr = 2*(~~Math.round((this.freqHz[b][0][ch]-factory.fref[2*b])/factory.fstep));if (fr<0) fr+=131072;
				}
				cfg += hexformat(mask,2);
				//FINE GAIN
				res=this.fineGainFilter[0][b][0][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
				//FREQ
				cfg += hexformat((fr>>1) & 0xffff,4);
			}
			//ADJ ENABLE
			mask=0;
			for (ch=0;ch<this.ADJNR;ch++){
				if (!this.filterEnabled[1][b][0][ch]) mask|=(1<<(ch+4));
			}
			cfg += hexformat(mask,2);
			//FILTERS ADJ
			for (ch=0;ch<this.ADJNR;ch++){//4ADJ
				//FINE GAIN
				res=this.fineGainFilter[1][b][0][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
				//FSTART
				res =~~Math.round((this.fstartHzAdjFilter[b][0][ch]-factory.fref[2*b])/factory.fstepAdj);if (res<0) res+=65536;
				cfg += hexformat(res,4);
				//FSTOP
				res =~~Math.round((this.fstopHzAdjFilter[b][0][ch]-factory.fref[2*b])/factory.fstepAdj);if (res<0) res+=65536;
				cfg += hexformat(res,4);
			}
		}
		return cfg;
	}
	this.getFrmSquelch = function(){
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
	this.getFrmAlarm = function(factory){
		var res;
		var mask = 0,mask2 = 0;
		var cfg = "";
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
		cfg += hexformat(bbu_config_mask, 2);
		//VSWR DETECTORS
		for (var k=0;k<2;k++){
			res = ~~Math.round(100*this.retLossTh[k]); if (res<0) res+=65536;
			cfg += hexformat(res,4);
			res = ~~Math.round(100*this.minPowerVSWR[k]); if (res<0) res+=65536;
			cfg += hexformat(res,4);			
			cfg += hexformat(this.alarmNumSens[k],4);
		}
		//GLOBAL ALARM ENABLED
		for (var k=0, mask=0;k<24;k++){
			if (this.globalAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat((mask & 0xff0000)>>16,2);
		//BAND ALARM ENABLED
		for (var k=0,mask=0;k<16;k++){
			if (this.bandAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
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
			//BAND
			gralSystemAlarmMask = 0;
			for (var k=0; k<16; k++) {
				if (this.generalSystemAlarm[i][1][k]) gralSystemAlarmMask |= 1<<k;
			}
			cfg += hexformat(gralSystemAlarmMask & 0xff,2);
			cfg += hexformat((gralSystemAlarmMask & 0xff00)>>8,2);
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
		for (var k = 0; k < 5; k++) { //first 5, other 2 are read in pla section
			var v = this.alarmThrshData[k].valueThr;
			if (v < this.alarmThrshLimits[k].min) {
				v = this.alarmThrshLimits[k].min;
			} else if (v > this.alarmThrshLimits[k].max) {
				v = this.alarmThrshLimits[k].max;
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
		//DELAY COMPENSATION
		for (var port = 0; port < 2; port++) {
			for (var k = 0; k < 2; k++) {
				var delay = this.FOgroupDelay[port][k];
				if (delay < this.delayLims.min) delay=this.delayLims.min;
				if (delay > this.delayLims.max) delay=this.delayLims.max;
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
		this.plaMeasPeriod = Math.min(this.PriorityLinkTimerMinutes, 1440); // limit FO active-link timer to 1 day.
		if (this.PriorityLinkTimerFeatureEnable) this.plaMeasPeriod |= 0x8000;
		cfg += hexformat(this.plaMeasPeriod, 4); // limit timer to 1 day=1440 minutes.
		//PLA ALARM THRESHOLDS 
		for (var k = 5; k < this.alarmThrshItems; k++) {
			var v = this.alarmThrshData[k].valueThr;
			if (v < this.alarmThrshLimits[k].min) {
				v = this.alarmThrshLimits[k].min;
			} else if (v > this.alarmThrshLimits[k].max) {
				v = this.alarmThrshLimits[k].max;
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
	this.PriorityLinkSwitchTimerMinutesGet = function() {
		return this.PriorityLinkTimerMinutes;
	}
	this.PriorityLinkSwitchTimerMinutesSet = function(minutes) {
		this.PriorityLinkTimerMinutes = minutes;
	}
	this.PriorityLinkSwitchTimerFeatureEnableSet = function(enable) {
		this.PriorityLinkTimerFeatureEnable = enable;
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
	this.getFrmBuzzerMuteCommand = function() {
		// this function can be used if a button is implemented for muting the buzzer
		this.buzzerMuteCommand = 1;
		return this.getFrm();
	}
	this.isRelayAssignNormalACpowerExclusive = function(relayNr) {
		if (!(relayNr<12)) {
			return false;
		}
		// NormalACPower = BBU alarm nr #0 
		if (!this.relayAssignBbuAlarm[0][relayNr]) {
			return false;
		}

		// if relaNr is also assigned to other alarm, then it is not "Normal AC Power" exclusive
		for (var k=0;k<15;k++){
			if (this.relayAssignGlobalAlarm[k][relayNr]) {
				return false;
			}
		}
		var alarmsToConsider=[];
		for (var k=0;k<11;k++){ 
			var en = !(k==1||k==5||(k>=8 && k!=10)); //overload DL and Rx Power Low do not exist in remotes
			alarmsToConsider.push(en);
		}
		for (var k=0;k<this.bandAlarmsEnabled.length;k++){
			if (alarmsToConsider[k] && this.relayAssignBandAlarm[k][relayNr]) {
				return false;
			}
		}
		for (var k=1;k<13;k++){	// skip alarm nr 0, "Normal AC Power", individual annunciators are not considered
			if (this.bbuAlarmsEnabled[k] && this.relayAssignBbuAlarm[k][relayNr]) {
				return false;
			}
		}
		return true;
	}
	this.saveFrameStr = function(sr) {
		localStorage.setItem("Conf"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("Conf"+Prjstr+window.location.host);
	}	
}

function overallConfigToTextFile(config, factory, tagstr, ethstr, serial){
	var cfg = "";
	cfg += "TAG: " + tagstr.trim() + "\n\n";
	cfg += rfConfigToText(config,factory);
	cfg += fiberConfigToText(config, factory)+ "\n"; //only for DASCentric
	if (factory.plaAvailable) cfg += pathLossConfigToText(config, factory)+ "\n";
	cfg += alarmSettingsToText(config, factory)+ "\n";
	if ( !factory.ethernetModuleNotInstalled ) {
		cfg += ethConfigToText(ethstr)+ "\n";
	}
	cfg += getVersionNaviData(factory)+ "\n";
	cfg += "SERIAL: " + serial + "\n";
	return cfg;
}
function getVersionNaviData(factory){
	var cfg = "";
	cfg += "VERSION:\n";
	cfg += "\tFPGA: " + window.parent.navi.document.getElementById('fwBox').innerHTML + "\n";
	cfg += "\tuC: " + window.parent.navi.document.getElementById('swBox').innerHTML + "\n";
	if ( !factory.ethernetModuleNotInstalled ) {
		cfg += "\tETH: " + window.parent.navi.document.getElementById('serverBox').innerHTML + "\n";
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
function alarmSettingsToText(config, factory){
	var j,k;
	var exist_el;
	var cfg = "";
	var gralAlarmNames = ["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","Path Loss 1","Path Loss 2","Fiber Optic 1","Fiber Optic 2","","","","",
						  "General System Alarm 1", "General System Alarm 2", "General System Alarm 3"];
	var bandAlarmNames = ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","RxPower Low / Donor Antenna", "DL AGC Fail","DL Output Power","","","C/N UL Low"];
	var bbuAlarmNames = ["Normal AC Power","Loss Normal AC Power","Battery Capacity < 30%","Battery Charger Fail","BBU Communication Error","Charger Temperature","Battery Temperature","Individual Battery Voltage",
						 "Battery Disconnection","System Voltage","Battery Bank Voltage","Battery Deep Discharge","Annunciator 1","Annunciator 2","Annunciator 3","Annunciator 4"];
	cfg+="ALARM/RELAY SETTINGS:\n";
	for (k=0;k<15;k++) {
		if (((!factory.plaAvailable || !config.plaEn) && (k==4 || k==5)) || (k>=8 && k<12)) { //remotos no tienen UL PA Fail ni Antenna Disconnection, no se reportan aquí las external inputs
			continue;
		}
		cfg+="\tAlarm Enable " + gralAlarmNames[k] + ": " + boolToYN(config.globalAlarmsEnabled[k]) + "\n";
	}
	for (k=0;k<16;k++){
		if (k==1 || k==5) continue; //No Overload DL / no rx low power
		if (k>=8 && k!=10) continue; //Only C/N UL Low alarm in second byte
		cfg+="\tAlarm Enable " + bandAlarmNames[k] + ": " + boolToYN(config.bandAlarmsEnabled[k]) + "\n";
	}
	var bbuSerialMode = isBbuSerialMode(config);
	var nrOfRelaysSupported = getNrOfRelaysSupported(config);
	if (bbuSerialMode) {
		for (k=0;k<12;k++) {
			if (bbuAlarmNames[k].length == 0) continue;
			cfg+="\tAlarm Enable " + bbuAlarmNames[k] + ": " + boolToYN(config.bbuAlarmsEnabled[k]) + "\n";
		}
		for (k=12; k < 16;k++) {
			cfg+="\t" + bbuAlarmNames[k] + " Installed" + ": " + boolToYN(config.bbuAlarmsInstalled[k]) + "\n";	// annunciator installed
		}
	}
	for (k=0;k<15;k++){
		if (((!factory.plaAvailable || !config.plaEn) && (k==4 || k==5)) || (k>=8 && k<12)) { //remotos no tienen UL PA Fail ni Antenna Disconnection, no se reportan aquí las external inputs
			continue;
		}
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
	for (k=0;k<16;k++){
		if (k==1 || k==5) continue; //No Overload DL / No Rx Power Low
		if (k>=8 && k!=10) continue; //Only C/N UL Low alarm in second byte
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
	if (bbuSerialMode) {
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
		for (k=0;k<3;k++){
			cfg+=config.relayLogicConfigNormal[k]?"Open":"Closed"+ ", ";
		}
		cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
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

	cfg+="\tUser Alarm Enable: ";
	for (k=0;k<4;k++)
		cfg+=boolToYN(config.globalAlarmsEnabled[8+k])+", ";		
	cfg = cfg.substring(0,cfg.length-2)+"\n";	
	cfg+="\tUser Alarm Name: ";
	for (k=0;k<4;k++)
		cfg+=config.alarmNames[0][8+k].trim()+", ";
	cfg = cfg.substring(0,cfg.length-2)+"\n";		
	cfg+="\tUser Alarm Polarity: ";
	for (k=0;k<4;k++)
		cfg+=(config.externalAlarmPolarity[k]?"HIGH":"LOW")+", ";	
	cfg = cfg.substring(0,cfg.length-2)+"\n";
	for (k=0;k<4;k++){
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
		if (((!factory.plaAvailable || !config.plaEn) && (k==4 || k==5)) || (k>=8 && k<=14)) { //remotos no tienen UL PA Fail ni Antenna Disconnection, no se reportan aquí las external inputs ni general system alarm
			continue;
		}
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
	for (k=0;k<16;k++){
		if (k==1 || k==5) continue; //remoto sólo tienen las 7 primeras alarmas de banda y no tiene Overload DL ni Rx Power Low
		if (k>=8 && k!=10) continue; //Only C/N UL Low alarm in second byte
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
	for (k=0;k<4;k++){
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
function rfConfigToText(config, factory){
	var i;
	var cfg = rfConfigGeneralAlarmToText(config, factory)+ "\n";	
	for (i=0;i<2;i++){
		if (factory.chBandEnabled[i] || factory.adjBandEnabled[i]){
			cfg += "CONFIG "+factory.bandNames[i]+"\n";
			//General
			cfg += rfConfigGeneralBandToText(config, factory, i);
			//Narrow Filters
			cfg += rfConfigNarrowBandFiltersToText(config, factory, i);
			//ADJBW Filters
			cfg += rfConfigAdjBwFiltersToText(config, factory, i);
			//RF Alarm Settings
			cfg += rfConfigAlarmToText(config, factory, i)+ "\n";
		}
	}
	return cfg;
}
function rfConfigGeneralAlarmToText(config, factory){
	var cfg = "";
	cfg+="CONFIG GENERAL:\n";
	cfg+="\tType of BBU Connection: " + (config.bbu_serial_mode?"Serial":"Dry Contacts") + "\n";
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
	var n = config.alarmThrshOrder.TEMPERATURE;
	cfg+="\tTemperature Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
	cfg+="\tTemperature Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
	return cfg;
}
function fiberConfigToText(config, factory){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	cfg+="\tGroup Delay Adjust Enable: "+boolToYN(config.FOgroupDelayEnable)+"\n";
	for (var k = 0; k < 2; k++) {
		cfg+="\tOptical Port "+(k+1)+":\n";
		for (var i = 0; i < 2; i++) {
			var m = (i==0?"UL":"DL");
			cfg+="\t\tGroup Delay "+m+" (us): "+ config.FOgroupDelay[k][i] + "\n";
		}
		var n = (k==0 ? config.alarmThrshOrder.RX_POWER_FIBER_1 : config.alarmThrshOrder.RX_POWER_FIBER_2);
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
function rfConfigGeneralBandToText(config, factory, band){
	var j;
	var uldl = ["UL","DL"];
	var inout = ["Input","Output"];
	var cfg = "";
	cfg+="\tGeneral\n";
	for (j=0;j<2;j++) cfg+="\t\t"+uldl[j]+" "+inout[j]+" Attenuation (dB): " + (config.att[band][j]) +"\n";
	cfg+="\t\tInput AGC per channel Composite Power Set " + uldl[0]+ " (dBm): " + (config.inputAgc[band][0])+"\n";
	for (j=0;j<2;j++) cfg+="\t\tRF Enabled " + uldl[j]+ ": " + boolToYN(config.paEnabled[band][j])+"\n";
	cfg+="\t\tAGC Mode: " + agcModeText(config.agcBandMode[band])+"\n";
	return cfg;
}

function rfConfigNarrowBandFiltersToText(config, factory, band){
	var j,k;
	var nfilters;
	var filterson = [];
	var uldl = ["UL","DL"];	
	var cfg = "";
	var maxch = config.CHNR;
	if (factory.chBandEnabled[band]){
		nfilters = 0;
		for (j=0;j<maxch;j++){
			if (config.filterEnabled[0][band][0][j]){
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
		j=0;//solo UL
		//Frequency
		cfg+="\t\tFilter Frequency " + uldl[j] + " (MHz): ";
		for (k=0;k<nfilters;k++) cfg+=(config.freqHz[band][j][filterson[k]]/1e6)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//BW
		cfg+="\t\tFilter Bandwidth " + uldl[j] + " (KHz): ";
		for (k=0;k<nfilters;k++) cfg+=(config.bwKHz[band][j][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//Fine Gain
		cfg+="\t\tFilter Fine Gain " + uldl[j] + " (dB): ";
		for (k=0;k<nfilters;k++) cfg+=(config.fineGainFilter[0][band][j][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//Squelch Enable
		cfg+="\t\tFilter Squelch Enable " + uldl[j] + ": ";
		cfg+=boolToYN(config.sqChEnabled[0][band][j][0])+"\n";
		//Squelch Threshold
		cfg+="\t\tFilter Squelch Threshold " + uldl[j] + " (dBm): ";
		cfg+=(config.sqChThreshold[0][band][j][0])+"\n";
		cfg+="\t\tAll filters with same Bandwidth " + uldl[j] + ": "+boolToYN(config.allChSameBW[band][j])+"\n";
		cfg+="\t\tC/N Threshold UL (dBm): "+config.cn_threshold_nb[band]+"\n";
	}
	return cfg;
}
function rfConfigAdjBwFiltersToText(config, factory, band){
	var i,j,k;
	var nfilters;
	var filterson = [];
	var uldl = ["UL","DL"];	
	var cfg = "";
	if (factory.adjBandEnabled[band]){
		nfilters = 0;
		for (j=0;j<factory.numADJFilters;j++){
			if (config.filterEnabled[1][band][0][j]){
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
		j=0;//solo UL
		//Frequencies
		cfg+="\t\tADJBW Frequency Start-Stop " + uldl[j] + " (MHz): ";
		for (k=0;k<nfilters;k++) cfg+=(config.fstartHzAdjFilter[band][j][filterson[k]]/1e6)+"-"+(config.fstopHzAdjFilter[band][j][filterson[k]]/1e6)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//Fine Gain
		cfg+="\t\tFilter Fine Gain " + uldl[j] + " (dB): ";
		for (k=0;k<nfilters;k++) cfg+=(config.fineGainFilter[1][band][j][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";						
		//Squelch Enable
		cfg+="\t\tFilter Squelch Enable " + uldl[j] + ": ";
		for (k=0;k<nfilters;k++) cfg+=boolToYN(config.sqChEnabled[1][band][j][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//Squelch Threshold
		cfg+="\t\tFilter Squelch Threshold " + uldl[j] + " (dBm): ";
		for (k=0;k<nfilters;k++) cfg+=(config.sqChThreshold[1][band][j][filterson[k]])+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
		//C/N UL Low Threshold
		cfg+="\t\tC/N Threshold UL (dBm): ";
		for (k=0;k<nfilters;k++) cfg+=config.cn_threshold_adj[band][k]+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	return cfg;
}
function rfConfigAlarmToText(config, factory, band){
	var cfg = "";
	cfg+="\tRF Alarm Settings\n";
	cfg+="\t\tReturn Loss Threshold (dB): " + (config.retLossTh[band]) + "\n";
	cfg+="\t\tMinimum TX Power for VSWR Detection (dBm): " + (config.minPowerVSWR[band]) + "\n";
	cfg+="\t\tReturn Loss Alarm Sensitivity (seconds): " + (config.alarmNumSens[band]) + "\n";
	var n = (band == 0? config.alarmThrshOrder.TX_POWER_LOW_B0 : config.alarmThrshOrder.TX_POWER_LOW_B1 );
	cfg+="\t\tDownlink Output Power Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
	cfg+="\t\tDownlink Output Power Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";

	return cfg;
}

function boolToYN(val){
	return (val?"YES":"NO");
}

function agcModeText(val){
	var str = "";;
	switch (val) {
	case 0:	str = "Stable Coverage"; break;
	case 1: str = "Max.Power"; break;
	case 2: str = "Hybrid"; break;
	}
	return str;
}

function uCSupportsBbuMvo2Mode(version)
{
	return true;
	// var versionCompareTo2_00 = version.compareSw(2,0);
	// return (versionCompareTo2_00 > 0);
}

function isBbuSerialMode(config)
{
	var isSerialMode = false;
	isSerialMode = (config.bbu_serial_mode);
	return isSerialMode;
}
function getNrOfRelaysSupported(config) {
	if (!isBbuSerialMode(config)) return 4;
	if (config.bbu_type == 0) {
		return 4;	//  bbu_type == 0 ---> MMS only, do as if dry contacts mode
	} else if (config.bbu_type == 1) {
		return 10; 	// BBU MVO.2 standard
	} else if (config.bbu_type == 2) {
		return 9; 	// BBU MVO.2 high power
	} else {
		return 4;	// default
	}
}
function getNrOfGralSystemAlarmsSupported(config) {
	return NrOfGralSystemAlarms;
}

function createDeepDischargeBox() {
	this.version = version;
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
	var txt = document.createElement("div");
	txt.innerHTML = "WARNING: the installed batteries suffered full discharge. Performance and lifetime of the batteries may be affected."
	txt.style.padding = "20px 20px 20px 40px";
	txt.style.fontWeight = "bold";
	txt.style.fontSize = "large";
	contentDiv.appendChild(txt);
	var dismissButton = document.createElement("input");
	dismissButton.type = "button";
	dismissButton.value = "DISMISS";
	dismissButton.style.marginLeft = dismissButton.style.marginRight = "auto";
	dismissButton.style.fontWeight = "bold";
	dismissButton.style.fontSize = "14px";
	dismissButton.style.marginBottom = "10px";
	contentDiv.appendChild(dismissButton);
	this.config;
	this.isBbuMvo2 = false;
	dismissButton.onclick = function(ev) {
		try {
			document.getElementById("deepDischargeDiv").style.display = "none";
			window.parent.navi.deepDischargeButtonClicked = true;
			if (self.isBbuMvo2) {
				self.config.bbu_dismiss_deep_discharge = true;
				var frmcnf = self.config.getFrm();
				var frms = [];
				frms.push({type: 'ctl_conf_str=', frame: frmcnf});
				toolSubmit(frms);
			}
		} catch(e){}
	}
	this.showDeepDischargeMvo2 = function(isDeepDischarge, config) {
		this.isBbuMvo2 = true;
		this.config = config;
		var el = document.getElementById("deepDischargeDiv");
		try {
			if (isBbuSerialMode(config)) {
				el.style.display = (isDeepDischarge? "block":"none");
			} else {
				el.style.display = "none";
			}
		} catch(e){}
	}
	this.clearDeepDischargeButtonClicked = function() {
		if (self.isBbuMvo2) {
			window.parent.navi.deepDischargeButtonClicked = false;
		}
	}
	this.getBox = function() {return this.unitDiv;}
	var self = this;
}
