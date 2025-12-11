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
				return {MIN: -110, MAX: -40};
			}
		}
	}
	this.GfineRange = -40;
	this.GmainRange = [-50, -50];
	this.limitPowerRange = [20, 20];
	this.limitgFine = [
		{MIN: -40,	MAX: 0},
		{MIN: -40,	MAX: 0}
	];
	this.limitAbnSqTime = {MIN: 10,	MAX: 2400};
	this.limitRetryTime = {MIN: 0,	MAX: 48};
	this.limitAutoPaUlOffTime = {MIN: 1,	MAX: 60000};
	
	this.parse = function(s) {
		if (s.length<1554) return -1; 
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
			this.uldlLinkedFreq[b] = false;//forced SCA
			//se fuerza a false si bw ul/dl no son iguales
			if ((factory.fstop[2*b+1]-factory.fstart[2*b+1])!=(factory.fstop[2*b]-factory.fstart[2*b])) this.uldlLinkedFreq[b]=false;
			this.muteModeLinked[b] = false;//forced SCA
			this.simplexMode[b] = false;//forced SCA
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
				if (i==0) this.sqChEnabled[0][b][0][0] = (res & 0x10)!=0;
				this.allChSameBW[b][i] = false;//forced SCA
				if (i==1) this.allSameSquelch[b] =  true;//forced SCA
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
					this.filterEnabled[0][b][i][ch] = ch==0 || (ch==1 && factory.secondCH);//SCA
					this.isFilterGrouped[b][i][ch] = false;//SCA
					this.bwIndex[b][i][ch] = (res & 0x7);
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(res & 0x7);
					//FINE GAIN
					this.fineGainFilter[0][b][i][ch] = 0; ind+=2; //forced SCA
					if (this.fineGainFilter[0][b][i][ch]>127) this.fineGainFilter[0][b][i][ch]-=256;
					//FREQ
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.freqHz[b][i][ch] = factory.fref[2*b+i]+res*factory.fstep;
				}
				for (var ch=0;ch<this.ADJNR;ch++){//4ADJ
					//FINE GAIN
					this.fineGainFilter[1][b][i][ch] = 0; ind+=2; //forced SCA
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
		this.autoUlPaOffTimer = 0; ind+=4;	//forced in SCA
		
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
			//if (!this.uldlLinkedFreq[b]) mask|=0x1; //forced SCA
			mask|=0x1;
			//if (this.muteModeLinked[b]) mask|=0x2; //forced SCA
			//if (this.simplexMode[b]) mask|=0x80; //forced SCA
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
					if (this.firstADJisFirstNet) mask|=0x40;
					mask |= (this.extremeTempAction << 2) & 0x0C;
				}
				if (i==0){
					if (this.sqChEnabled[0][b][0][0]) mask|=0x10;
				}
				//if (this.allChSameBW[b][i]) mask|=0x20; //forced SCA
				if (i==1){
					//if (this.allSameSquelch[b])  mask|=0x40; //forced SCA
					mask|=0x40; //forced SCA
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
					if (ch>1 || (ch==1 && !factory.secondCH)) mask|=0x80;
					//if (this.isFilterGrouped[b][i][ch]) mask|=0x40; //SCA
					mask|=this.bwIndex[b][i][ch] & 0x7;
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(this.bwIndex[b][i][ch]);
					cfg += hexformat(mask,2);
					//FINE GAIN
					res=this.fineGainFilter[0][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(0,2);//forced SCA
					//FREQ
					res = ~~Math.round((this.freqHz[b][i][ch]-factory.fref[2*b+i])/factory.fstep);if (res<0) res+=65536;
					cfg += hexformat(res,4);
				}
				for (ch=0;ch<4;ch++){//4ADJ
					//FINE GAIN
					res=this.fineGainFilter[1][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(0,2);//forced SCA
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
		this.autoUlPaOffTimer=0; //forced for SCA
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
	this.antennaDisconnectionThreshold = 0;
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
	this.alarmNames				= [["HW Fail","Temperature High","Undefined","Undefined","Undefined","Comm. Error","Undefined","Undefined",
								    "External Input 1","External Input 2","External Input 3","Force RF OFF","Door Open","Undefined","Undefined","Undefined"],
								   ["Undefined","Overload","PA Fail","Tx Power Low","VSWR","Rx Power Low","AGC Fail","","","","","","","","",""]];
	this.externalAlarmPolarity 	= [];
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
	for (var k=0;k<8;k++){
		this.bandAlarmsEnabled.push(false);
		this.bandAlarmsInstalled.push(false);
	}
	for (var k=0;k<8;k++){
		this.relayAssignBandAlarm.push([]);
		for (var j=0;j<7;j++){
			this.relayAssignBandAlarm[k].push(false);
		}
	}
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
		this.antennaDisconnectionThreshold   = cSignedByte(parseInt(s.substring(ind,ind+2), 16)); ind+=2;
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<7;k++){
			this.relayLogicConfigNormal[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 += 256*parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<16;k++){
			this.globalAlarmsEnabled[k] = (res & (1<<k))!=0;
			if ((k>=2 && k<5)||(k>=8)){
				this.globalAlarmsInstalled[k] = false;//SCA: Antenna Isol., osc detection and UL PA Fail and external inputs do not exist
				this.globalAlarmsEnabled[k] = false;
			}else if ( k < 6 ) {
				this.globalAlarmsInstalled[k] = true;
			// } else if ( k >= 8 && k <= 12 ) { // para añadir door open usar esta linea
			} else if ( k >= 8 && k < 12 ) {
				this.globalAlarmsInstalled[k] = false;
			} else {
				this.globalAlarmsInstalled[k] = false;
			}
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.bandAlarmsEnabled[k] = (res & (1<<k))!=0;
			//this.bandAlarmsInstalled[k] = (res2 & (1<<k))!=0;
			this.bandAlarmsInstalled[k] = (k>0 && k<7); //SCA: Forced "available" 7 first band alarms, except UL overload
			if (k==0 || k==7) this.bandAlarmsEnabled[k] = false; //SCA: Forced "disabled" UL overload and 8th undefined band alarm
		}
		for (var k=0;k<16;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				if ((k>=2 && k<5)||(k>=8)){
					this.relayAssignGlobalAlarm[k][j] = false;//SCA: Antenna Isol., osc detection and UL PA Fail and external inputs do not exist
				}else{
					this.relayAssignGlobalAlarm[k][j] = (res & (1<<j))!=0;
				}
			}
			if (k >=8 && k <= 11) {
				var externalAlarmNr = k - 8;
				this.externalAlarmPolarity[externalAlarmNr] = false;//SCA
			}
		}
		for (var k=0;k<8;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				if (k==0 || k==7){
					this.relayAssignBandAlarm[k][j] = false;//SCA:  UL overload does not exist
				}else{
					this.relayAssignBandAlarm[k][j] = (res & (1<<j))!=0;
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
		for (var k=0;k<3;k++){ 
			this.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
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
		for (var k=0, mask=0 ;k<7;k++){
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
		for (var k=0;k<16;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignGlobalAlarm[k][j]) mask|= 1<<j;
			}
			if (k >= 8 && k <= 11) {
				var externalAlarmNr = k - 8;
				/*if (this.externalAlarmPolarity[externalAlarmNr]) { //SCA
					mask |= 0x80;
				}*/
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0;k<8;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignBandAlarm[k][j]) mask|= 1<<j;
			}
			cfg += hexformat(mask,2);
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
		this.alarmNames[11] = "Force RF OFF";
		for (var k=0;k<4;k++){
			var aux = this.alarmNames[0][8+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
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
	this.bbLevel = -128;
	this.frm 					= "";
	
	this.parse = function(s) {
		if (s.length<294) return -1; 
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
			res = parseInt(s.substr(146+20*k,6), 16);
			this.txLowerPowerTimeHigh[k] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;
			res = parseInt(s.substr(152+20*k,6), 16);
			this.txLowerPowerTimeLow[k] = (res & 0xff0000)>>16 | (res & 0xff00) | (res & 0xff)<<16;		
			this.adPowDirect[k] = parseInt(s.substr(8*k,4), 16);
			this.adDlPaCurr[k] = parseInt(s.substr(24+4*k,4), 16);
		}
		ind = 290;
		this.bbLevel = to_float(parseInt(s.substr(ind,4),16));
	}
}