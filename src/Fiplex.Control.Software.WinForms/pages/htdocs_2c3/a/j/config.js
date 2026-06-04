function ConfigBDA() {
	this.NR_OF_RELAYS_MAX			= 10
	this.CHNR 						= 40;
	this.ADJNR 						= 4;
		
	this.resetSoft					= false;
	
	this.uldlLinkedFreq				= [false,false];
	this.squelchAdjBwMode 			= false;
	this.numberOfFilterNonGrouped	= [[0,0],[0,0]];
	
	this.gainIsolMargin				= [0,0];
	this.oscFeatureEnabled			= [false,false];
	this.runIsolationMeas			= [false,false];
	this.oscTimeThSeconds			= [0,0];
	this.oscRetryTimeHours			= [0,0];
	this.oscActionAfterAlarm		= [0,0];
	this.clearOscAlarm				= [false,false];
	this.allSameSquelch				= [false,false]; //band0/1 [2]
	
	this.firstADJisFirstNet			= false;
	
	this.allChSameBW				= []; //band0/1 ul/dl[2][2]
	this.paEnabled					= []; //band0/1 ul/dl [2][2]
	
	this.sqChEnabled				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR] en UL NB se utiliza CH0 para el que aplica a todos los filtros
	this.sqChThreshold				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR] en UL NB se utiliza CH0 para el que aplica a todos los filtros
	
	this.gain						= []; //band0/1 ul/dl [2][2]
	this.power						= []; //band0/1 ul/dl [2][2]
	
	this.filterEnabled				= []; // nb/adj ul/dl band0/1 ul/dl nfilter [2][2][2][this.CHNR]
	this.isFilterGrouped			= []; // band0/1 ul/dl nfilter [2][2][this.CHNR]
	this.bwIndex					= []; // band0/1 ul/dl nfilter [2][2][this.CHNR]
	this.bwKHz						= []; // band0/1 ul/dl nfilter [2][2][this.CHNR]
	this.freqHz						= []; // band0/1 ul/dl nfilter [2][2][this.CHNR]
	this.fineGainFilter				= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR]
	this.filterBand 				= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR] provisional band is kept as a matrix dimension
	
	this.fstartHzAdjFilter			= []; // band0/1 ul/dl nfilter [2][2][4]
	this.fstopHzAdjFilter			= []; // band0/1 ul/dl nfilter [2][2][4]
	
	this.delayTimerON				= []; // 8 --> 1boolean/relay ---
	this.latchTimerON				= []; // 8 --> 1boolean/relay ---
	this.delayTimer					= []; // 8 --> 1int/relay ---
	this.latchTimer					= []; // 8 --> 1int/relay ---	
	
	this.autoUlPaOffTimer			= 0;
	this.extremeTempAction 			= 0;
	this.forcePaOn					= []; //band0/1 ul/dl [2][2]
	this.forcePaOff					= []; //band0/1 ul/dl [2][2]	
	this.agcBandMode 				= [0,0]; //band0/1 only UL: 0-stable coverage, 1-max power, 2-hybrid mode
	this.controlChannel 			= [];
	this.cn_threshold_nb 			= [];	// band0/1 [2]
	this.cn_threshold_adj 			= [];	// band0/1 nfilter [2][4]
	this.cnToSquelchThresholdDefault= 5;	// para aplicar en assisted gui
	this.base_station_power 		= [];	// // 0-700, 1-800, 2-Band14 [3]
	this.base_station_sensitivity 	= [];	// // 0-700, 1-800, 2-Band14 [3]
	this.automatic_ul_gain_reset 	= false;
	this.automatic_ul_gain_running;
	this.forceDLMaxGain = false;
	this.bbu_serial_mode = true;
	this.bbu_type;
	this.bbu_dismiss_deep_discharge;
	this.backOff					= [7.8,7.8]; //band0/1 only UL: back-off in dB when hybrid mode is selected

	this.externalPA					= false;

	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}	
	
	for (var nbadj=0;nbadj<2;nbadj++){
		this.filterEnabled.push([]);
		this.fineGainFilter.push([]);
		this.filterBand.push([]);
		this.sqChEnabled.push([]);
		this.sqChThreshold.push([]);
		for (var band=0;band<2;band++){
			this.filterEnabled[nbadj].push([]);
			this.fineGainFilter[nbadj].push([]);
			this.filterBand[nbadj].push([]);
			this.sqChEnabled[nbadj].push([]);
			this.sqChThreshold[nbadj].push([]);			
			for (var uldl=0;uldl<2;uldl++){
				this.filterEnabled[nbadj][band].push([]);
				this.fineGainFilter[nbadj][band].push([]);
				this.filterBand[nbadj][band].push([]);
				this.sqChEnabled[nbadj][band].push([]);
				this.sqChThreshold[nbadj][band].push([]);					
				for (var ch=0;ch<this.CHNR;ch++){
					this.filterEnabled[nbadj][band][uldl].push(false);
					this.fineGainFilter[nbadj][band][uldl].push(0);
					this.filterBand[nbadj][band][uldl].push(0);
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
		this.gain.push([]);					
		this.power.push([]);					
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
			this.gain[band].push(0);					
			this.power[band].push(0);
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
	for (var band=0;band<2;band++){
		this.cn_threshold_nb.push(0);
		this.cn_threshold_adj.push([]);
		for (var ch=0;ch<this.ADJNR;ch++){
			this.cn_threshold_adj[band].push(0);
		}
	}
	// auto-ajuste Base Station, band=2 es firstNet
	for (var band=0;band<3;band++){
		this.base_station_power.push(0);
		this.base_station_sensitivity.push(0);
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
	this.GmainRange = [-40, -40];
	this.limitPowerRange = [20, 20];
	this.limitgFine = [
		{MIN: -40,	MAX: 0},
		{MIN: -40,	MAX: 0}
	];
	this.limitAbnSqTime = {MIN: 10,	MAX: 2400};
	this.limitRetryTime = {MIN: 0,	MAX: 48};
	this.limitAutoPaUlOffTime = {MIN: 1,	MAX: 60000};
	this.cnAlarmTime;
	this.limitCnAlarmTime = {MIN: 10, MAX: 2400};
	this.limitBackOff = {MIN: 0, MAX: 25};
	
	this.parse = function(s) {
		if (s.length<8) return -2; //blocked
		if (s.length!=1946) return -1; 
		var i;
		var res;
		var ind = 0;
		this.frm = s;
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		var fband;
		//RESET
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.resetSoft = false;//(res & 0x1)!=0;
		this.automatic_ul_gain_reset = false;
		for (var b=0;b<2;b++){ //Band0/1
			//LINKEDULDL, EXTERNAL PA AND SQUELCHADJBWMODE
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.uldlLinkedFreq[b] = (res & 0x1)==0;
			//se fuerza a false si bw ul/dl no son iguales
			if ((factory.fstop[2*b+1]-factory.fstart[2*b+1])!=(factory.fstop[2*b]-factory.fstart[2*b])) this.uldlLinkedFreq[b]=false;
			if (b==0){
				this.squelchAdjBwMode = (res & 0x40)!=0;
				this.externalPA = (res & 0x02)!=0;
			}
			//OSCFEATURE GENERAL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			if (b==0){
				this.oscActionAfterAlarm[0] = (res & 0x3);
				if (this.oscActionAfterAlarm[0]==3) this.oscActionAfterAlarm[0]=2;
				this.clearOscAlarm[0] = false;//(res & 0x4)!=0;
				this.oscFeatureEnabled[0] = (res & 0x8)!=0;
				this.runIsolationMeas[0] = false;//(res & 0x10)!=0;
				this.automatic_ul_gain_running = (res & 0x40)!=0;
			}
			if (b==1) {
				this.bbu_serial_mode = (res & 0x01);
				this.bbu_type = ((res >> 1) & 0x07);
				this.bbu_dismiss_deep_discharge = (res & 0x10);
				this.bbu_dismiss_deep_discharge = false; 	// write-only
			}
			//GAINISOLMARGIN
			this.gainIsolMargin[b] = 20; ind+=2;//parseInt(s.substring(ind,ind+2), 16); ind+=2;
			//OSCTIMETH
			this.oscTimeThSeconds[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			//OSCRETRYTIME
			this.oscRetryTimeHours[b] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			for (var i=0;i<2;i++){//UL/DL
				//SQEN,SAMEBW,PAON
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (i==0 && b==0) this.firstADJisFirstNet = (res & 0x40)!=0;
				if (i==0) this.sqChEnabled[0][b][0][0] = (res & 0x10)!=0;
				if (i==1) {
					// AGC BAND MODE
					this.agcBandMode[b] = (res >> 2) & 0x3; // 0 NORMAL, 1 MAX POWER, 2 HYBRID MODE
					if (this.agcBandMode[b] > 2) this.agcBandMode[b] = 2;

				}
				this.allChSameBW[b][i] = (res & 0x20)!=0;
				if (i==1) this.allSameSquelch[b] =  (res & 0x40)!=0;
				this.paEnabled[b][i] = (res & 0x80)!=0;
				this.forcePaOn[b][i] = false;
				this.forcePaOff[b][i] = false;					
				if (i==0 && b==0) this.extremeTempAction = ((res & 0x0C) >> 2);
				//SQTH
				if (i==0){
					res = parseInt(s.substring(ind,ind+2), 16); if (res>127) res-=256;
					this.sqChThreshold[0][b][0][0] = res;
				} else {
					res = parseInt(s.substring(ind,ind+2), 16); if (res>127) res-=256;
					this.controlChannel[b] = res;
				}
				ind+=2;
				//GAIN
				this.gain[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				//POWER
				this.power[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if (this.power[b][i]>127) this.power[b][i]-=256;				
				//SQENADJ,CHONADJ
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var ch=0;ch<this.ADJNR;ch++){
					this.sqChEnabled[1][b][i][ch] = (res & (1<<ch))!=0;
				}
				for (var ch=0;ch<this.ADJNR;ch++){
					this.filterEnabled[1][b][i][ch] = (res & (1<<(ch+4)))==0;
				}

				this.numberOfFilterNonGrouped[b][i] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				
				for (var ch=0;ch<32;ch++){//32 first CH
					//CHON,GROUPED,BW
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					this.filterEnabled[0][b][i][ch] = (res & 0x80)==0;
					this.isFilterGrouped[b][i][ch] = (res & 0x40)!=0;
					this.bwIndex[b][i][ch] = (res & 0x7);
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(res & 0x7);
					//FINE GAIN and FILTER BAND
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					fband = (res >> 7) & 0x1;
					this.filterBand[0][b][i][ch] = fband;
					if (!factory.chBandEnabled[fband] && !(factory.isClassB() && factory.adjBandEnabled[fband])){
						this.filterEnabled[0][b][i][ch] = false; // if band not enabled, force filter disabled
					}
					this.fineGainFilter[0][b][i][ch] = res & 0x7f;
					if (this.fineGainFilter[0][b][i][ch]>63) this.fineGainFilter[0][b][i][ch]-=128;
					//FREQ
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.freqHz[b][i][ch] = factory.fref[2*fband+i]+res*factory.fstep;
				}
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					//FINE GAIN
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					fband = (res >> 7) & 0x1;
					this.filterBand[1][b][i][ch] = fband;
					if (!factory.adjBandEnabled[fband]){
						this.filterEnabled[1][b][i][ch] = false; // if band not enabled, force filter disabled
					}
					this.fineGainFilter[1][b][i][ch] = res & 0x7f;
					if (this.fineGainFilter[1][b][i][ch]>63) this.fineGainFilter[1][b][i][ch]-=128;
					//FSTART
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.fstartHzAdjFilter[b][i][ch] = factory.fref[2*fband+i]+res*factory.fstepAdj;
					//FSTOP
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.fstopHzAdjFilter[b][i][ch] = factory.fref[2*fband+i]+res*factory.fstepAdj;
				}
			}
		}
		//Squelchs
		for (b=0;b<2;b++){
			for (var ch=0;ch<32;ch++){//32CH first channelss
				res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
				this.sqChThreshold[0][b][1][ch] = res;
			}
			for (i=0;i<2;i++){
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
					this.sqChThreshold[1][b][i][ch] = res;
				}
			}
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<32;ch++){//32CH first channels
				this.sqChEnabled[0][b][1][ch] = (res & (1<<ch))!=0;
			}
		}
		this.autoUlPaOffTimer = parseInt(s.substr(ind,4), 16); ind+=4;	
		// umbrales C/N	
		for (var band=0;band<2;band++){
			res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
			this.cn_threshold_nb[band] = res;
			for (var ch=0;ch<this.ADJNR;ch++){
				res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
				this.cn_threshold_adj[band][ch] = res;
			}
		}
		// auto-ajuste base station, band=2 es firstNet
		for (var band=0;band<3;band++){
			res = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
			this.base_station_power[band] = res;
			res = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
			this.base_station_sensitivity[band] = res;
		}
		// tiempo que tienen que mantenerse la señal de UL por encima de C/N Threshold para dar alarma de C/N
		this.cnAlarmTime = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		
		//conf timers NFPA
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerON[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerON[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		//16 Extra channel filter config
		for (i=0;i<2;i++){//UL/DL
			for (b=0;b<2;b++){ //Band0/1
				for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
					//CHON,GROUPED,BW
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					this.filterEnabled[0][b][i][ch] = (res & 0x80)==0;
					this.isFilterGrouped[b][i][ch] = (res & 0x40)!=0;
					this.bwIndex[b][i][ch] = (res & 0x7);
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(res & 0x7);
					//FINE GAIN and FILTER BAND
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					fband = (res >> 7) & 0x1;
					this.filterBand[0][b][i][ch] = fband;
					if (!factory.chBandEnabled[fband] && !(factory.isClassB() && factory.adjBandEnabled[fband])){
						this.filterEnabled[0][b][i][ch] = false; // if band not enabled, force filter disabled
					}
					this.fineGainFilter[0][b][i][ch] = res & 0x7f;
					if (this.fineGainFilter[0][b][i][ch]>63) this.fineGainFilter[0][b][i][ch]-=128;
					//FREQ
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.freqHz[b][i][ch] = factory.fref[2*fband+i]+res*factory.fstep;
				}
			}
		}
		//16 Extra channel squelch threshold config
		for (b=0;b<2;b++){ //Band0/1
			for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
				res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
				this.sqChThreshold[0][b][1][ch] = res;
			}
		}
		//16 Extra channel squelch enabled config
		for (b=0;b<2;b++){ //Band0/1
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
				this.sqChEnabled[0][b][1][ch] = (res & (1<<(ch-32)))!=0;
			}
		}
		//back-off
		for (b=0;b<2;b++){ //Band0/1
			res = parseInt(s.substring(ind,ind+=2), 16);
			this.backOff[b] = res / 10.0;
		} 
	}
	this.getFrm = function(){
		var i;
		var res;
		var mask = 0;
		var b,ch;
		var cfg = "";
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		var fband;
		//RESET
		if (this.resetSoft) mask = 1;
		cfg += hexformat(mask,2);	
		for (b=0;b<2;b++){ //Band0/1
			//LINKEDULDL, EXTERNAL PA AND SQUELCHADJBWMODE
			mask=0;
			if (!this.uldlLinkedFreq[b]) mask|=0x1;
			if (b==0){
				if (this.externalPA) mask|=0x02;
				if (factory.isClassB() && this.squelchAdjBwMode) { // squelch Adj.BW mode only if allowed in factory
					mask|=0x40;
				}
			}
			cfg += hexformat(mask,2);	
			//OSCFEATURE GENERAL
			mask = 0;
			if (b==0){
				mask=this.oscActionAfterAlarm[0] & 0x3;
				if (this.clearOscAlarm[0]) mask|=0x4;
				if (this.oscFeatureEnabled[0]) mask|=0x8;
				if (this.runIsolationMeas[0]) mask|=0x10;
			}
			if (b==0){
				if (this.forceDLMaxGain) mask|=0x80;
				if (this.automatic_ul_gain_reset) mask|=0x20;
				if (this.automatic_ul_gain_running) mask|= 0x40;
			}
			if (b==1) {
				if (this.bbu_serial_mode) mask|=0x01;
				mask |= ((this.bbu_type & 0x07) << 1);
				if (this.bbu_dismiss_deep_discharge) mask |= 0x10;
			}
			cfg += hexformat(mask,2);	
			//GAINISOLMARGIN
			cfg += hexformat(this.gainIsolMargin[b],2);
			//OSCTIMETH
			cfg += hexformat(this.oscTimeThSeconds[b],4);
			//OSCRETRYTIME
			cfg += hexformat(this.oscRetryTimeHours[b],4);
			
			for (i=0;i<2;i++){//UL/DL
				//SQEN,SAMEBW,PAON
				mask=0;
				if (i==0 && b==0){
					if (this.firstADJisFirstNet) mask|=0x40;
					mask |= (this.extremeTempAction << 2) & 0x0C;
				}
				if (i==0){
					if (this.sqChEnabled[0][b][0][0]) mask|=0x10;
				}
				if (i==1) {
					// AGC BAND MODE bits
					if (this.agcBandMode[b] > 2) this.agcBandMode[b] = 2;
					mask |= (this.agcBandMode[b] & 0x3) <<2;  // 0 NORMAL, 1 MAX POWER, 2 HYBRID MODE

				}
				if (this.allChSameBW[b][i]) mask|=0x20;
				if (i==1){
					if (this.allSameSquelch[b])  mask|=0x40;
				}
				if (this.paEnabled[b][i]) mask|=0x80;
				if (this.forcePaOff[b][i]) mask|=0x1;
				if (this.forcePaOn[b][i]) mask|=0x2;
				
				cfg += hexformat(mask,2);
				//SQTH
				res=0;
				if (i==0){
					res=this.sqChThreshold[0][b][0][0];if (res<0) res+=256;	
				} else {
					res=this.controlChannel[b]; if (res<0) res+=256;
				}
				cfg += hexformat(res,2);
				//GAIN
				cfg += hexformat(this.gain[b][i],2);
				//POWER
				res= this.power[b][i];if (res<0) res+=256;
				cfg += hexformat(res,2);
				//SQENADJ,CHONADJ
				mask=0;
				for (ch=0;ch<4;ch++){
					if (this.sqChEnabled[1][b][i][ch]) mask|=(1<<ch);
				}
				for (ch=0;ch<4;ch++){
					if (!this.filterEnabled[1][b][i][ch]) mask|=(1<<(ch+4));
				}
				cfg += hexformat(mask,2);
				cfg += hexformat(this.numberOfFilterNonGrouped[b][i],2);
				
				for (ch=0;ch<32;ch++){//32CH first channels
					mask=0;
					//CHON,GROUPED,BW
					if (!this.filterEnabled[0][b][i][ch]) mask|=0x80;
					if (this.isFilterGrouped[b][i][ch]) mask|=0x40;
					mask|=this.bwIndex[b][i][ch] & 0x7;
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(this.bwIndex[b][i][ch]);
					cfg += hexformat(mask,2);
					//FINE GAIN and FILTER BAND
					res=this.fineGainFilter[0][b][i][ch];if (res<0) res+=128;
					res = res & 0x7f;
					fband = this.filterBand[0][b][i][ch];
					res |= (fband & 0x1) << 7;
					cfg += hexformat(res,2);
					//FREQ
					res = ~~Math.round((this.freqHz[b][i][ch]-factory.fref[2*fband+i])/factory.fstep);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
				for (ch=0;ch<4;ch++){//4ADJ
					//FINE GAIN and FILTER BAND
					res=this.fineGainFilter[1][b][i][ch];if (res<0) res+=128;
					res = res & 0x7f;
					fband = this.filterBand[1][b][i][ch];
					res |= (fband & 0x1) << 7;
					cfg += hexformat(res,2);
					//FSTART
					res =~~Math.round((this.fstartHzAdjFilter[b][i][ch]-factory.fref[2*fband+i])/factory.fstepAdj);if (res<0) res+=65536;
					cfg += hexformat(res,4);
					//FSTOP
					res =~~Math.round((this.fstopHzAdjFilter[b][i][ch]-factory.fref[2*fband+i])/factory.fstepAdj);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
			}
		}
		//Squelchs
		for (b=0;b<2;b++){
			for (var ch=0;ch<32;ch++){//32CH first channels
				res = this.sqChThreshold[0][b][1][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
			for (i=0;i<2;i++){
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					res = this.sqChThreshold[1][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(res,2);
				}
			}
			mask = 0;
			for (var ch=16;ch<32;ch++){//16 second channels. CH 16-31
				if (this.sqChEnabled[0][b][1][ch])  mask|=1<<(ch-16);
			}
			cfg += hexformat(mask,4);
			mask = 0;
			for (var ch=0;ch<16;ch++){//16 first channels. CH 0-15
				if (this.sqChEnabled[0][b][1][ch]) mask|=1<<ch;
			}
			cfg += hexformat(mask,4);			
			
		}
		cfg += hexformat(this.autoUlPaOffTimer,4);
		// umbrales C/N		
		for (var band=0;band<2;band++){
			res = this.cn_threshold_nb[band];
			if (res < -128) {
				res = -128;
			} else if (res > 127) {
				res = 127;
			}
			if (res < 0) res += 256;
			cfg += hexformat(res,2);
			for (var ch=0;ch<this.ADJNR;ch++){
				res = this.cn_threshold_adj[band][ch];
				if (res < -128) {
					res = -128;
				} else if (res > 127) {
					res = 127;
				}
				if (res < 0) res += 256;
				cfg += hexformat(res,2);
			}
		}
		// auto-ajuste base station, band=2 es firstNet
		for (var band=0;band<3;band++){
			res = double_to_uint(this.base_station_power[band]);
			cfg += hexformat(res,4);
			res = double_to_uint(this.base_station_sensitivity[band]);
			cfg += hexformat(res,4);
		}
		cfg += hexformat(this.cnAlarmTime,4);
		//timers NFPA
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
		//16 Extra channel filter config
		for (i=0;i<2;i++){//UL/DL
			for (b=0;b<2;b++){ //Band0/1
				for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
					mask=0;
					//CHON,GROUPED,BW
					if (!this.filterEnabled[0][b][i][ch]) mask|=0x80;
					if (this.isFilterGrouped[b][i][ch]) mask|=0x40;
					mask|=this.bwIndex[b][i][ch] & 0x7;
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(this.bwIndex[b][i][ch]);
					cfg += hexformat(mask,2);
					//FINE GAIN and FILTER BAND
					res=this.fineGainFilter[0][b][i][ch];if (res<0) res+=128;
					res = res & 0x7f;
					fband = this.filterBand[0][b][i][ch];
					res |= (fband & 0x1) << 7;
					cfg += hexformat(res,2);
					//FREQ
					res = ~~Math.round((this.freqHz[b][i][ch]-factory.fref[2*fband+i])/factory.fstep);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
			}
		}
		//16 Extra channel squelch threshold config
		for (b=0;b<2;b++){ //Band0/1
			for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
				res = this.sqChThreshold[0][b][1][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
		}
		//16 Extra channel squelch enabled config
		for (b=0;b<2;b++){ //Band0/1
			mask = 0;
			for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
				if (this.sqChEnabled[0][b][1][ch]) mask|=1<<(ch-32);
			}
			cfg += hexformat(mask,2);
		}
		//back-off
		for (b=0;b<2;b++){ //Band0/1
			mask = ~~Math.round(this.backOff[b] * 10.0);
			cfg += hexformat(mask,2);
		} 
		this.frm = cfg;
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
		localStorage.setItem("Conf"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("Conf"+Prjstr+window.location.host);
	}

	this.compare = function(cnf) {
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		
		if (this.runIsolationMeas[0]!=cnf.runIsolationMeas[0]) return 0;
		if (this.clearOscAlarm[0]!=cnf.clearOscAlarm[0]) return 1;
		if (this.firstADJisFirstNet!=cnf.firstADJisFirstNet) return 2;
		if (this.autoUlPaOffTimer!=cnf.autoUlPaOffTimer) return 3;
		if (this.extremeTempAction!=cnf.extremeTempAction) return 4;
		if (this.oscFeatureEnabled[0]!=cnf.oscFeatureEnabled[0]) return 9;
		if (this.oscActionAfterAlarm[0]!=cnf.oscActionAfterAlarm[0]) return 12;
		for (var band=0;band<2;band++){
			if (this.uldlLinkedFreq[band]!=cnf.uldlLinkedFreq[band]) return 5;
			if (this.gainIsolMargin[band]!=cnf.gainIsolMargin[band]) return 8;
			if (this.oscTimeThSeconds[band]!=cnf.oscTimeThSeconds[band]) return 10;
			if (this.oscRetryTimeHours[band]!=cnf.oscRetryTimeHours[band]) return 11;
			if (this.allSameSquelch[band]!=cnf.allSameSquelch[band]) return 13;
			if (this.controlChannel[band]!=cnf.controlChannel[band]) return 14;
			for (var ud=0;ud<2;ud++){
				if (this.forcePaOff[band][ud]!=cnf.forcePaOff[band][ud]) return 15;
				if (this.forcePaOn[band][ud]!=cnf.forcePaOn[band][ud]) return 16;
				if (this.numberOfFilterNonGrouped[band][ud]!=cnf.numberOfFilterNonGrouped[band][ud]) return 17;
				if (this.allChSameBW[band][ud]!=cnf.allChSameBW[band][ud]) return 18;
				if (this.paEnabled[band][ud]!=cnf.paEnabled[band][ud]) return 19;
				if (this.gain[band][ud]!=cnf.gain[band][ud]) return 20;
				if (this.power[band][ud]!=cnf.power[band][ud]) return 21;
				for (var ch=0;ch<this.CHNR;ch++){
					if (this.bwIndex[band][ud][ch]!=cnf.bwIndex[band][ud][ch]) return 22;
					if (this.isFilterGrouped[band][ud][ch]!=cnf.isFilterGrouped[band][ud][ch]) return 23;
					if (this.freqHz[band][ud][ch]!=cnf.freqHz[band][ud][ch]) return 24;
					for (var na=0;na<2;na++){
						if (na==1 || ud==1 || ch==0){
							if (this.sqChEnabled[na][band][ud][ch]!=cnf.sqChEnabled[na][band][ud][ch]) return 25;
							if (this.sqChThreshold[na][band][ud][ch]!=cnf.sqChThreshold[na][band][ud][ch]) return 26;
						}
						if (this.filterEnabled[na][band][ud][ch]!=cnf.filterEnabled[na][band][ud][ch]) return 27;
						if (this.fineGainFilter[na][band][ud][ch]!=cnf.fineGainFilter[na][band][ud][ch]) return 28;
						if (this.filterBand[na][band][ud][ch]!=cnf.filterBand[na][band][ud][ch]) return 43;		
					}
				}
				for (var ch=0;ch<factory.numADJFilters;ch++){
					if (this.fstartHzAdjFilter[band][ud][ch]!=cnf.fstartHzAdjFilter[band][ud][ch]) return 29;
					if (this.fstopHzAdjFilter[band][ud][ch]!=cnf.fstopHzAdjFilter[band][ud][ch]) return 30;
				}
			}
			if (this.agcBandMode[band]!=cnf.agcBandMode[band]) return 31;
			if (this.cn_threshold_nb[band]!=cnf.cn_threshold_nb[band]) return 32;
			for (var ch=0;ch<factory.numADJFilters;ch++){
				if (this.cn_threshold_adj[band][ch]!=cnf.cn_threshold_adj[band][ch]) return 33;
			}
			if (this.base_station_power[band]!=cnf.base_station_power[band]) return 34;
			if (this.base_station_sensitivity[band]!=cnf.base_station_sensitivity[band]) return 35;
		}
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			if (this.delayTimerON[k]!=cnf.delayTimerON[k]) return 36;
			if (this.latchTimerON[k]!=cnf.latchTimerON[k]) return 37;
			if (this.delayTimer[k]!=cnf.delayTimer[k]) return 38;
			if (this.latchTimer[k]!=cnf.latchTimer[k]) return 39;

		}
		if (this.cnAlarmTime!=cnf.cnAlarmTime) return 40;
		if (this.bbu_serial_mode != cnf.bbu_serial_mode) return 41;
		if (this.bbu_type != cnf.bbu_type) return 42;
		return -1;
	}
}

function NFPAconf(){
	this.NR_OF_RELAYS_MAX		= 10;
	this.retLossTh				= [0,0];
	this.minPowerVSWR			= [0,0];
	this.alarmNumSens			= [0,0];
	this.timeTxLowPowHigh		= [0,0];
	this.timeTxLowPowLow		= [0,0];
	this.antennaDisconnectionThreshold = 0;
	this.relayLogicConfigNormal	= []; // 8 --> 1boolean/relay ---
	this.globalAlarmsEnabled	= []; //16 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //16 --> 1boolean/alarm ---
	this.bandAlarmsEnabled		= []; // 8 --> 1boolean/alarm ---
	this.bandAlarmsInstalled	= []; // 8 --> 1boolean/alarm ---
	this.bbuAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bbuAlarmsInstalled		= []; //16 --> 1boolean/alarm ---
	this.relayAssignGlobalAlarm	= []; //16 alarm x 8 --> 1boolean/relay ---
	this.relayAssignBandAlarm	= []; //8 alarm x 8 --> 1boolean/relay ---
	this.relayAssignBbuAlarm	= []; //16 alarm x 8 --> 1boolean/relay ---
	this.delayTimerON			= []; // 8 --> 1boolean/relay ---
	this.latchTimerON			= []; // 8 --> 1boolean/relay ---
	this.delayTimer				= []; // 8 --> 1int/relay ---
	this.latchTimer				= []; // 8 --> 1int/relay ---
	this.alarmNames				= [["HW Fail","High.Temp","Antenna Isolation","Oscillation Detection","UL PA Fail","Antenna Disconnection","Undefined","Undefined",
								    "External Input 1","External Input 2","External Input 3","Force RF OFF","Undefined","Undefined","Undefined","Undefined"],
								   ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","Rx Power Low","DL AGC Fail","C/N UL Low","","","","","","","",""],
								   ["Normal AC Power","Loss Normal AC Power","Battery Capacity Under 30%","Battery Charger Fail","BBU Communication Error","Charger Temperature","Battery Temperature","Individual Battery Voltage",
								    "Battery Disconnection","System Voltage","Battery Bank Voltage","Battery Deep Discharge","Annunciator 1","Annunciator 2","Annunciator 3","Annunciator 4"]];
	this.externalAlarmPolarity 	= [];
	this.buzzerMuteCommand = 0;
	this.buzzerMuteTime = 0;
	//define vector/matrix
	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
		this.relayLogicConfigNormal.push(true);
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.delayTimer.push(0);
	}
	for (var k=0;k<16;k++){
		this.globalAlarmsEnabled.push(false);
		this.globalAlarmsInstalled.push(false);
		this.relayAssignGlobalAlarm.push([]);
		for (var j=0;j<this.NR_OF_RELAYS_MAX;j++) this.relayAssignGlobalAlarm[k].push(false);
	}
	for (var k = 0; k < 4; k++) {
		this.externalAlarmPolarity.push(false);
	}
	for (var k=0;k<8;k++){
		this.bandAlarmsEnabled.push(false);
		this.bandAlarmsInstalled.push(false);
	}
	for (var k=0;k<8;k++){
		this.relayAssignBandAlarm.push([]);
		for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
			this.relayAssignBandAlarm[k].push(false);
		}
	}
	for (var k=0;k<16;k++){
		this.bbuAlarmsEnabled.push(false);
		this.bbuAlarmsInstalled.push(false);
	}
	for (var k=0;k<16;k++){
		this.relayAssignBbuAlarm.push([]);
		for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
			this.relayAssignBbuAlarm[k].push(false);
		}
	}
	this.frm					= "";
	this.parse = function(s) {
		if (s.length<8) return -2; //blocked
		if (s.length!=584) return -1; 
		var res,res2;
		var ind = 0;
		this.frm = s;
		for (var k=0;k<2;k++){
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;	if (res>32767) res-=65536;
			this.retLossTh[k] = res/100;
			res = parseInt(s.substring(ind,ind+4), 16); ind+=4;	if (res>32767) res-=65536;
			this.minPowerVSWR[k] = res/100;
			this.alarmNumSens[k] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		}
		for (var k=0;k<2;k++){
			this.timeTxLowPowHigh[k] = parseInt(s.substring(ind,ind+6), 16); ind+=6;
			this.timeTxLowPowLow[k]  = parseInt(s.substring(ind,ind+6), 16); ind+=6;
		}
		this.antennaDisconnectionThreshold   = cSignedByte(parseInt(s.substring(ind,ind+2), 16)); ind+=2;
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.relayLogicConfigNormal[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			// if (k==2 || k==3) this.globalAlarmsEnabled[k]= true; //Alarmas Antenna Isolation y Oscillation detection siempre "Enabled"
			if (k==3) this.globalAlarmsEnabled[k]= true; //Alarmas Oscillation detection siempre "Enabled"
			//this.globalAlarmsInstalled[k] = (res2 & (1<<k))!=0;
			if ( k < 6 ) {
				this.globalAlarmsInstalled[k] = true;
			// } else if ( k >= 8 && k <= 12 ) { // para añadir door open usar esta linea
			} else if ( k >= 8 && k < 12 ) {
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.bandAlarmsEnabled[k] = (res & (1<<k))!=0;
			//this.bandAlarmsInstalled[k] = (res2 & (1<<k))!=0;
			this.bandAlarmsInstalled[k] = (k<8); //Se fuerzan "available" las 8 primeras
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++){
			this.bbuAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k<12) {
				this.bbuAlarmsInstalled[k] = true;
			} else if (k>11) {
				this.bbuAlarmsInstalled[k] = (res2 & (1<<k))!=0; //this.bbuAlarmsEnabled[k];
			}
		}
		for (var k=0;k<16;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<8;j++){
				this.relayAssignGlobalAlarm[k][j] = (res & (1<<j))!=0;
			}
		}
		for (var k=0;k<8;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<8;j++){
				this.relayAssignBandAlarm[k][j] = (res & (1<<j))!=0;
			}
		}
		for (var k=0;k<16;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<8;j++){
				this.relayAssignBbuAlarm[k][j] = (res & (1<<j))!=0;
			}
		}

		for (var k=0;k<16;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2;
			for (var j=0;j<2;j++){
				this.relayAssignGlobalAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
			}
		}
		for (var k=0;k<8;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2;
			for (var j=0;j<2;j++){
				this.relayAssignBandAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
			}
		}
		for (var k=0;k<16;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			res = parseInt(s.substring(ind,ind+2), 16); if (m==6) ind+=2;
			for (var j=0;j<2;j++){
				this.relayAssignBbuAlarm[k][8+j] = (res & (1<<(j+m)))!=0;
			}
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<4;k++){
			this.externalAlarmPolarity[k] = (res & (1<<k)) != 0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.buzzerMuteCommand = 0;
		this.buzzerMuteTime = parseInt(s.substring(ind,ind+8), 16); ind+=8;
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerON[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerON[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		for (var k=0;k<3;k++){ 
			this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
		ind+=30;
		for (var k=0;k<4;k++){ 
			this.alarmNames[2][12+k] = s.substring(ind,ind+30).trim();ind+=30;
		}
	}
	this.getFrm = function(){
		var res;
		var mask = 0, mask2=0;
		var b,ch;
		var cfg = "";
		for (var k=0;k<2;k++){
			res = ~~Math.round(100*this.retLossTh[k]); if (res<0) res+=65536;
			cfg += hexformat(res,4);
			res = ~~Math.round(100*this.minPowerVSWR[k]); if (res<0) res+=65536;
			cfg += hexformat(res,4);			
			cfg += hexformat(this.alarmNumSens[k],4);
		}
		for (var k=0;k<2;k++){
			cfg += hexformat(this.timeTxLowPowHigh[k],6);
			cfg += hexformat(this.timeTxLowPowLow[k],6);
		}
		if (this.antennaDisconnectionThreshold < -128) {
			this.antennaDisconnectionThreshold = -128;
		} else if (this.antennaDisconnectionThreshold > 127) {
			this.antennaDisconnectionThreshold = 127;
		}
		cfg += hexformat(rSignedByte(this.antennaDisconnectionThreshold),2);
		for (var k=0, mask=0 ;k<8;k++){
			if (this.relayLogicConfigNormal[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask,2);
		for (var k=0, mask=0;k<16;k++){
			if (this.globalAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		for (var k=0, mask=0;k<16;k++){
			if (this.globalAlarmsInstalled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		for (var k=0,mask=0,mask2=0;k<8;k++){
			if (this.bandAlarmsEnabled[k]) mask|= 1<<k;
			if (this.bandAlarmsInstalled[k]) mask2|= 1<<k;
		}
		cfg += hexformat(mask,2);
		cfg += hexformat(mask2,2);
		for (var k=0,mask=0,mask2=0;k<16;k++){
			if (this.bbuAlarmsEnabled[k]) mask|= 1<<k;
			if (this.bbuAlarmsInstalled[k]) mask2|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat(mask2 & 0xff,2);
		cfg += hexformat((mask2 & 0xff00)>>8,2);
		for (var k=0;k<16;k++){
			for (var j=0,mask=0;j<this.NR_OF_RELAYS_MAX;j++){
				if (this.relayAssignGlobalAlarm[k][j]) mask|= 1<<j;
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0;k<8;k++){
			for (var j=0,mask=0;j<8;j++){
				if (this.relayAssignBandAlarm[k][j]) mask|= 1<<j;
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0;k<16;k++){
			for (var j=0,mask=0;j<8;j++){
				if (this.relayAssignBbuAlarm[k][j]) mask|= 1<<j;
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0, mask2=0;k<16;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			for (var j=0,mask=0;j<2;j++){
				if (this.relayAssignGlobalAlarm[k][8+j]) mask|= 1<<j;
			}
			mask2 |= (mask << m);
			if (m==6) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		for (var k=0, mask2=0;k<8;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			for (var j=0,mask=0;j<2;j++){
				if (this.relayAssignBandAlarm[k][8+j]) mask|= 1<<j;
			}
			mask2 |= (mask << m);
			if (m==6) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		for (var k=0, mask2=0;k<16;k++){
			var n = ~~Math.floor(k/4);
			var m = (k - n*4)*2;
			for (var j=0,mask=0;j<2;j++){
				if (this.relayAssignBbuAlarm[k][8+j]) mask|= 1<<j;
			}
			mask2 |= (mask << m);
			if (m==6) {
				cfg += hexformat(mask2,2);
				mask2 = 0;
			}
		}
		for (var j=0,mask=0;j<4;j++){
			if (this.externalAlarmPolarity[j]) mask|= 1<<j;
		}
		cfg += hexformat(mask,2);
		cfg += hexformat(this.buzzerMuteCommand, 2);
		cfg += hexformat(this.buzzerMuteTime, 8);
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
		this.alarmNames[0][11] = "Force RF OFF";
		for (var k=0;k<4;k++){
			var aux = this.alarmNames[0][8+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		for (var k=0;k<4;k++){
			var aux = this.alarmNames[2][12+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		
		this.frm = cfg;
		return cfg;
	}
	this.setDefaultRelayAssign = function(mode,bbu_type){ //mode = 0 - dry contacts / 1 - serial, type = 0 - old std, 1 - new std, 2 - high power
		this.clearRelayAssign();
		this.clearRelayLogic();
		//fist columen old BBU order, second column new BBUs order (natural order)
		var def_relays = [[0,0],[4,1],[6,2],[5,3],[1,4],[3,5],[2,6],[7,7]];
		var type = bbu_type==0?0:1;
		//relay assign BBU alarms are assigned regardless mode:
		//relay 1: normal AC power
		this.relayAssignBbuAlarm[0][def_relays[0][type]] = true;
		//relay 2/5(old BBU): loss normal AC power
		this.relayAssignBbuAlarm[1][def_relays[1][type]] = true;
		//relay 3/7(old BBU): batt capacity and batt disconnection
		var alr = [2,8];
		for (var k=0;k<alr.length;k++) this.relayAssignBbuAlarm[alr[k]][def_relays[2][type]] = true;
		//relay 4/6(old BBU): batt charger fail
		this.relayAssignBbuAlarm[3][def_relays[3][type]] = true;
		//relay 8: bbu comm error, charger/batt temp, individual batt voltage, system voltage, batt bank voltage, batt deep discharge, annunciators
		var alr = [4,5,6,7,9,10,11,12,13,14,15];
		for (var k=0;k<alr.length;k++) this.relayAssignBbuAlarm[alr[k]][def_relays[7][type]] = true;
		if (mode==1){
			//relay 5/2(old BBU): antenna disconnection
			this.relayAssignGlobalAlarm[5][def_relays[4][type]] = true;
			//relay 6/4(old BBU): rx power low
			this.relayAssignBandAlarm[5][def_relays[5][type]] = true;
			//relay 7/3(old BBU): hw fail, high temp, osc detection (global), UL PA Fail
			var alr = [0,1,3,4];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][def_relays[6][type]] = true;
			//relay 7(old BBU): overload UL/DL, DL PA Fail, tx power low, VSWR, DL AGC Fail
			var alr = [0,1,2,3,4,6];
			for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][def_relays[6][type]] = true;
		}else{
			//relay 1: rx power low
			this.relayAssignBandAlarm[5][0] = true;
			//relay 2: VSWR
			this.relayAssignBandAlarm[4][1] = true;
			//relay 3: antenna disconnection
			this.relayAssignGlobalAlarm[5][2] = true;
			//relay 4: hw fail, high temp, osc detection (global), UL PA Fail
			var alr = [0,1,3,4];
			for (var k=0;k<alr.length;k++) this.relayAssignGlobalAlarm[alr[k]][3] = true;
			//relay 4: overload UL/DL, DL PA Fail, tx power low, VSWR, DL AGC Fail
			var alr = [0,1,2,3,6];
			for (var k=0;k<alr.length;k++) this.relayAssignBandAlarm[alr[k]][3] = true;
		}
	}
	this.clearRelayAssign = function(){
		for (var i=0;i<this.relayAssignGlobalAlarm.length;i++){
			for (var j=0;j<this.NR_OF_RELAYS_MAX;j++){
				this.relayAssignGlobalAlarm[i][j] = false;
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
	this.getFrmBuzzerMuteCommand = function() {
		// this function can be used if a button is implemented for muting the buzzer
		this.buzzerMuteCommand = 1;
		return this.getFrme();
	}
	this.saveFrameStr = function(sr) {
		localStorage.setItem("NFPAConf"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("NFPAConf"+Prjstr+window.location.host);
	}	
	this.isRelayAssignNormalACpowerExclusive = function(relayNr) {
		if (!(relayNr<12)) {
			return false;
		}
		// NormalACPower = BBU alarm nr #0 
		if (!this.relayAssignBbuAlarm[0][relayNr]) {
			return false;
		}
		// if relaNr is also assigned to other ACTIVE alarm, then it is not "Normal AC Power" exclusive
		for (var k=0;k<16;k++){
			if (this.globalAlarmsEnabled[k] && this.relayAssignGlobalAlarm[k][relayNr]) {
				return false;
			}
		}
		for (var k=0;k<8;k++){
			if (this.bandAlarmsEnabled[k] && this.relayAssignBandAlarm[k][relayNr]) {
				return false;
			}
		}
		for (var k=1;k<16;k++){	// skip alarm nr 0, "Normal AC Power"
			if (this.bbuAlarmsEnabled[k] && this.relayAssignBbuAlarm[k][relayNr]) {
				return false;
			}
		}
		return true;
	}
}
function NFPAstatus(){
	this.NR_OF_RELAYS_MAX		= 10;
	this.powDirect				= [0,0];// 2 --> 1double/band
	this.powReverse				= [0,0];// 2 --> 1double/band
	this.retLoss				= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeHigh	= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeLow	= [0,0];// 2 --> 1double/band
	this.adPowDirect			= [0,0];// 2 --> 1double/band
	this.adDlPaCurr				= [0,0];// 2 --> 1double/band
	this.bbLevel = -128;
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
	this.bbuAnnunciatorTag = ["","","",""];
	this.bbuAlarmResult = [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]; //16 boolean/alarm
	this.bbuDeepDischargeState;
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
	
	this.frm 					= "";
	
	this.parse = function(s, bbu_type) {
		if (s.length<8) return -2; //blocked
		if (s.length<824) return -1; 
		var res,res2;
		var ind = 0;
		this.frm = s;
		this.forceDLMaxGain = false;
		
		for (var k=0;k<2;k++){
			res = parseInt(s.substr(44+8*k,4), 16); if (res>32767) res-=65536;
			this.powDirect[k] = res/100;
			res = parseInt(s.substr(48+8*k,4), 16); if (res>32767) res-=65536;
			this.powReverse[k] = res/100;
			res = parseInt(s.substr(84+4*k,4), 16); if (res>32767) res-=65536;
			this.retLoss[k] = res/100;	
			res = parseInt(s.substr(158+20*k,6), 16);
			this.txLowerPowerTimeHigh[k] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;
			res = parseInt(s.substr(164+20*k,6), 16);
			this.txLowerPowerTimeLow[k] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;		
			this.adPowDirect[k] = parseInt(s.substr(8*k,4), 16);
			this.adDlPaCurr[k] = parseInt(s.substr(24+4*k,4), 16);
		}
		ind = 422;
		this.bbLevel = to_float(parseInt(s.substr(ind,4),16));
		ind = 190;	// mms alarms result
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;		
		for (var k=0;k<8;k++) {
			this.bbuAlarmResult[k] = (res & (1<<k))!=0;
			this.bbuAlarmResult[8+k] = (res2 & (1<<k))!=0;
		}
		ind = 194;	// mms status
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
		this.bbuChargerErrorCode = res;
		ind = 416;
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.bbuDeepDischargeState = ((res&0x01)==0x01);
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuDeepDischargeCounter = res;
		ind = 704;
		for (var n=0; n < this.bbuAnnunciatorTag.length; n++){
			this.bbuAnnunciatorTag[n] = s.substring(ind,ind+30); ind+=30;
		}
		ind = 430;
		if (typeof(bbu_type) !== 'undefined') {
			this.parseFactoryStatusDataMvo2(s.substring(ind,ind+274), bbu_type);
		}
	}
	this.parseFactoryStatusDataMvo2 = function (s, bbu_type) {
		if ( bbu_type == 1) {
			this.parseFactoryStatusDataMvo2Std(s);
		} else if (bbu_type == 2) {
			this.parseFactoryStatusDataMvo2HP(s);
			// var test1 = "CDCC5C42000020400000A4705C42D7A3F03E66660A424D45414E57454C4C202020204E50422D3735302D343820200AFFFFFFFFFF43484E32313130303732313039323530303030363000000041CDCC5C42CDCC5C420AD7A33E8000B80BB80BB80B04005506020003000000000000000000000000000000000000000000000000000000000000000000";
			// this.parseFactoryStatusDataMvo2HP(test1);
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
function uCSupportsBbuMvo2Mode(version)
{
	var versionCompareTo2_00 = version.compareSw(2,0);
	return (versionCompareTo2_00 > 0);
}

function isBbuSerialMode(config, factory, version)
{
	var isSerialMode = false;
	var versionCompareTo2_00 = version.compareSw(2,0);
	if (versionCompareTo2_00 < 0) {
		/* this case is not possible because htdocs_2c1 is used if version >= v2.00 */
		isSerialMode = false;
	} else if (versionCompareTo2_00 == 0) {
		isSerialMode = factory.isMMSmode();
	} else {
		isSerialMode = (config.bbu_serial_mode!=0);
	}
	return isSerialMode;
}
function getNrOfRelaysSupported(config, factory, version) {
	if (!isBbuSerialMode(config, factory, version)) return 4;
	if (config.bbu_type == 0) {
		return 8;	// MMS mode
	} else if (config.bbu_type == 1) {
		return 10; 	// BBU MVO.2 standard
	} else if (config.bbu_type == 2) {
		return 10; 	// New BBU high power
	} else {
		return 4;	// default
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
	this.showDeepDischargeMvo1 = function(NFPAstat, config, factory, version) {
		this.isBbuMvo2 = false;
		var el = document.getElementById("deepDischargeDiv");
		try {
			if (isBbuSerialMode(config, factory, version)) {
				var batteryBankVoltage = 0;
				for (var i = 0; i < 2; i++) batteryBankVoltage += NFPAstat.bbuBatteryStatusVoltage[i];
				var isDeepDischarge = batteryBankVoltage < factory.deepDischargeVolt_mV;
				if (isDeepDischarge && !window.parent.navi.deepDischargeButtonClicked) {
					el.style.display = "block";
				}
			} else {
				el.style.display = "none";
			}
		} catch(e){}
	}
	this.showDeepDischargeMvo2 = function(isDeepDischarge, config) {
		this.isBbuMvo2 = true;
		this.config = config;
		var el = document.getElementById("deepDischargeDiv");
		try {
			if (isBbuSerialMode(config, factory, version)) {
				if (isDeepDischarge && !window.parent.navi.deepDischargeButtonClicked) {
					el.style.display = "block";
				}
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
