function Config() {
	this.CHNR 						= 64;
	this.ADJNR 						= 4;
		
	this.resetSoft					= false;
	
	this.uldlLinkedFreq				= [false,false];
	this.muteModeLinked				= [false,false];
	this.numberOfFilterNonGrouped	= [[0,0],[0,0]];
	this.simplexMode				= [false,false];
	
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
	
	this.sqChEnabled				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][32] en UL NB se utiliza CH0 para el que aplica a todos los filtros
	this.sqChThreshold				= []; //nb/adj band0/1 ul/dl nfilter [2][2][2][32] en UL NB se utiliza CH0 para el que aplica a todos los filtros
	
	this.gain						= []; //band0/1 ul/dl [2][2]
	this.power						= []; //band0/1 ul/dl [2][2]
	
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
	this.forceSystemAlarm 			= false;

	for (var k=0;k<7;k++){
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.delayTimer.push(0);
	}	
	for (var k=0;k<13;k++)
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
	this.delayLims = {min: 0, max: 200};
	this.FOconfigSettingsMasks = {
		runDelayMeas: 0x01,
		groupDelayEnable: 0x01,
		clearErrorCounters: 0x02,
		masterPriority: 0x04,
		masterModeAuto: 0x08,
		remoteIsDonnorAntennaCapable: 0x10
	}
	this.remoteIsDonnorAntennaCapable = false;

	this.parse = function(s,factory, remoteNr) {
		if (typeof(remoteNr)==='undefined') {
			remoteNr=0;	//master
		}
		var frameLength = (remoteNr==0?1716:1572);
		if (s.length<frameLength) return -1;
		
		var i;
		var res;
		var ind = 0;

		//RESET
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.resetSoft = false;//(res & 0x1)!=0;
		for (var b=0;b<2;b++){ //Band0/1
			//SIMPLEX,NGROUPS,MUTEMODE,LINKEDULDL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.uldlLinkedFreq[b] = remoteNr==0?(res & 0x1)==0:false; //se fuerza a false en remotos para no tener problemas con GUI
			//se fuerza a false si bw ul/dl no son iguales
			if ((factory.fstop[2*b+1]-factory.fstart[2*b+1])!=(factory.fstop[2*b]-factory.fstart[2*b])) this.uldlLinkedFreq[b]=false;
			this.muteModeLinked[b] = false; //se fuerza a false para no tener problemas con GUI
			if (b==0) this.forceSystemAlarm = (res & 0x40)!=0;
			this.simplexMode[b] = (res & 0x80)!=0;
			//OSCFEATURE GENERAL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.oscActionAfterAlarm[b] = (res & 0x3);
			if (this.oscActionAfterAlarm[b]==3) this.oscActionAfterAlarm[b]=2;
			this.clearOscAlarm[b] = false;//(res & 0x4)!=0;
			this.oscFeatureEnabled[b] = (res & 0x8)!=0;
			this.runIsolationMeas[b] = false;//(res & 0x10)!=0;
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
				if (!factory.commonUl) this.firstADJisFirstNet = false; //se fuerza a false si V/U
				if (i==0) this.sqChEnabled[0][b][0][0] = (res & 0x10)!=0;
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
					res = parseInt(s.substring(ind,ind+2), 16);
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

				this.numberOfFilterNonGrouped[b][i] = parseInt(s.substring(ind,ind+2), 16) & 0x3f; ind+=2;
				var j = remoteNr==0? 1:0;
				var k = this.CHNR/2*((i+j) % 2);
				for (var ch=0;ch<this.CHNR/2;ch++){//32CH (en remoto: filtros UL 1-32, filtros DL 33-64, en master filtros UL 33-64, filtros DL 1-32)
					//CHON,GROUPED,BW
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					this.filterEnabled[0][b][j][ch+k] = (res & 0x80)==0;
					this.isFilterGrouped[b][j][ch+k] = (res & 0x40)!=0;
					this.freqHz[b][j][ch+k] = ((res & 0x20)>>5)*factory.fstep/2; //1 extra bit for freq
					this.bwIndex[b][j][ch+k] = (res & 0x7);
					this.bwKHz[b][j][ch+k] = this.computeBWFromIndex(res & 0x7);
					//FINE GAIN
					this.fineGainFilter[0][b][j][ch+k] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					if (this.fineGainFilter[0][b][j][ch+k]>127) this.fineGainFilter[0][b][j][ch+k]-=256;
					//FREQ
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.freqHz[b][j][ch+k] += factory.fref[2*b+j]+res*factory.fstep;
				}
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					//FINE GAIN
					this.fineGainFilter[1][b][i][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					if (this.fineGainFilter[1][b][i][ch]>127) this.fineGainFilter[1][b][i][ch]-=256;
					//FSTART
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.fstartHzAdjFilter[b][i][ch] = factory.fref[2*b+j]+res*factory.fstepAdj;
					//FSTOP
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.fstopHzAdjFilter[b][i][ch] = factory.fref[2*b+j]+res*factory.fstepAdj;
				}
			}
		}
		//Squelchs
		for (b=0;b<2;b++){
			var nrOfSquelchThresholds = (remoteNr==0?this.CHNR:this.CHNR/2);
			for (var ch=0;ch<nrOfSquelchThresholds;ch++){//32CH, master 64ch
				res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
				this.sqChThreshold[0][b][1][ch] = res;
			}
			for (i=0;i<2;i++){
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
					this.sqChThreshold[1][b][i][ch] = res;
				}
			}
			// squelch enable parseado en 2 grupos de 32 bits para el master
			var nrOfSquelchEnableMasks = (remoteNr==0?2:1);
			for (var i = 0; i < nrOfSquelchEnableMasks; i++) {
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				for (var ch=0;ch<this.CHNR/2;ch++){
					// primero los más significativos
					var channel = ch + (1-i)*this.CHNR/2;
					this.sqChEnabled[0][b][1][channel] = (res & (1<<ch))!=0;
				}
			}
		}
		this.autoUlPaOffTimer = parseInt(s.substr(ind,4), 16); ind+=4;		
		
		//conf timers NFPA
		for (var k=0;k<7;k++){
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerON[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerON[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		// F.O.
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		this.FOconfigMask = res;
		this.FOgroupDelayEnable = !!(this.FOconfigMask & this.FOconfigSettingsMasks.groupDelayEnable );
		this.FOclearErrorCounters = false;
		this.runDelayMeasuarement = false;
		if (remoteNr==0){//solo master
			this.masterMode = !!(this.FOconfigMask & this.FOconfigSettingsMasks.masterPriority)?1:0;
			if (!!(this.FOconfigMask & this.FOconfigSettingsMasks.masterModeAuto)) this.masterMode = 2;
			res = parseInt(s.substr(ind,4), 16); ind+=4;
			for (var k=0;k<this.masterModeAlarmEnables.length;k++){
				this.masterModeAlarmEnables[k] = (res & (1<<k))!=0;
			}
		}
		else{ //solo remote
			this.remoteIsDonnorAntennaCapable = !!(this.FOconfigMask & this.FOconfigSettingsMasks.remoteIsDonnorAntennaCapable );
			for (var port = 0; port < 2; port++) {
				for (var k = 0; k < 2; k++) {
					res = parseInt(s.substr(ind,4), 16); ind+=4;
					this.FOgroupDelay[port][k] = res / 10;
				}
			}
		}
		
		this.frm = this.getFrm(factory,remoteNr);
	}
	this.getFrm = function(factory,remoteNr){
		if (typeof(remoteNr)==='undefined') {
			remoteNr=0;	//master
		}
		var i;
		var res,fr;
		var mask = 0;
		var b,ch;
		var cfg = "";	
		//RESET
		if (this.resetSoft) mask = 1;
		cfg += hexformat(mask,2);	
		for (b=0;b<2;b++){ //Band0/1
			//SIMPLEX,NGROUPS,MUTEMODE,LINKEDULDL
			mask=0;
			if (remoteNr>0) this.uldlLinkedFreq[b]=false; //se fuerzan a false en remotos
			if (!this.uldlLinkedFreq[b]) mask|=0x1;
			//if (this.muteModeLinked[b]) mask|=0x2; //se fuerzan a false
			if (b==0) {
				if (this.forceSystemAlarm) mask|=0x40;
			}
			if (this.simplexMode[b]) mask|=0x80;
			cfg += hexformat(mask,2);	
			//OSCFEATURE GENERAL
			mask=this.oscActionAfterAlarm[b] & 0x3;
			if (this.clearOscAlarm[b]) mask|=0x4;
			if (this.oscFeatureEnabled[b]) mask|=0x8;
			if (this.runIsolationMeas[b]) mask|=0x10;
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
					if (!factory.commonUl) this.firstADJisFirstNet = false; //se fuerza a false si V/U
					if (this.firstADJisFirstNet) mask|=0x40;
					mask |= (this.extremeTempAction << 2) & 0x0C;
				}
				if (i==0){
					if (this.sqChEnabled[0][b][0][0]) mask|=0x10;
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
					res=this.controlChannel[b];
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
				cfg += hexformat(this.numberOfFilterNonGrouped[b][i] & 0x3f,2);
				
				var j = remoteNr==0? 1:0;
				var k = this.CHNR/2*((i+j) % 2);
				for (var ch=0;ch<this.CHNR/2;ch++){//32CH (en remoto: filtros UL 1-32, filtros DL 33-64, en master filtros UL 33-64, filtros DL 1-32)
					mask=0;
					//CHON,GROUPED,BW
					if (!this.filterEnabled[0][b][j][ch+k]) mask|=0x80;
					if (this.isFilterGrouped[b][j][ch+k]) mask|=0x40;
					mask|=this.bwIndex[b][j][ch+k] & 0x7;
					this.bwKHz[b][j][ch+k] = this.computeBWFromIndex(this.bwIndex[b][j][ch+k]);
					fr = ~~Math.round((this.freqHz[b][j][ch+k]-factory.fref[2*b+j])/factory.fstep*2);if (fr<0) fr+=131072; //1extra bit for freq
					mask|= (fr & 0x1)<<5;
					cfg += hexformat(mask,2);
					//FINE GAIN
					res=this.fineGainFilter[0][b][j][ch+k];if (res<0) res+=256;
					cfg += hexformat(res,2);
					//FREQ
					cfg += hexformat((fr>>1) & 0xffff,4);
				}
				for (ch=0;ch<4;ch++){//4ADJ
					//FINE GAIN
					res=this.fineGainFilter[1][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(res,2);
					//FSTART
					res =~~Math.round((this.fstartHzAdjFilter[b][i][ch]-factory.fref[2*b+j])/factory.fstepAdj);if (res<0) res+=65536;
					cfg += hexformat(res,4);
					//FSTOP
					res =~~Math.round((this.fstopHzAdjFilter[b][i][ch]-factory.fref[2*b+j])/factory.fstepAdj);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
			}
		}
		//Squelchs
		for (b=0;b<2;b++){
			var nrOfSquelchThresholds = (remoteNr==0?this.CHNR:this.CHNR/2);
			for (var ch=0;ch<nrOfSquelchThresholds;ch++){//32CH, master 64H
				res = this.sqChThreshold[0][b][1][ch];if (res<0) res+=256;
				cfg += hexformat(res,2);
			}
			for (i=0;i<2;i++){
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					res = this.sqChThreshold[1][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(res,2);
				}
			}
			// squelch enable de master representada con máscara de 64 bits y remoto 32bits
			// empezando por el más significativo correspondiente al canal más alto
			var nrOfSquelchEnableChannels = (remoteNr==0?this.CHNR:this.CHNR/2);
			var nrOfSquelchEnabledBytes = nrOfSquelchEnableChannels/8;
			for ( var i = 0; i < nrOfSquelchEnabledBytes; i++ ) {
				var mask = 0;
				for ( var j = 0; j < 8; j++ ) {
					var ch = (nrOfSquelchEnabledBytes-1-i)*8+j;
					if (this.sqChEnabled[0][b][1][ch]) mask|=1<<j;
				}
				cfg += hexformat(mask,2);
			}			
		}
		cfg += hexformat(this.autoUlPaOffTimer,4);		
		//timers NFPA
		for (var k=0;k<7;k++){
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
		// F.O.
		var FOmoduleMask = 0;
		FOmoduleMask |= this.FOclearErrorCounters ? this.FOconfigSettingsMasks.clearErrorCounters : 0;
		if (remoteNr==0){//solo master
			FOmoduleMask |= this.runDelayMeasuarement ? this.FOconfigSettingsMasks.runDelayMeas : 0;
			FOmoduleMask |= this.masterMode == 1 ? this.FOconfigSettingsMasks.masterPriority : 0;
			FOmoduleMask |= this.masterMode == 2 ? this.FOconfigSettingsMasks.masterModeAuto : 0;
			cfg += hexformat(FOmoduleMask, 2);
			var mask=0;
			for (var k = 0; k < this.masterModeAlarmEnables.length; k++) { 
				if (this.masterModeAlarmEnables[k]) mask|=1<<k;
			}
			cfg+=hexformat(mask, 4);
			cfg+="000000000000"; //relleno, no usado en master
		}
		else{//solo remote
			FOmoduleMask |= this.FOgroupDelayEnable ? this.FOconfigSettingsMasks.groupDelayEnable : 0;
			FOmoduleMask |= this.remoteIsDonnorAntennaCapable ? this.FOconfigSettingsMasks.remoteIsDonnorAntennaCapable : 0;
			cfg += hexformat(FOmoduleMask, 2);
			for (var port = 0; port < 2; port++) {
				for (var k = 0; k < 2; k++) {
					var delay = this.FOgroupDelay[port][k];
					if (delay < this.delayLims.min) delay=this.delayLims.min;
					if (delay > this.delayLims.max) delay=this.delayLims.max;
					cfg += hexformat(Math.round(delay*10), 4);
				}
			}
		}
		//this.frm = cfg; no se actualiza el string al generar para poder guardar conf para tool
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
	this.saveFrameStr = function(sr,n) {
		localStorage.setItem("Conf_"+n+"_"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function(n) {
		return localStorage.getItem("Conf_"+n+"_"+Prjstr+window.location.host);
	}	
}

function NFPAconf(remoteNr){
	this.retLossTh				= [0,0];
	this.minPowerVSWR			= [0,0];
	this.alarmNumSens			= [0,0];
	this.timeTxLowPowHigh		= [0,0];
	this.timeTxLowPowLow		= [0,0];
	this.antennaDisconnectionThreshold = [0,0];
	this.relayLogicConfigNormal	= []; // 7 --> 1boolean/relay ---
	this.globalAlarmsEnabled	= []; //24 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //24 --> 1boolean/alarm ---
	this.bandAlarmsEnabled		= []; //16 --> 1boolean/alarm ---
	this.bandAlarmsInstalled	= []; //16 --> 1boolean/alarm ---
	this.relayAssignGlobalAlarm	= []; //16 alarm x 7 --> 1boolean/relay ---
	this.relayAssignBandAlarm	= []; //8 alarm x 7 --> 1boolean/relay ---
	this.delayTimerON			= []; // 7 --> 1boolean/relay ---
	this.latchTimerON			= []; // 7 --> 1boolean/relay ---
	this.delayTimer				= []; // 7 --> 1int/relay ---
	this.latchTimer				= []; // 7 --> 1int/relay ---
	this.alarmNames				= [["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","UL PA Fail","Antenna Disconnection","Fiber Optic 1","Fiber Optic 2",
								    "External Input 1","External Input 2","External Input 3","Force RF OFF/Remote Ext.Input 4","General System Alarm","Undefined","Undefined","Undefined"],
								   ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","Rx Power Low","DL AGC Fail","DL Output Power","UL PA Fail","Antenna Disconnection",
								    "","","","","",""]];
	this.externalAlarmPolarity 	= [];
	this.remoteNr = remoteNr;
	if (remoteNr==0){
		for (var k=0;k<8;k++){
			this.alarmNames[0].push("Fiber Optic "+(k+1));
		}
	}
	this.generalSystemAlarm 	= [[],[]]; // 2 global,band

	// 1 byte de previsión de alarmas para das centric: fiber optic alarms 
	//define vector/matrix
	for (var k=0;k<7;k++){
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
		for (var j=0;j<7;j++) this.relayAssignGlobalAlarm[k].push(false);
		this.generalSystemAlarm[0].push(false);
	}
	for (var k = 0; k < 4; k++) {
		this.externalAlarmPolarity.push(false);
	}
	//bandAlarmsEnabled y bandAlarmsInstalled arrays únicos de 16
	for (var k=0;k<16;k++){
		this.bandAlarmsEnabled.push(false);
		this.bandAlarmsInstalled.push(false);
		this.generalSystemAlarm[1].push(false);
	}
	//relayAssignBandAlarm matriz única de 16x7
	for (var k=0;k<16;k++){
		this.relayAssignBandAlarm.push([]);
		for (var j=0;j<7;j++){
			this.relayAssignBandAlarm[k].push(false);
		}
	}
	this.alarmThrshItems = (remoteNr == 0 ? 9 : 5);
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
			TX_POWER_LOW_B1: 4
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
			{min: -10, max: 37}
		]
	];
	this.alrmThrshHystLimits = {min: 0, max: 10};

	this.frm					= "";
	this.parse = function(s, remoteNr) {
		var length = (remoteNr==0?412:396);
		if (s.length<length) return -1; 
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
		for (var b = 0; b < 2; b++ ) {
			this.antennaDisconnectionThreshold[b] = cSignedByte(parseInt(s.substring(ind,ind+2), 16)); ind+=2;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<7;k++){
			this.relayLogicConfigNormal[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 65536*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		// se ha eliminado la parte de ALARMS INSTALLED de la trama
		for (var k=0;k<24;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k==2 || k==3) this.globalAlarmsEnabled[k]= true; //Alarmas Antenna Isolation y Oscillation detection siempre "Enabled"
			if ( k < 6 || k>=16) { //k de 16 a 23 son las alarmas de fibra en el master
				this.globalAlarmsInstalled[k] = true;
			} else if ( k >= 6 && k < 13 ) {
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		// 2 bytes de alarm enable por banda, el segundo para V/U: UL PA Fail / Antenna Disconnection
		// se han eliminado ALARMS INSTALLED de banda de la trama
		for (var i = 0; i < 2; i++ ) {
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++){
				this.bandAlarmsEnabled[k+8*i] = (res & (1<<k))!=0;
				this.bandAlarmsInstalled[k+8*i] = (i==0 && k<8); //Se fuerzan "available" todas las del primer byte
			}
		}
		if (remoteNr>0){
			this.bandAlarmsInstalled[1] = false; //no existe Overload DL en remoto
			this.bandAlarmsInstalled[5] = false; //no existe Rx Power Low en remoto
		}
		for (var k=0;k<24;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignGlobalAlarm[k][j] = (res & (1<<j))!=0;
			}
			if (k >=8 && k <= 11) {
				var externalAlarmNr = k - 8;
				this.externalAlarmPolarity[externalAlarmNr] = (res & 0x80) != 0;
			} else {
				this.generalSystemAlarm[0][k] = (res & 0x80) != 0;
			}
			/* el byte 15 se dedicará a las generalSystemAlarm de las alarmas externas
			 * aprovechando que no se usan las alarmas 13,14 y 15 */
			if (k==15){
				for (var j=0;j<4;j++){
					var i=j+8;
					this.generalSystemAlarm[0][i] = (res & (1<<j))!=0;
				}
			}
		}
		// relay assign con 8 alarmas de banda añadidas en un segundo byte
		for ( var i = 0; i < 2; i++ ) {
			for (var k=0;k<8;k++){
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var j=0;j<7;j++){
					this.relayAssignBandAlarm[k+8*i][j] = (res & (1<<j))!=0;
				}
				this.generalSystemAlarm[1][k+i*8] = (res & 0x80) != 0;
			}
		}
		for (var k=0;k<7;k++){
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerON[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerON[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		for (var k=0;k<4;k++){
			if (!(remoteNr==0 && k==3)) {	// Force RF OFF
				this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();
			}
			ind+=30;
		}
		for (var k = 0; k < this.alarmThrshItems; k++) {
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			if (res > 127) {
				res -= 256;
			}
			this.alarmThrshData[k].valueThr = res;
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res /= 2;
			this.alarmThrshData[k].hysteresis = res;
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
		for (var b = 0; b < 2; b++ ) {
			if (this.antennaDisconnectionThreshold[b] < -128) {
				this.antennaDisconnectionThreshold[b] = -128;
			} else if (this.antennaDisconnectionThreshold[b] > 127) {
				this.antennaDisconnectionThreshold[b] = 127;
			}
			cfg += hexformat(rSignedByte(this.antennaDisconnectionThreshold[b]),2);
		}
		for (var k=0, mask=0 ;k<7;k++){
			if (this.relayLogicConfigNormal[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask,2);
		for (var k=0, mask=0;k<24;k++){
			if (this.globalAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat((mask & 0xff0000)>>16,2);

		// se ha añadido un byte más de alarma enable de banda, el segundo byte previsto para V/U
		for (var i = 0; i < 2; i++ ) {
			for (var k=0,mask=0,mask2=0;k<8;k++){
				if (this.bandAlarmsEnabled[k+8*i]) mask|= 1<<k;
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0;k<24;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.remoteNr == 0 && (k==6||k==7)){
					this.relayAssignGlobalAlarm[k][j] = this.relayAssignGlobalAlarm[k+10][j]; //fiber optic1/2 remote relay assign are copied from fiber optic1/2 relay assign master
				}
				if (this.relayAssignGlobalAlarm[k][j]) mask|= 1<<j;
			}
			if (k >= 8 && k <= 11) {
				var externalAlarmNr = k - 8;
				if (this.externalAlarmPolarity[externalAlarmNr]) {
					mask |= 0x80;
				}
			} else {
				if (this.generalSystemAlarm[0][k]) {
					mask |= 0x80;
				}
			}
			/* el byte 15 se dedicará a las generalSystemAlarm de las alarmas externas
			 * aprovechando que no se usan las alarmas 13,14 y 15 */
			if (k==15){
				mask = 0;
				for (var j=0;j<4;j++){
					var i=j+8;
					if (this.generalSystemAlarm[0][i]) mask|= 1<<j;
				}
			}
			if (k==13 || k==14){ //forcing no relay assignment for gralAlarms located on gen.sys.alarm 2 and 3 for new devices
				mask = 0;
			}
			cfg += hexformat(mask,2);
		}
		// añadidos 8 relay assign para el segundo byte de alarmas de banda previsto para V/V
		for (var i = 0; i < 2; i++) {
			for (var k=0;k<8;k++){
				for (var j=0,mask=0;j<7;j++){
					if (this.relayAssignBandAlarm[k+8*i][j]) mask|= 1<<j;
				}
				if (this.generalSystemAlarm[1][k+i*8]) {
					mask |= 0x80;
				}
				cfg += hexformat(mask,2);
			}
		}
		for (var k=0;k<7;k++){
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
		for (var k=0;k<4;k++){
			var aux = this.alarmNames[0][8+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		var m = (this.remoteNr == 0 ? 0 : 1);
		for (var k = 0; k < this.alarmThrshItems; k++) {
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
		this.frm = cfg;
		return cfg;
	}
	this.saveFrameStr = function(sr) {
		localStorage.setItem("NFPAConf"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("NFPAConf"+Prjstr+window.location.host);
	}	
}
function NFPAstatus(){
	this.powDirect				= [0,0];// 2 --> 1double/band
	this.powReverse				= [0,0];// 2 --> 1double/band
	this.retLoss				= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeHigh	= [0,0];// 2 --> 1double/band
	this.txLowerPowerTimeLow	= [0,0];// 2 --> 1double/band
	this.adPowDirect			= [0,0];// 2 --> 1double/band
	this.adDlPaCurr				= [0,0];// 2 --> 1double/band
	this.bbLevel = [-128, -128];
	this.frm 					= "";
	
	this.parse = function(s) {
		if (s.length<308) return -1; 
		var res;
		var ind = 0;
		this.frm = s;
		for (var k=0;k<2;k++){
			res = parseInt(s.substr(44+8*k,4), 16); if (res>32767) res-=65536;
			this.powDirect[k] = res/100;
			res = parseInt(s.substr(48+8*k,4), 16); if (res>32767) res-=65536;
			this.powReverse[k] = res/100;
			res = parseInt(s.substr(84+4*k,4), 16); if (res>32767) res-=65536;
			this.retLoss[k] = res/100;	
			res = parseInt(s.substr(152+24*k,6), 16);
			this.txLowerPowerTimeHigh[k] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;
			res = parseInt(s.substr(158+24*k,6), 16);
			this.txLowerPowerTimeLow[k] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;		
			this.adPowDirect[k] = parseInt(s.substr(8*k,4), 16);
			this.adDlPaCurr[k] = parseInt(s.substr(24+4*k,4), 16);
		}
		ind = 300;
		for (var b = 0; b < 2; b++) {
			this.bbLevel[b] = to_float(parseInt(s.substring(ind,ind+4),16));ind+=4;
		}
	}
}
function overallConfigToTextFile(config, nfpacfg, factory, tagstr, ethstr, serial, version, nr){
	var cfg = "";
	cfg += "TAG: " + tagstr.trim() + "\n\n";
	cfg += rfConfigToText(config,nfpacfg,factory, nr) + "\n";
	if (nr>0) {
		cfg += fiberConfigToText(config, nfpacfg) + "\n";
	} else {
		cfg += fiberConfigToTextMaster(config, nfpacfg) + "\n";
	}
	cfg += alarmSettingsToText(nfpacfg,factory,version, nr) + "\n";
	if (nr==0 && !factory.ethernetModuleNotInstalled){
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
function use7relaysInMaster(version) {
	var mode7relays = true;
	/* uC version supporting 7 relays is version>=v3.07 if v3.xx, or version>=v2.07 if v2.xx */
	if (version.getSwMainNumber() == 3) {
		if (version.getSwSecondNumber() < 7) {
			mode7relays = false;
		}
	}
	if (version.getSwMainNumber() == 2) {
		if (version.getSwSecondNumber() < 7) {
			mode7relays = false;
		}
	}
	if (version.getSwMainNumber() < 2) {
		mode7relays = false;
	}
	return mode7relays;
}
function alarmSettingsToText(nfpacfg,factory,version, nr){
	var j,k;
	var exist_el;
	var cfg = "";
	var gralAlarmNames = ["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","UL PA Fail","Antenna Disconnection","Fiber Optic 1","Fiber Optic 2","","","","","General System Alarm"];
	var bandAlarmNames = ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","RxPower Low / Donor Antenna", "DL AGC Fail","DL Output Power","UL PA Fail","Antenna Disconnection"];
	cfg+="ALARM/RELAY SETTINGS:\n";
	for (k=0;k<13;k++){
		if (k>=8 && k<12) continue; //se excluyen external inputs, pero se quiere recorrer hasta 12, que es "Other Remotes Alarms"
		if ((nr>0 || !factory.commonUl) && (k==4 || k==5)) continue;//remotos o masters V/U no tienen UL PA Fail ni Antenna Disconnection como Gral Alarm
		if (nr==0 && (k==6 || k==7)) continue; //no están aquí las alarmas de fibra. Se representan a continuación
		//if (nr==0 && (k==2 || k==3)) continue; //master no tienen Antenna Isolation + Oscillation Detection
		if (nr==0 && (k==2 || k==3)) nfpacfg.globalAlarmsEnabled[k] = false; //en master Antenna Isolation + Oscillation Detection se fuerzan a false
		cfg+="\tAlarm Enable " + gralAlarmNames[k] + ": " + boolToYN(nfpacfg.globalAlarmsEnabled[k]) + "\n";
	}
	//Alarmas de fibra master
	if (nr==0){
		for (k=0;k<8;k++){
			cfg+="\tAlarm Enable Fiber Optic "+(k+1)+": " + boolToYN(nfpacfg.globalAlarmsEnabled[k+16]) + "\n";
		}
	}
	for (k=0;k<10;k++){
		if ((k>7 || k==1 || k==5) && nr>0) continue; //remoto sólo tienen las 7 primeras alarmas de banda y no tiene Overload DL ni Rx Power Low
		if (nr==0 && factory.commonUl && k>7) continue; //master 7/8 no tiene alarmas en segundo byte (UL PA Fail y Antenna disconnection)
		//if (nr==0 && !factory.commonUl && k!=1 && k!=8 && k!=9) continue; //master V/U sólo existe overload DL, UL PA Fail y Antenna Disconnection
		cfg+="\tAlarm Enable " + bandAlarmNames[k] + ": " + boolToYN(nfpacfg.bandAlarmsEnabled[k]) + "\n";
	}
		
	for (k=0;k<13;k++){
		if (k>=8 && k<12) continue; //se excluyen external inputs, pero se quiere recorrer hasta 12, que es "Other Remotes Alarms"
		if ((nr>0 || !factory.commonUl) && (k==4 || k==5)) continue;//remotos o masters V/U no tienen UL PA Fail ni Antenna Disconnection como Gral Alarm
		//if (nr==0 && (k==2 || k==3)) continue;//master no tienen Antenna Isolation + Oscillation Detection
		if (nr==0 && (k==6 || k==7)) continue; //no están aquí las alarmas de fibra. Se representan a continuación
		cfg+="\tRelay Assigned " + gralAlarmNames[k] + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			if (nfpacfg.relayAssignGlobalAlarm[k][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (nr==0) {
			if (use7relaysInMaster(version)) {
				for (j=4;j<7;j++) {
					if (nfpacfg.relayAssignGlobalAlarm[k][j]){
						cfg+=(j+1)+", ";
						exist_el = true;
					}
				}
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	//Alarmas de fibra master
	if (nr==0){
		for (k=0;k<8;k++){
			cfg+="\tRelay Assigned Fiber Optic "+(k+1)+": ";
			exist_el = false;
			for (j=0;j<4;j++){
				if (nfpacfg.relayAssignGlobalAlarm[k+16][j]){
					cfg+=(j+1)+", ";
					exist_el = true;
				}
			}
			if (nr==0) {
				if (use7relaysInMaster(version)) {
					for (j=4;j<7;j++){
						if (nfpacfg.relayAssignGlobalAlarm[k+16][j]){
							cfg+=(j+1)+", ";
							exist_el = true;
						}
					}
				}
			}
			if (exist_el) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	// no se reportan relay assign de alarmas de fibra previsto para das centric
	for (k=0;k<10;k++){
		if ((k>7 || k==1 || k==5) && nr>0) continue; //remoto sólo tienen las 7 primeras alarmas de banda y no tiene Overload DL ni Rx Power Low
		if (nr==0 && factory.commonUl && k>7) continue; //master 7/8 no tiene alarmas en segundo byte (UL PA Fail y Antenna disconnection)
		//if (nr==0 && !factory.commonUl && k!=1 && k!=8 && k!=9) continue; //master V/U sólo existe overload DL, UL PA Fail y Antenna Disconnection
		cfg+="\tRelay Assigned " + bandAlarmNames[k] + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			// no se reportan relay assign de alarmas del segundo byte de banda previsto para V/U
			if (nfpacfg.relayAssignBandAlarm[k][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (nr==0) {
			if (use7relaysInMaster(version)) {
				for (j=4;j<7;j++){
					if (nfpacfg.relayAssignBandAlarm[k][j]){
						cfg+=(j+1)+", ";
						exist_el = true;
					}
				}
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	for (k=0;k<3;k++)
		cfg+="\tRelay "+ (k+1) +" Status On Alarm (CLOSED/OPEN): " + (nfpacfg.relayLogicConfigNormal[k]?"OPEN":"CLOSED") + "\n";
	if (nr==0) {
		if (use7relaysInMaster(version)) {
			for (k=4;k<7;k++)
				cfg+="\tRelay "+ (k+1) +" Status On Alarm (CLOSED/OPEN): " + (nfpacfg.relayLogicConfigNormal[k]?"OPEN":"CLOSED") + "\n";
		}
	}
	cfg+="\tUser Alarm Enable: ";
	for (k=0;k<4;k++)
		cfg+=boolToYN(nfpacfg.globalAlarmsEnabled[8+k])+", ";		
	cfg = cfg.substring(0,cfg.length-2)+"\n";	
	cfg+="\tUser Alarm Name: ";
	for (k=0;k<4;k++)
		cfg+=nfpacfg.alarmNames[0][8+k].trim()+", ";
	cfg = cfg.substring(0,cfg.length-2)+"\n";		
	cfg+="\tUser Alarm Polarity: ";
	for (k=0;k<4;k++)
		cfg+=(nfpacfg.externalAlarmPolarity[k]?"HIGH":"LOW")+", ";	
	cfg = cfg.substring(0,cfg.length-2)+"\n";
	for (k=0;k<4;k++){
		cfg+="\tRelay Assigned User Alarm " + (k+1) + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			if (nfpacfg.relayAssignGlobalAlarm[k+8][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
			if (nr==0) {
				if (use7relaysInMaster(version)) {
					for (j=4;j<7;j++){
						if (nfpacfg.relayAssignGlobalAlarm[k+8][j]){
							cfg+=(j+1)+", ";
							exist_el = true;
						}
					}
				}
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";			
	}

	for (k=0;k<13;k++){
		if (k>=8 && k<12 || (nr==0 && ((k>=12 && k<=14) || k==2 || k==3))) continue; //se excluyen external inputs y General System Alarm, Ant Isol y Osc Det. en master
		if ((nr>0 || !factory.commonUl) && (k==4 || k==5)) continue;//remotos o masters V/U no tienen UL PA Fail ni Antenna Disconnection como Gral Alarm
		if (nr==0 && (k==6 || k==7)) continue; //no están aquí las alarmas de fibra. Se representan a continuación
		cfg+="\tGeneral System Alarm " + gralAlarmNames[k] + ": " + boolToYN(nfpacfg.generalSystemAlarm[0][k]) + "\n";
	}
	//Alarmas de fibra master
	if (nr==0){
		for (k=0;k<8;k++){
			cfg+="\tGeneral System Alarm Fiber Optic "+(k+1)+": " + boolToYN(nfpacfg.generalSystemAlarm[0][k+16]) + "\n";
		}
	}
	for (k=0;k<10;k++){
		if ((k>7 || k==1 || k==5) && nr>0) continue; //remoto sólo tienen las 7 primeras alarmas de banda y no tiene Overload DL ni Rx Power Low
		if (nr==0 && factory.commonUl && k>7) continue; //master 7/8 no tiene alarmas en segundo byte (UL PA Fail y Antenna disconnection)
		if (nr==0 && (k!=1) && (k!=5) && (k!=8) && (k!=9)) continue; //master no tiene overload UL, DL PA Fail, Tx Power Low, VSWR, DL AGC Fail, DL Power Out low
		cfg+="\tGeneral System Alarm " + bandAlarmNames[k] + ": " + boolToYN(nfpacfg.generalSystemAlarm[1][k]) + "\n";
	}
	cfg+="\tGeneral System Alarm for User Alarms: ";
	for (k=0;k<4;k++){
		cfg+=boolToYN(nfpacfg.generalSystemAlarm[0][8+k])+", ";
	}
	return cfg;
}
function rfConfigToText(config, nfpacfg, factory, nr){
	var i;
	var cfg = "";		
	for (i=0;i<2;i++){
		if (factory.chBandEnabled[i] || factory.adjBandEnabled[i]){
			cfg += "CONFIG "+factory.bandNames[i]+"\n";
			//General
			cfg += rfConfigGeneralBandToText(config, factory, i, nr);
			//Narrow Filters
			cfg += rfConfigNarrowBandFiltersToText(config, factory, i, nr);
			//ADJBW Filters
			cfg += rfConfigAdjBwFiltersToText(config, factory, i, nr);
			//RF Alarm Settings
			cfg += rfConfigAlarmToText(nfpacfg, factory, i, nr);
		}
	}
	if (factory.commonUl || nr>0) cfg += rfConfigGeneralAlarmToText(config, nfpacfg, factory, nr);
	return cfg;
}
function rfConfigGeneralAlarmToText(config, nfpacfg, factory, nr){
	var cfg = "";
	cfg+="CONFIG GENERAL:\n";
	if (nr>0){
		cfg+="\tOscillation Delay Threshold (seconds): " + config.oscTimeThSeconds[0] + "\n";
		cfg+="\tAction After Oscillation Alarm: ";
		if (config.oscActionAfterAlarm[0]==0)
			cfg+="AUTOMATIC SHUT DOWN\n";
		else if (config.oscActionAfterAlarm[0]==1)
			cfg+="RUN ISOLATION MEAS.\n";
		else
			cfg+="ONLY ALARM\n";
		cfg+="\tRetry Timer After Automatic PA OFF (hours): " + config.oscRetryTimeHours[0] + "\n";
		if (nr==0) cfg+="\tAutomatic UL PA OFF Timer (minutes): " + config.autoUlPaOffTimer + "\n";
		cfg+="\tExtreme Temperature Action: ";
		if (config.extremeTempAction==0)
			cfg+="NO ACTION\n";
		else if (config.extremeTempAction==1)
			cfg+="REDUCE 6dB DL POWER\n";
		else
			cfg+="PA OFF\n";
	}

	if (nr==0 && factory.commonUl) cfg+="\tAntenna Disconnection Input Threshold (dBm): " + (nfpacfg.antennaDisconnectionThreshold[0]) + "\n";
	var m = (nr==0?0:1);
	var n = nfpacfg.alarmThrshOrder[m].TEMPERATURE;
	cfg+="\tTemperature Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
	cfg+="\tTemperature Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	return cfg;
}
function fiberConfigToText(config, nfpacfg){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	cfg+="\tGroup Delay Adjust Enable: "+boolToYN(config.FOgroupDelayEnable)+"\n";
	for (var k = 0; k < 2; k++) {
		cfg+="\tOptical Port "+(k+1)+":\n";
		for (var i = 0; i < 2; i++) {
			var m = (i==0?"UL":"DL");
			cfg+="\t\tGroup Delay "+m+" (us): "+ config.FOgroupDelay[k][i] + "\n";
		}
		var n = (k==0 ? nfpacfg.alarmThrshOrder[1].RX_POWER_FIBER_1 : nfpacfg.alarmThrshOrder[1].RX_POWER_FIBER_2);
		cfg+="\t\tRX Low Power Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tRX Low Power Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}
function fiberConfigToTextMaster(config, nfpacfg){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	for (var k = 0; k < 8; k++) {
		cfg+="\tOptical Port "+(k+1)+":\n";
		var n = nfpacfg.alarmThrshOrder[0].RX_POWER_FIBER_1 + k;
		cfg+="\t\tRX Low Power Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tRX Low Power Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}

function rfConfigGeneralBandToText(config, factory, band, nr){
	var j;
	var uldl = ["UL","DL"];
	var cfg = "";
	cfg+="\tGeneral\n";
	for (j=0;j<2;j++){
		var inout;
		if (nr==0){
			inout = ["Output","Input"];
		} else {
			inout = ["Input","Output"];
		}
		if (j!=0 || nr!=0){
			cfg+="\t\t"+uldl[j]+" "+inout[j]+" Attenuation (dB): "+(factory.gainlimit[2*band+j] - config.gain[band][j]) +"\n";
		}
	}
	for (j=0;j<2;j++){
		if (j==0 ^ nr==0) cfg+="\t\tInput AGC per channel Composite Power Set " + uldl[j]+ " (dBm): " + (config.power[band][j]-config.gain[band][j])+"\n";
	}
	for (j=0;j<2;j++) cfg+="\t\tRF Enabled " + uldl[j]+ ": " + boolToYN(config.paEnabled[band][j])+"\n";
	//cfg+="\t\tSquelch Mode (NOT LINKED/LINKED): " + (config.muteModeLinked[band]?"LINKED":"NOT LINKED")+"\n"; //desaparece
	//cfg+="\t\tLinked UL/DL Frequencies: " + boolToYN(config.uldlLinkedFreq[band])+"\n"; //desaparece
	//cfg+="\t\tSimplex Mode: " + boolToYN(config.simplexMode[band])+"\n"; //desaparece
	return cfg;
}

function rfConfigNarrowBandFiltersToText(config, factory, band, nr){
	var k, j;
	var b = nr==0?1:0;
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
	}
	return cfg;
}
function rfConfigAdjBwFiltersToText(config, factory, band, nr){
	var i,j,k;
	var b = nr==0?1:0;
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
	}
	return cfg;
}
function rfConfigAlarmToText(nfpacfg, factory, band, nr){
	var cfg = "";
	cfg+="\tRF Alarm Settings\n";
	cfg+="\t\tReturn Loss Threshold (dB): " + (nfpacfg.retLossTh[band]) + "\n";
	cfg+="\t\tMinimum TX Power for VSWR Detection (dBm): " + (nfpacfg.minPowerVSWR[band]) + "\n";
	cfg+="\t\tReturn Loss Alarm Sensitivity (seconds): " + (nfpacfg.alarmNumSens[band]) + "\n";
	cfg+="\t\tDonor Antenna Failure Timer Threshold (seconds): " + (nfpacfg.timeTxLowPowLow[band]) + "\n";
	if (!factory.commonUl && nr==0){
		cfg+="\tAntenna Disconnection Input Threshold (dBm): " + (nfpacfg.antennaDisconnectionThreshold[band]) + "\n";
	}
	if (nr>0){
		var n = (band == 0? nfpacfg.alarmThrshOrder[1].TX_POWER_LOW_B0 : nfpacfg.alarmThrshOrder[1].TX_POWER_LOW_B1 );
		cfg+="\t\tDownlink Output Power Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tDownlink Output Power Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}

function boolToYN(val){
	return (val?"YES":"NO");
}