function Config() {
	this.CHNR 						= 32;
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
	this.controlChannel = [];

	for (var k=0;k<7;k++){
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.delayTimer.push(0);
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
				for (var ch=0;ch<2*this.CHNR;ch++){ //se duplica el tamaño para single band
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
			for (var ch=0;ch<2*this.CHNR;ch++){ //se duplica el tamaño para single band
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
	this.sqThrLimits = function(simplex, b) {
		if (simplex) {
			return {MIN: -100, MAX: -40};
		} else {
			if (b == 0) {
				return {MIN: -110, MAX: -40};
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
		groupDelayEnable: 0x01,
		clearErrorCounters: 0x02
	}

	this.parse = function(s) {
		if (s.length<1572) return -1;
		var i;
		var res;
		var ind = 0;
		this.frm = s;
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		//RESET
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.resetSoft = false;//(res & 0x1)!=0;
		for (var b=0;b<2;b++){ //Band0/1
			//SIMPLEX,NGROUPS,MUTEMODE,LINKEDULDL
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.uldlLinkedFreq[b] = (res & 0x1)==0;
			//se fuerza a false si bw ul/dl no son iguales
			if ((factory.fstop[2*b+1]-factory.fstart[2*b+1])!=(factory.fstop[2*b]-factory.fstart[2*b])) this.uldlLinkedFreq[b]=false;
			this.muteModeLinked[b] = (res & 0x2)!=0;
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
				
				for (var ch=0;ch<this.CHNR;ch++){//32CH
					//CHON,GROUPED,BW
					res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					this.filterEnabled[0][b][i][ch] = (res & 0x80)==0;
					this.isFilterGrouped[b][i][ch] = (res & 0x40)!=0;
					this.bwIndex[b][i][ch] = (res & 0x7);
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(res & 0x7);
					//FINE GAIN
					this.fineGainFilter[0][b][i][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					if (this.fineGainFilter[0][b][i][ch]>127) this.fineGainFilter[0][b][i][ch]-=256;
					//FREQ
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.freqHz[b][i][ch] = factory.fref[2*b+i]+res*factory.fstep;
				}
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					//FINE GAIN
					this.fineGainFilter[1][b][i][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					if (this.fineGainFilter[1][b][i][ch]>127) this.fineGainFilter[1][b][i][ch]-=256;
					//FSTART
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.fstartHzAdjFilter[b][i][ch] = factory.fref[2*b+i]+res*factory.fstepAdj;
					//FSTOP
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.fstopHzAdjFilter[b][i][ch] = factory.fref[2*b+i]+res*factory.fstepAdj;
				}
			}
		}
		//Squelchs
		for (b=0;b<2;b++){
			for (var ch=0;ch<this.CHNR;ch++){//32CH
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
			for (var ch=0;ch<this.CHNR;ch++){//32CH
				this.sqChEnabled[0][b][1][ch] = (res & (1<<ch))!=0;
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
		
		//arreglo para single band.
		//si single band0 conf1-32 band 1 --> conf33-64 band0
		//si single band1 conf1-32 band 0 --> conf33-64 band1
		for (var b=0;b<2;b++){ //Band0/1
			if (factory.singleBandEnabled[b]){
				for (var i=0;i<2;i++){
					for (var ch=0;ch<this.CHNR;ch++){
						this.filterEnabled[0][b][i][ch+this.CHNR] = this.filterEnabled[0][1-b][i][ch];
						this.fineGainFilter[0][b][i][ch+this.CHNR] = this.fineGainFilter[0][1-b][i][ch];
						this.sqChEnabled[0][b][i][ch+this.CHNR] = this.sqChEnabled[0][1-b][i][ch];
						this.sqChThreshold[0][b][i][ch+this.CHNR] = this.sqChThreshold[0][1-b][i][ch];
						this.isFilterGrouped[b][i][ch+this.CHNR] = this.isFilterGrouped[1-b][i][ch];
						this.bwIndex[b][i][ch+this.CHNR] = this.bwIndex[1-b][i][ch];
						this.bwKHz[b][i][ch+this.CHNR] = this.bwKHz[1-b][i][ch];
						if (b==0)
							this.freqHz[b][i][ch+this.CHNR] = this.freqHz[1-b][i][ch]-factory.fref[2+i]+factory.fref[i];
						else
							this.freqHz[b][i][ch+this.CHNR] = this.freqHz[1-b][i][ch]-factory.fref[i]+factory.fref[i+2];
					}
				}		
			}
		}	

		// F.O.
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		this.FOconfigMask = res;
		this.FOgroupDelayEnable = !!(this.FOconfigMask & this.FOconfigSettingsMasks.groupDelayEnable );
		this.FOclearErrorCounters = false;
		for (var port = 0; port < 2; port++) {
			for (var k = 0; k < 2; k++) {
				res = parseInt(s.substr(ind,4), 16); ind+=4;
				this.FOgroupDelay[port][k] = res / 10;
			}
		}
		res = parseInt(s.substr(ind,2), 16); ind+=2;
	}
	this.getFrm = function(){
		var i;
		var res;
		var mask = 0;
		var b,ch;
		var cfg = "";
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		//arreglo para single band.
		//si single band0 conf33-64 band 0 --> conf1-32 band1
		//si single band1 conf33-64 band 1 --> conf1-32 band0
		for (var b=0;b<2;b++){ //Band0/1
			if (factory.singleBandEnabled[b]){
				for (var i=0;i<2;i++){
					for (var ch=0;ch<this.CHNR;ch++){
						this.filterEnabled[0][1-b][i][ch] = this.filterEnabled[0][b][i][ch+this.CHNR];
						this.fineGainFilter[0][1-b][i][ch] = this.fineGainFilter[0][b][i][ch+this.CHNR];
						this.sqChEnabled[0][1-b][i][ch] = this.sqChEnabled[0][b][i][ch+this.CHNR];
						this.sqChThreshold[0][1-b][i][ch] = this.sqChThreshold[0][b][i][ch+this.CHNR];
						this.isFilterGrouped[1-b][i][ch] = this.isFilterGrouped[b][i][ch+this.CHNR];
						this.bwIndex[1-b][i][ch] = this.bwIndex[b][i][ch+this.CHNR];
						this.bwKHz[1-b][i][ch] = this.bwKHz[b][i][ch+this.CHNR];
						if (b==0)
							this.freqHz[1-b][i][ch] = this.freqHz[b][i][ch+this.CHNR]+factory.fref[2+i]-factory.fref[i];
						else
							this.freqHz[1-b][i][ch] = this.freqHz[b][i][ch+this.CHNR]+factory.fref[i]-factory.fref[i+2];
					}
				}		
			}
		}		
		//RESET
		if (this.resetSoft) mask = 1;
		cfg += hexformat(mask,2);	
		for (b=0;b<2;b++){ //Band0/1
			//SIMPLEX,NGROUPS,MUTEMODE,LINKEDULDL
			mask=0;
			if (!this.uldlLinkedFreq[b]) mask|=0x1;
			if (this.muteModeLinked[b]) mask|=0x2;
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
				
				for (ch=0;ch<this.CHNR;ch++){//32CH
					mask=0;
					//CHON,GROUPED,BW
					if (!this.filterEnabled[0][b][i][ch]) mask|=0x80;
					if (this.isFilterGrouped[b][i][ch]) mask|=0x40;
					mask|=this.bwIndex[b][i][ch] & 0x7;
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(this.bwIndex[b][i][ch]);
					cfg += hexformat(mask,2);
					//FINE GAIN
					res=this.fineGainFilter[0][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(res,2);
					//FREQ
					res = ~~Math.round((this.freqHz[b][i][ch]-factory.fref[2*b+i])/factory.fstep);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
				for (ch=0;ch<4;ch++){//4ADJ
					//FINE GAIN
					res=this.fineGainFilter[1][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(res,2);
					//FSTART
					res =~~Math.round((this.fstartHzAdjFilter[b][i][ch]-factory.fref[2*b+i])/factory.fstepAdj);if (res<0) res+=65536;
					cfg += hexformat(res,4);
					//FSTOP
					res =~~Math.round((this.fstopHzAdjFilter[b][i][ch]-factory.fref[2*b+i])/factory.fstepAdj);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
			}
		}
		//Squelchs
		for (b=0;b<2;b++){
			for (var ch=0;ch<this.CHNR;ch++){//32CH
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
			for (var ch=this.CHNR/2;ch<this.CHNR;ch++){//CH 16-31
				if (this.sqChEnabled[0][b][1][ch])  mask|=1<<(ch-this.CHNR/2);
			}
			cfg += hexformat(mask,4);
			mask = 0;
			for (var ch=0;ch<this.CHNR/2;ch++){//CH 0-15
				if (this.sqChEnabled[0][b][1][ch]) mask|=1<<ch;
			}
			cfg += hexformat(mask,4);			
			
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
		FOmoduleMask |= this.FOgroupDelayEnable ? this.FOconfigSettingsMasks.groupDelayEnable : 0;
		FOmoduleMask |= this.FOclearErrorCounters ? this.FOconfigSettingsMasks.clearErrorCounters : 0;
		cfg += hexformat(FOmoduleMask, 2);
		for (var port = 0; port < 2; port++) {
			for (var k = 0; k < 2; k++) {
				var delay = this.FOgroupDelay[port][k];
				if (delay < this.delayLims.min) delay=this.delayLims.min;
				if (delay > this.delayLims.max) delay=this.delayLims.max;
				cfg += hexformat(Math.round(delay*10), 4);
			}
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
}

function NFPAconf(){
	this.retLossTh				= [0,0];
	this.minPowerVSWR			= [0,0];
	this.alarmNumSens			= [0,0];
	this.timeTxLowPowHigh		= [0,0];
	this.timeTxLowPowLow		= [0,0];
	this.antennaDisconnectionThreshold = [0,0];
	this.relayLogicConfigNormal	= []; // 7 --> 1boolean/relay ---
	this.globalAlarmsEnabled	= []; //16 --> 1boolean/alarm ---
	this.globalAlarmsInstalled	= []; //16 --> 1boolean/alarm ---
	this.bandAlarmsEnabled		= []; // 8 --> 1boolean/alarm ---
	this.bandAlarmsInstalled	= []; // 8 --> 1boolean/alarm ---
	this.relayAssignGlobalAlarm	= []; //16 alarm x 7 --> 1boolean/relay ---
	this.relayAssignBandAlarm	= []; //8 alarm x 7 --> 1boolean/relay ---
	this.delayTimerON			= []; // 7 --> 1boolean/relay ---
	this.latchTimerON			= []; // 7 --> 1boolean/relay ---
	this.delayTimer				= []; // 7 --> 1int/relay ---
	this.latchTimer				= []; // 7 --> 1int/relay ---
	this.alarmNames				= [["HW Fail","High.Temp","Antenna Isolation","Oscillation Detection","UL PA Fail","Antenna Disconnection","Fiber Optic 1","Fiber Optic 2",
								    "External Input 1","External Input 2","External Input 3","External Input 4","Door Open","Undefined","Undefined","Undefined"],
								   ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","Rx Power Low","DL AGC Fail","","","","","","","","",""]];
	this.externalAlarmPolarity 	= [];
	// 1 byte de previsión de alarmas para das centric: fiber optic alarms 
	this.fiberOpticAlarmsEnabled 	= [];
	this.relayAssignFiberOpticAlarm = [];
	//define vector/matrix
	for (var k=0;k<7;k++){
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
		for (var j=0;j<7;j++) this.relayAssignGlobalAlarm[k].push(false);
	}
	for (var k = 0; k < 4; k++) {
		this.externalAlarmPolarity.push(false);
	}
	// 8 alarmas y 8 asignaciones de relay para previsión de alarmas de fibra de das centric
	for (var k=0;k<8;k++) { 
		this.fiberOpticAlarmsEnabled.push(false);
		this.relayAssignFiberOpticAlarm.push([]);
		for (var j=0;j<7;j++) this.relayAssignFiberOpticAlarm[k].push(false);
	}
	// se ha añadido un byte de alarm enable de bandaen previsión de V/U: UL PA Fail / Antenna Disconnection)
	for (var i = 0; i < 2; i++ ) {
		this.bandAlarmsEnabled.push([]);
		this.bandAlarmsInstalled.push([]);
		for (var k=0;k<8;k++){
			this.bandAlarmsEnabled[i].push(false);
			this.bandAlarmsInstalled[i].push(false);
		}
	}
	for (var i = 0; i < 2; i++ ) {
		this.relayAssignBandAlarm.push([]);
		for (var k=0;k<8;k++){
			this.relayAssignBandAlarm[i].push([]);
			for (var j=0;j<7;j++){
				this.relayAssignBandAlarm[i][k].push(false);
			}
		}
	}
	this.alarmThrshItems = 5;
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
		{min: -10, max: 37}
	];
	this.alrmThrshHystLimits = {min: 0, max: 10};

	this.frm					= "";
	this.parse = function(s) {
		if (s.length<344) return -1; 
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
		// se ha eliminado la parte de ALARMS INSTALLED de la trama
		for (var k=0;k<16;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if (k==2 || k==3) this.globalAlarmsEnabled[k]= true; //Alarmas Antenna Isolation y Oscillation detection siempre "Enabled"
			if ( k < 6 ) {
				this.globalAlarmsInstalled[k] = true;
			} else if ( k >= 6 && k < 12 ) {
				this.globalAlarmsInstalled[k] = this.globalAlarmsEnabled[k];
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		// configuración de alarmas generales de fibra para previsión das centric
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.fiberOpticAlarmsEnabled[k] = (res & (1<<k))!=0;
		}
		// 2 bytes de alarm enable por banda, el segundo para V/U: UL PA Fail / Antenna Disconnection
		// se han eliminado ALARMS INSTALLED de banda de la trama
		for (var i = 0; i < 2; i++ ) {
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++){
				this.bandAlarmsEnabled[i][k] = (res & (1<<k))!=0;
				this.bandAlarmsInstalled[i][k] = (i==0 && k<7); //Se fuerzan "available" las 7 primeras del primer byte
			}
		}
		for (var k=0;k<16;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignGlobalAlarm[k][j] = (res & (1<<j))!=0;
			}
			if (k >=8 && k <= 11) {
				var externalAlarmNr = k - 8;
				this.externalAlarmPolarity[externalAlarmNr] = (res & 0x80) != 0;
			}
		}
		// 8 relaysAssign añadidos de previsión DAS centric
		for (var k=0;k<8;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignFiberOpticAlarm[k][j] = (res & (1<<j))!=0;
			}
		}
		// relay assign con 8 alarmas de banda añadidas en un segundo byte
		for ( var i = 0; i < 2; i++ ) {
			for (var k=0;k<8;k++){
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var j=0;j<7;j++){
					this.relayAssignBandAlarm[i][k][j] = (res & (1<<j))!=0;
				}
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
			this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
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
		for (var k=0, mask=0;k<16;k++){
			if (this.globalAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		// se ha eliminado ALARMS INSTALLED de la trama
		// se ha añadido un byte con 8 alarm enable de fibra en previsión das centric
		for (var k=0, mask=0;k<8;k++){
			if (this.fiberOpticAlarmsEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		// se ha añadido un byte más de alarma enable de banda, el segundo byte previsto para V/U
		for (var i = 0; i < 2; i++ ) {
			for (var k=0,mask=0,mask2=0;k<8;k++){
				if (this.bandAlarmsEnabled[i][k]) mask|= 1<<k;
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0;k<16;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignGlobalAlarm[k][j]) mask|= 1<<j;
			}
			if (k >= 8 && k <= 11) {
				var externalAlarmNr = k - 8;
				if (this.externalAlarmPolarity[externalAlarmNr]) {
					mask |= 0x80;
				}
			}
			cfg += hexformat(mask,2);
		}
		// añadidos 8 relay assign para alarmas generales de fibra previstas para das centric
		for (var k=0;k<8;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignFiberOpticAlarm[k][j]) mask|= 1<<j;
			}
			cfg += hexformat(mask,2);
		}
		// añadidos 8 relay assign para el segundo byte de alarmas de banda previsto para V/V
		for (var i = 0; i < 2; i++) {
			for (var k=0;k<8;k++){
				for (var j=0,mask=0;j<7;j++){
					if (this.relayAssignBandAlarm[i][k][j]) mask|= 1<<j;
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
		for (var k = 0; k < this.alarmThrshItems; k++) {
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
			this.bbLevel[b] = to_float(parseInt(s.substring(ind,ind+4),16));
		}
	}
}
function overallConfigToTextFile(config, nfpacfg, factory, tagstr, ethstr, serial){
	var cfg = "";
	cfg += "TAG: " + tagstr.trim() + "\n\n";
	cfg += rfConfigToText(config,nfpacfg,factory) + "\n";
	// cfg += fiberConfigToText(config, nfpacfg) + "\n";
	cfg += alarmSettingsToText(nfpacfg) + "\n";
	cfg += ethConfigToText(ethstr);
	cfg += getVersionNaviData() + "\n";
	cfg += "SERIAL: " + serial + "\n";
	return cfg;
}
function getVersionNaviData(){
	var cfg = "";
	cfg += "\nVERSION:\n";
	cfg += "\tFPGA: " + window.parent.navi.document.getElementById('fwBox').innerHTML + "\n";
	cfg += "\tuC: " + window.parent.navi.document.getElementById('swBox').innerHTML + "\n";
	cfg += "\tETH: " + window.parent.navi.document.getElementById('serverBox').innerHTML + "\n";
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
function alarmSettingsToText(nfpacfg){
	var j,k;
	var exist_el;
	var cfg = "";
	var gralAlarmNames = ["HW Fail","High Temperature","Antenna Isolation","Oscillation Detection","UL PA Fail","Antenna Disconnection","Fiber Optic 1","Fiber Optic 2"];
	var bandAlarmNames = ["Overload UL","Overload DL","DL PA Fail","Tx Power Low","VSWR","RxPower Low / Donor Antenna", "DL AGC Fail"];
	cfg+="ALARM/RELAY SETTINGS:\n";
	for (k=0;k<8;k++) {
		if (k==4 || k==5) { //remotos no tienen UL PA Fail ni Antenna Disconnection
			continue;
		}
		cfg+="\tAlarm Enable " + gralAlarmNames[k] + ": " + boolToYN(nfpacfg.globalAlarmsEnabled[k]) + "\n";
	}
	// no se reportan alarm enable del segundo byte de banda previsto para V/U
	for (k=0;k<7;k++) cfg+="\tAlarm Enable " + bandAlarmNames[k] + ": " + boolToYN(nfpacfg.bandAlarmsEnabled[0][k]) + "\n";
	for (k=0;k<8;k++){
		cfg+="\tRelay Assigned " + gralAlarmNames[k] + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			if (nfpacfg.relayAssignGlobalAlarm[k][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	// no se reportan relay assign de alarmas de fibra previsto para das centric
	for (k=0;k<7;k++){
		cfg+="\tRelay Assigned " + bandAlarmNames[k] + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			// no se reportan relay assign de alarmas del segundo byte de banda previsto para V/U
			if (nfpacfg.relayAssignBandAlarm[0][k][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";
	}
	for (k=0;k<3;k++)
		cfg+="\tRelay "+ (k+1) +" Status On Alarm (CLOSED/OPEN): " + (nfpacfg.relayLogicConfigNormal[k]?"OPEN":"CLOSED") + "\n";
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
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";			
	}
	return cfg;
}
function rfConfigToText(config, nfpacfg, factory){
	var i;
	var cfg = "";		
	for (i=0;i<2;i++){
		if (factory.chBandEnabled[i] || factory.adjBandEnabled[i]){
			cfg += "CONFIG "+factory.bandNames[i]+"\n";
			//General
			cfg += rfConfigGeneralBandToText(config, i);
			//Narrow Filters
			cfg += rfConfigNarrowBandFiltersToText(config, factory, i);
			//ADJBW Filters
			cfg += rfConfigAdjBwFiltersToText(config, factory, i);
			//RF Alarm Settings
			cfg += rfConfigAlarmToText(nfpacfg, i);
		}
	}
	cfg += rfConfigGeneralAlarmToText(config, nfpacfg);
	return cfg;
}
function rfConfigGeneralAlarmToText(config, nfpacfg){
	var cfg = "";
	cfg+="CONFIG GENERAL:\n";
	cfg+="\tOscillation Delay Threshold (seconds): " + config.oscTimeThSeconds[0] + "\n";
	cfg+="\tAction After Oscillation Alarm: ";
	if (config.oscActionAfterAlarm[0]==0)
		cfg+="AUTOMATIC SHUT DOWN\n";
	else if (config.oscActionAfterAlarm[0]==1)
		cfg+="RUN ISOLATION MEAS.\n";
	else
		cfg+="ONLY ALARM\n";
	cfg+="\tRetry Timer After Automatic PA OFF (hours): " + config.oscRetryTimeHours[0] + "\n";
	cfg+="\tAutomatic UL PA OFF Timer (minutes): " + config.autoUlPaOffTimer + "\n";
	cfg+="\tExtreme Temperature Action: ";
	if (config.extremeTempAction==0)
		cfg+="NO ACTION\n";
	else if (config.extremeTempAction==1)
		cfg+="REDUCE 6dB DL POWER\n";
	else
		cfg+="PA OFF\n";
	/* antennaDisconnectionThresold solamente banda #0 */
	cfg+="\tAntenna Disconnection Input Threshold (dBm): " + (nfpacfg.antennaDisconnectionThreshold[0]) + "\n";
	// var n = nfpacfg.alarmThrshOrder.TEMPERATURE;
	// cfg+="\tTemperature Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
	// cfg+="\tTemperature Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	return cfg;
}
function fiberConfigToText(config, nfpacfg){
	var cfg = "";
	cfg+="CONFIG FIBER OPTIC:\n";
	cfg+="\tGroup Delay Adjust Enable: "+boolToYN(config.FOgroupDelayEnable)+"\n";
	for (var k = 0; k < 2; k++) {
		cfg+="\tFIBER OPTIC #"+(k+1)+":\n";
		for (var i = 0; i < 2; i++) {
			var m = (i==0?"UL":"DL");
			cfg+="\t\tGroup Delay "+m+" (us): "+ config.FOgroupDelay[k][i] + "\n";
		}
		var n = (k==0 ? nfpacfg.alarmThrshOrder.RX_POWER_FIBER_1 : nfpacfg.alarmThrshOrder.RX_POWER_FIBER_2);
		cfg+="\t\tRX Low Power Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
		cfg+="\t\tRX Low Power Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	}
	return cfg;
}

function rfConfigGeneralBandToText(config,band){
	var j;
	var uldl = ["UL","DL"];
	var cfg = "";
	cfg+="\tGeneral\n";
	for (j=0;j<2;j++) cfg+="\t\tMain Gain " + uldl[j]+ " (dB): " + config.gain[band][j] +"\n";
	for (j=0;j<2;j++) cfg+="\t\tMain Power " + uldl[j]+ " (dBm): " + config.power[band][j]+"\n";
	for (j=0;j<2;j++) cfg+="\t\tPA Enabled " + uldl[j]+ ": " + boolToYN(config.paEnabled[band][j])+"\n";
	cfg+="\t\tSquelch Mode (NOT LINKED/LINKED): " + (config.muteModeLinked[band]?"LINKED":"NOT LINKED")+"\n";
	cfg+="\t\tLinked UL/DL Frequencies: " + boolToYN(config.uldlLinkedFreq[band])+"\n";
	cfg+="\t\tSimplex Mode: " + boolToYN(config.simplexMode[band])+"\n";
	return cfg;
}

function rfConfigNarrowBandFiltersToText(config, factory, band){
	var j,k;
	var nfilters;
	var filterson = [];
	var uldl = ["UL","DL"];	
	var cfg = "";
	var maxch = config.CHNR;
	if (factory.singleBandEnabled[band]) maxch *= 2;
	
	if (factory.chBandEnabled[band]){
		nfilters = 0;
		for (j=0;j<maxch;j++){
			if (config.filterEnabled[0][band][0][j]){
				filterson.push(j);
				nfilters++;
			}
		}					
		cfg+="\tNarrow Band Filters\n";
		//Num Independent Filters
		//cfg+="\t\tNum Independent Filters UL: "+ config.numberOfFilterNonGrouped[band][0] +"\n";
		//cfg+="\t\tNum Independent Filters UL: "+ config.numberOfFilterNonGrouped[band][1] +"\n";
		//Enable
		cfg+="\t\tFilter ON: ";
		for (j=0;j<nfilters;j++) cfg+=(filterson[j]+1)+", ";
		if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";	
		//Frequency
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Frequency " + uldl[j] + " (MHz): ";
			for (k=0;k<nfilters;k++) cfg+=(config.freqHz[band][j][filterson[k]]/1e6)+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";						
		}
		//Overlap 
		/*for (j=0;j<2;j++){
			cfg+="\t\tFilter Grouped " + uldl[j] + ": ";
			for (k=0;k<nfilters;k++) cfg+=boolToYN(config.isFilterGrouped[band][j][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}*/
		//BW
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Bandwidth " + uldl[j] + " (KHz): ";
			for (k=0;k<nfilters;k++) cfg+=(config.bwKHz[band][j][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";						
		}
		//Fine Gain
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Fine Gain " + uldl[j] + " (dB): ";
			for (k=0;k<nfilters;k++) cfg+=(config.fineGainFilter[0][band][j][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";						
		}
		//Squelch Enable
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Squelch Enable " + uldl[j] + ": ";
			if (j==0)
				cfg+=boolToYN(config.sqChEnabled[0][band][j][0])+"\n";
			else{
				for (k=0;k<nfilters;k++) cfg+=boolToYN(config.sqChEnabled[0][band][j][filterson[k]])+", ";
				if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
				cfg+="\n";
			}
		}
		//Squelch Threshold
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Squelch Threshold " + uldl[j] + " (dBm): ";
			if (j==0)
				cfg+=(config.sqChThreshold[0][band][j][0])+"\n";
			else{
				for (k=0;k<nfilters;k++) cfg+=(config.sqChThreshold[0][band][j][filterson[k]])+", ";
				if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
				cfg+="\n";
			}
		}
		cfg+="\t\tAll filters with same squelch settings DL: " + boolToYN(config.allSameSquelch[band])+"\n";
		for (j=0;j<2;j++) cfg+="\t\tAll filters with same Bandwidth " + uldl[j] + ": "+boolToYN(config.allChSameBW[band][j])+"\n";
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
		//Frequencies
		for (j=0;j<2;j++){
			cfg+="\t\tADJBW Frequency Start-Stop " + uldl[j] + " (MHz): ";
			for (k=0;k<nfilters;k++) cfg+=(config.fstartHzAdjFilter[band][j][filterson[k]]/1e6)+"-"+(config.fstopHzAdjFilter[band][j][filterson[k]]/1e6)+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
		//Fine Gain
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Fine Gain " + uldl[j] + " (dB): ";
			for (k=0;k<nfilters;k++) cfg+=(config.fineGainFilter[1][band][j][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";						
		}
		//Squelch Enable
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Squelch Enable " + uldl[j] + ": ";
			for (k=0;k<nfilters;k++) cfg+=boolToYN(config.sqChEnabled[1][band][j][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
		//Squelch Threshold
		for (j=0;j<2;j++){
			cfg+="\t\tFilter Squelch Threshold " + uldl[j] + " (dBm): ";
			for (k=0;k<nfilters;k++) cfg+=(config.sqChThreshold[1][band][j][filterson[k]])+", ";
			if (nfilters>0) cfg = cfg.substring(0,cfg.length-2);
			cfg+="\n";
		}
	}
	return cfg;
}
function rfConfigAlarmToText(nfpacfg, band){
	var cfg = "";
	cfg+="\tRF Alarm Settings\n";
	cfg+="\t\tReturn Loss Threshold (dB): " + (nfpacfg.retLossTh[band]) + "\n";
	cfg+="\t\tMinimum TX Power for VSWR Detection (dBm): " + (nfpacfg.minPowerVSWR[band]) + "\n";
	cfg+="\t\tReturn Loss Alarm Sensitivity (seconds): " + (nfpacfg.alarmNumSens[band]) + "\n";
	cfg+="\t\tDonor Antenna Failure Timer Threshold (seconds): " + (nfpacfg.timeTxLowPowLow[band]) + "\n";
	// var n = (band == 0? nfpacfg.alarmThrshOrder.TX_POWER_LOW_B0 : nfpacfg.alarmThrshOrder.TX_POWER_LOW_B1 );
	// cfg+="\t\tLow TX Power Alarm Threshold (dBm): " + (nfpacfg.alarmThrshData[n].valueThr) + "\n";
	// cfg+="\t\tLow TX Power Alarm Hysteresis (dB): " + (nfpacfg.alarmThrshData[n].hysteresis) + "\n";
	return cfg;
}

function boolToYN(val){
	return (val?"YES":"NO");
}