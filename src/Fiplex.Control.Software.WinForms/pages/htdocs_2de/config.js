var NrOfGralSystemAlarms = 3;

function Config() {
	this.NR_OF_RELAYS_MAX			= 10;
	
	this.resetSoft					= false;
	
	this.delayTimerON				= []; // 7 --> 1boolean/relay ---
	this.latchTimerON				= []; // 7 --> 1boolean/relay ---
	this.delayTimer					= []; // 7 --> 1int/relay ---
	this.latchTimer					= []; // 7 --> 1int/relay ---	
	
	this.device_version_index = 0;

	this.bbu_serial_mode = false;
	this.bbu_type;
	this.bbu_dismiss_deep_discharge;
	

	this.relayLogicConfigNormal	= []; // 7 --> 1boolean/relay ---
	this.globalAlarmsEnabled	= []; //24 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //24 --> 1boolean/alarm ---
	this.bbuAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsInstalled		= []; //16 --> 1boolean/alarm ---
	this.relayAssignGlobalAlarm	= []; //16 alarm x 7 --> 1boolean/relay ---
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
		for (var i=0; i < NrOfGralSystemAlarms; i++ ) {
			this.generalSystemAlarm[i][1].push(false);
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
	this.alarmThrshItems = 9;
	this.alarmThrshData = [];
	for ( var i = 0; i < this.alarmThrshItems; i++ ) {
		this.alarmThrshData.push({ valueThr: 0, hysteresis: 0});
	}
	this.alarmThrshOrder = {
			RX_POWER_FIBER_1: 0,
			RX_POWER_FIBER_2: 1,
			RX_POWER_FIBER_3: 2,
			RX_POWER_FIBER_4: 3,
			RX_POWER_FIBER_5: 4,
			RX_POWER_FIBER_6: 5,
			RX_POWER_FIBER_7: 6,
			RX_POWER_FIBER_8: 7,
			TEMPERATURE: 8
		};

	this.alarmThrshLimits = [
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: -30, max: 0},
		{min: 0, max: 85}
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
			//relay 7: hw fail, high temp
			var alr = [0,1];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][6] = true;
			//relay 7: fiber alarms
			var alr = [16,17,18,19,20,21,22,23];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][6] = true;

		}else{
			//relay 4: hw fail, high temp
			var alr = [0,1];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;
			//relay 4:  fiber alarms
			var alr = [16,17,18,19,20,21,22,23];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;

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

	for (var k=0;k<8;k++){
		this.alarmNames[0].push("Fiber Optic "+(k+1));
	}
	
	this.frm					= "";
	
	this.FOconfigMask = 0;
	this.FOgroupDelayEnable = false;
	this.FOclearErrorCounters = false;

	this.parse = function(s) {
		var str = localStorage.getItem("Factory_"+Prjstr+window.location.host);
		var factory = new Factory(str);
		if (s.length<configLength) return -1;
		
		var i;
		var res;
		var ind = 2; //to ignore device_version_index
		//GENERAL CONFIGURATION
		ind = this.parseGeneral(s,ind,factory);
		//ALARM CONFIGURATION
		ind = this.parseAlarm(s,ind,factory);
		//OTHER CONFIGURATION
		ind = this.parseOtherConf(s,ind,factory);
		
		this.frm = this.getFrm(factory);
	}
	this.parseGeneral = function(s,ind,factory){
		var res;
		this.device_version_index = 0;
		//RESET, clearErrorCounter
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.resetSoft = false;//(res & 0x1)!=0;
		this.FOclearErrorCounters = false;//(res & 0x4)!=0;
		return ind;
	}
	this.parseAlarm = function(s,ind,factory){
		var res,res2;
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

		//GLOBAL ALARM ENABLED
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;

		for (var k=0;k<24;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if ( k < 2 ) {
				this.globalAlarmsInstalled[k] = true;
			} else if ( k >= 8 && k < 15 ) {
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k]; //installed if enabled
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
			this.globalAlarmsInstalled[11]=false;//force RF OFF does not exist in expansion
		}
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
			}
			this.generalSystemAlarm[0][0][k] = (res & 0x80) != 0;
			if (k>=4 && k<6 && !factory.plaAvailable) this.generalSystemAlarm[0][0][k] = false; //path loss gen sys assign forced to unassigned if pla is not available
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
		var nAlarmTh = this.alarmThrshItems;
		for (var k = 0; k < nAlarmTh; k++) {
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
		//EXTERNAL INPUT NAMES
		for (var k=0;k<4;k++){ 
			this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
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
		//GENERAL CONFIGURATION
		cfg += this.getFrmGeneral(factory);
		//ALARM CONFIGURATION
		cfg += this.getFrmAlarm();
		//OTHER CONFIGURATION
		cfg += this.getFrmOtherConf(factory);
		
		//this.frm = cfg; no se actualiza el string al generar para poder guardar conf para tool
		return cfg;
	}
	this.getFrmGeneral = function(factory){
		var res;
		var mask = 0;
		var cfg = "";
		cfg += hexformat(this.device_version_index,2);
		//RESET, clearErrorCounter
		mask = 0;
		if (this.resetSoft) mask|=0x1; //bit0
		if (this.FOclearErrorCounters)  mask|=0x4; //bit2
		cfg += hexformat(mask,2);
		return cfg;
	}
	this.getFrmAlarm = function(){
		var res;
		var mask = 0,mask2 = 0;
		var cfg = "";
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
		//GLOBAL ALARM ENABLED
		for (var k=0, mask=0;k<24;k++){
			if (this.globalAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat((mask & 0xff0000)>>16,2);

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
		var nAlarmTh = this.alarmThrshItems;
		for (var k = 0; k < nAlarmTh; k++) {
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
	this.saveFrameStr = function(sr) {
		localStorage.setItem("Conf"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("Conf"+Prjstr+window.location.host);
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
		// NormalACPower = BBU alarm #0 
		if (!this.relayAssignBbuAlarm[0][relayNr]) {
			return false;
		}
		var alarmsToConsider=[];
		for (var k=0;k<24;k++){ //max: 24 alarms
			var en = k!=15; //alarm[15] do not exist in any device
			en = en && !((k==6||k==7)); //fiber optic 1/2
			alarmsToConsider.push(en);
		}
		// if relaNr is also assigned to other alarm, then it is not "Normal AC Power" exclusive
		for (var k=0;k<alarmsToConsider.length;k++){
			if (alarmsToConsider[k] && this.relayAssignGlobalAlarm[k][relayNr]) {
				return false;
			}
		}
		for (var k=1;k<13;k++){	// skip alarm 0, "Normal AC Power", individual annunciators are not considered
			if (this.bbuAlarmsEnabled[k] && this.relayAssignBbuAlarm[k][relayNr]) {
				return false;
			}
		}
		return true;
	}
	
}
function overallConfigToTextFile(config, factory, tagstr, ethstr, serial, version){
	var cfg = "";
	cfg += "TAG: " + tagstr.trim() + "\n\n";
	cfg += rfConfigToText(config)+ "\n";
	cfg += fiberConfigToText(config) + "\n";
	cfg += alarmSettingsToText(config,factory,version) + "\n";
	if (!factory.ethernetModuleNotInstalled){
		cfg += ethConfigToText(ethstr)+ "\n";
	}
	cfg += getVersionNaviData(factory) + "\n";
	cfg += "SERIAL: " + serial + "\n";
	return cfg;
}
function rfConfigToText(config){
	var cfg = "";
	cfg+="CONFIG GENERAL:\n";
	cfg+="\tType of BBU Connection: " + (config.bbu_serial_mode?"Serial":"Dry Contacts") + "\n";
	var n = config.alarmThrshOrder.TEMPERATURE;
	cfg+="\tTemperature Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
	cfg+="\tTemperature Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
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
function alarmSettingsToText(config,factory,version){
	var j,k;
	var exist_el;
	var cfg = "";
	var gralAlarmNames = ["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","Path Loss 1","Path Loss 2","Fiber Optic 1","Fiber Optic 2","","","","",
						  "General System Alarm 1", "General System Alarm 2", "General System Alarm 3"];
	var bbuAlarmNames = ["Normal AC Power","Loss Normal AC Power","Battery Capacity < 30%","Battery Charger Fail","BBU Communication Error","Charger Temperature","Battery Temperature","Individual Battery Voltage",
							 "Battery Disconnection","System Voltage","Battery Bank Voltage","Battery Deep Discharge","Annunciator 1","Annunciator 2","Annunciator 3","Annunciator 4"];
		cfg+="ALARM/RELAY SETTINGS:\n";
	for (k=0;k<15;k++){
		if (k>=2 && k<12) continue; //no external inputs, osc detect, ant isol, fiber 1/2 remotes, path loss
		cfg+="\tAlarm Enable " + gralAlarmNames[k] + ": " + boolToYN(config.globalAlarmsEnabled[k]) + "\n";
	}
	//Fiber alarms
	for (k=0;k<8;k++){
		cfg+="\tAlarm Enable Fiber Optic "+(k+1)+": " + boolToYN(config.globalAlarmsEnabled[k+16]) + "\n";
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
		if (k>=2 && k<12) continue; //no external inputs, osc detect, ant isol, fiber 1/2 remotes, path loss
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
	//Fiber alarms
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

	cfg+="\tUser Alarm Enable: ";
	for (k=0;k<3;k++)
		cfg+=boolToYN(config.globalAlarmsEnabled[8+k])+", ";		
	cfg = cfg.substring(0,cfg.length-2)+"\n";	
	cfg+="\tUser Alarm Name: ";
	for (k=0;k<3;k++)
		cfg+=config.alarmNames[0][8+k].trim()+", ";
	cfg = cfg.substring(0,cfg.length-2)+"\n";		
	cfg+="\tUser Alarm Polarity: ";
	for (k=0;k<3;k++)
		cfg+=(config.externalAlarmPolarity[k]?"HIGH":"LOW")+", ";	
	cfg = cfg.substring(0,cfg.length-2)+"\n";
	for (k=0;k<3;k++){
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
		if (k>=2 && k<15) continue; //no external inputs, osc detect, ant isol, fiber 1/2 remotes, path loss, no gen sys alarm
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
	//Fiber Alarms
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

	for (k=0;k<3;k++){
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
function fiberConfigToText(config){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	for (var k = 0; k < 8; k++) {
		cfg+="\tOptical Port "+(k+1)+":\n";
		var n = config.alarmThrshOrder.RX_POWER_FIBER_1 + k;
		cfg+="\t\tLoss Of Optical Signal Alarm Threshold (dBm): " + (config.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tLoss Of Optical Signal Alarm Hysteresis (dB): " + (config.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}

function boolToYN(val){
	return (val?"YES":"NO");
}

function isBbuSerialMode(config)
{
	var isSerialMode = false;
	isSerialMode = (config.bbu_serial_mode!=0);
	return isSerialMode;
}
function getNrOfRelaysSupported(config) {
	if (!isBbuSerialMode(config)) return 7;
	if (config.bbu_type == 0) {
		return 7;	// bbu_type == 0 ---> MMS only, do as if dry contacts mode
	} else if (config.bbu_type == 1) {
		return 10; 	// BBU MVO.2 standard
	} else if (config.bbu_type == 2) {
		return 9; 	// BBU MVO.2 high power
	} else {
		return 7;	// default
	}
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
		window.parent.navi.deepDischargeButtonClicked = false;
	}
	this.getBox = function() {return this.unitDiv;}
	this.config;
	var self = this;
}