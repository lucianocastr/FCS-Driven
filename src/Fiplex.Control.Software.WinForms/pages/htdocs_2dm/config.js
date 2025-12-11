function Config() {
	this.CHNR 						= 32;
	this.ADJNR 						= 4;
	this.MAXREMOTES					= 8;
		
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
	
	this.connectedRemotes			= []; //8 uno por remoto
	
	this.remote						= []; //8 uno por remoto
	this.controlChannel = [];
		
	
	for (var k=0;k<this.MAXREMOTES;k++){
		this.connectedRemotes.push(false);
		this.remote.push(new ConfigRemote());
	}
	
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
				return {MIN: -90, MAX: -40};
			}
		}
	}
	this.GfineRange = -40;
	this.limitGmainMin = [60, 60];
	this.limitGainRange = [30, 30];
	this.limitPowerRange = [20, 20];
	this.limitgFine = [
		{MIN: -40,	MAX: 0},
		{MIN: -40,	MAX: 0}
	];
	this.limitAbnSqTime = {MIN: 10,	MAX: 2400};
	this.limitRetryTime = {MIN: 0,	MAX: 48};
	this.limitAutoPaUlOffTime = {MIN: 1,	MAX: 60000};
	
	this.attRemoteRange = {MIN: 0,	MAX: 30};
	//band0
	this.powerRemoteRange = [
		{MIN: -20,	MAX: -10},
		{MIN: 13,	MAX: 33},
		{MIN: -20,	MAX: -10},
		{MIN: 13,	MAX: 33}
	];

	this.remoteFiberOpticalLossRange = {MIN: 0, MAX: 5, STEP: 0.5};
	this.powerULB0Range = {MIN: 10, MAX: 0};
	
	this.powerRemoteRangeGet = function(remoteNr, band, uldl) {
		if (uldl == 0) {
			return this.powerRemoteRange[2*band];
		}
		var powerlimit = this.remote[remoteNr].powerlimit[band]
		var powerRangeDL = 20;
		return {MIN: (powerlimit-powerRangeDL) , MAX: powerlimit};
	}
	this.parse = function(s) {
		if (s.length<1556) return -1; 
		var i;
		var res;
		var ind = 0;
		this.frm = s;
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		// for (var n=0;n<this.MAXREMOTES;n++){
		// 	this.remote[n].powerlimit[0] = factory.commomUl?33:24;
		// 	this.remote[n].powerlimit[1] = factory.commomUl?33:30;
		// }
		this.powerRemoteRange[1].MAX = factory.commomUl?33:24;
		this.powerRemoteRange[3].MAX = factory.commomUl?33:30;
		this.powerRemoteRange[1].MIN = factory.commomUl?13:4;
		this.powerRemoteRange[3].MIN = factory.commomUl?13:10;
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
					this.freqHz[b][i][ch] = ((res & 0x20)>>5)*factory.fstep/2; //1 extra bit for freq
					this.bwIndex[b][i][ch] = (res & 0x7);
					if (!factory.commomUl){
						if (this.bwIndex[b][i][ch]==0) this.bwIndex[b][i][ch]=1;//No existe filtro 150KHz para V/U
					}
					this.bwKHz[b][i][ch] = this.computeBWFromIndex(this.bwIndex[b][i][ch]);
					//FINE GAIN
					this.fineGainFilter[0][b][i][ch] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
					if (this.fineGainFilter[0][b][i][ch]>127) this.fineGainFilter[0][b][i][ch]-=256;
					//FREQ
					res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
					if (res>32767) res-=65536;
					this.freqHz[b][i][ch] += factory.fref[2*b+i]+res*factory.fstep;
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
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<this.MAXREMOTES;k++){
			this.connectedRemotes[k] = (res & (1<<k))!=0;
		}
		var s1 = s.split("\t");
		if (s1.length >=2){
			var s2 = s1[1].split("-");
			if (s2.length >=8){
				for (var k=0;k<this.MAXREMOTES;k++){
					this.remote[k].parse(s2[k]);
				}
			}
		}
	}
	this.getFrm = function(){
		var i;
		var res,fr;
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
					fr = ~~Math.round((this.freqHz[b][i][ch]-factory.fref[2*b+i])/factory.fstep*2);if (fr<0) fr+=131072; //1extra bit for freq
					mask|= (fr & 0x1)<<5;
					cfg += hexformat(mask,2);
					//FINE GAIN
					res=this.fineGainFilter[0][b][i][ch];if (res<0) res+=256;
					cfg += hexformat(res,2);
					//FREQ
					cfg += hexformat((fr>>1) & 0xffff,4);
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
		mask = 0;
		for(var k=0;k<this.MAXREMOTES;k++){
			if (this.connectedRemotes[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask,2);
		cfg += "\t";
		for(var k=0;k<this.MAXREMOTES;k++){
			cfg += this.remote[k].getFrm();
			if (k<(this.MAXREMOTES-1)) cfg += "-";
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
function ConfigRemote(){
	this.header					= 0;
	this.ver					= 0;
	this.band					= 0;
	this.pmax					= [[0,0],[0,0]];
	this.powerlimit				= [33,33]; //Ahora constante. En el futuro estará en la trama
	this.ulAtt					= [0,0];
	this.forcePaOn				= [false,false];
	this.forcePaOff				= [false,false];
	this.forceLnaOn				= [false,false];
	this.forceLnaOff			= [false,false];
	this.paStateOn				= [false,false];
	this.lnaStateOn				= [false,false];
	this.frm					= "";
	this.isConfigValid = false;
	
	this.parse = function(s) {
		if (s.length<20) return -1; 
		var b,i;
		var res;
		var ind = 0;
		this.frm = s;		
		this.header = parseInt(s.substr(ind,2), 16); ind+=2;
		var address = (this.header >> 4) & 0x0F;
		if (address < 1 || address > 8) {
			this.isConfigValid = false;
		} else {
			this.isConfigValid = true;
		}
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		this.band = (res & 0xf0) >> 4;
		this.ver = res & 0xf;
		if (this.ver > 0) {
			/* Con versión de trama >= 1 los bytes de atenuador contendrán Power Limit del remoto
			 * para poder tener en cuenta los remotos high power */
			for (b=0;b<2;b++){ this.powerlimit[b] = parseInt(s.substr(12+2*b,2), 16); }
		}
		// alert("address="+address+" version="+this.ver+" band="+this.band+"powelimit("+
		// 	this.powerlimit[0]+" "+this.powerlimit[1]+")");
		for (b=0;b<2;b++){
			for (i=0;i<2;i++){
				res = parseInt(s.substr(ind,2), 16); ind+=2; if (res>127) res-=256;
				if (i==0)
					this.pmax[b][i] = res;
				else
					this.pmax[b][i] = this.powerlimit[b]-res;
			}
		}
		for (b=0;b<2;b++){ this.ulAtt[b] = parseInt(s.substr(ind,2), 16); ind+=2; }
		ind+=2; //se byapasa forcePA, y forceLNAs porque no tiene sentido interpretarlos
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (b=0;b<2;b++){
			this.paStateOn[b] = (res & (1<<b))!=0;
			this.lnaStateOn[b] = (res & (1<<(b+2)))!=0;
		}
	}
	this.getFrm = function(){
		var cfg = "";
		var i;
		var mask = 0;
		var b;
		
		cfg += hexformat(this.header,2);
		mask = ((this.band & 0xf)<<4) | (this.ver & 0xf);
		cfg += hexformat(mask,2);
		for (b=0;b<2;b++){
			for (i=0;i<2;i++){
				if (i==0)
					mask = this.pmax[b][i];
				else
					mask = this.powerlimit[b]-this.pmax[b][i];
				cfg += hexformat(mask,2);
			}
		}
		if (this.ver > 0) {
			for (b=0;b<2;b++) this.ulAtt[b] = this.powerlimit[b];
		}
		for (b=0;b<2;b++) cfg += hexformat(this.ulAtt[b],2);
		mask = 0;
		for (b=0;b<2;b++){
			if (this.forcePaOn[b]) mask |= 1<<(2*b);
			if (this.forcePaOff[b]) mask |= 1<<(2*b+1);
			if (this.forceLnaOn[b]) mask |= 1<<(2*b+4);
			if (this.forceLnaOff[b]) mask |= 1<<(2*b+5);
		}
		cfg += hexformat(mask,2);
		mask = 0;
		for (b=0;b<2;b++){
			if (this.paStateOn[b]) mask |= 1<<(b);
			if (this.lnaStateOn[b]) mask |= 1<<(b+2);
		}		
		cfg += hexformat(mask,2);
		this.frm = cfg;
		return cfg;
	}
}
function NFPAconf(){
	this.MAXREMOTES 			= 8;
	this.NUMALARM				= 24;
	this.NUMALARMREMOTE			= 16;
	this.retLossTh				= [0,0];
	this.minPowerVSWR			= [0,0];
	this.alarmNumSens			= [0,0];
	this.timeTxLowPowHigh		= [0,0];
	this.timeTxLowPowLow		= [0,0];
	this.antennaDisconnectionThreshold = [0,0];
	this.relayLogicConfigNormal	= []; // 7 --> 1boolean/relay ---
	this.alarmEnabled			= []; //24 --> 1boolean/alarm ---
	this.relayAssignAlarm		= []; //24 alarm x 7 --> 1boolean/relay ---
	this.relayAssignAlarmRemote	= []; //16 alarm x 7 --> 1boolean/relay ---
	this.delayTimerON			= []; // 7 --> 1boolean/relay ---
	this.latchTimerON			= []; // 7 --> 1boolean/relay ---
	this.delayTimer				= []; // 7 --> 1int/relay ---
	this.latchTimer				= []; // 7 --> 1int/relay ---
	this.alarmNames				= ["HW Fail","High.Temp","Antenna Isolation","VSWR B0","Oscillation Detection","VSWR B1",
									"Antenna Disconnection B0", "Antenna Disconnection B1", "UL PA Fail B0", "UL PA Fail B1", "Overload DL B0", "Overload DL B1",
									"Rx Power Low B0", "Rx Power Low B1", "Remote Disconnection", "Undefined", "DL PA Fail B0","DL PA Fail B1", "Tx Power Low B0", "Tx Power Low B1",
								    	"Laser Fail","Photodiode Fail","Undefined","Force RF OFF"];
	this.naturalOrder			= [0,1,2,4,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	this.externalAlarmPolarity 	= [];
	
	this.remote					= []; //8 uno por remoto
	
	for (var k=0;k<this.MAXREMOTES;k++){
		this.remote.push(new NFPAconfRemote());
	}
	
	//define vector/matrix
	for (var k=0;k<7;k++){
		this.relayLogicConfigNormal.push(true);
		this.delayTimerON.push(false);
		this.latchTimerON.push(false);
		this.delayTimer.push(0);
		this.delayTimer.push(0);
	}
	for (var k=0;k<this.NUMALARM;k++){
		this.alarmEnabled.push(false);
		this.relayAssignAlarm.push([]);
		for (var j=0;j<7;j++) this.relayAssignAlarm[k].push(false);
	}
	for (var k=0;k<this.NUMALARMREMOTE;k++){
		this.relayAssignAlarmRemote.push([]);
		for (var j=0;j<7;j++) this.relayAssignAlarmRemote[k].push(false);
	}	
	for (var k = 0; k < 4; k++) {
		this.externalAlarmPolarity.push(false);
	}

	this.frm					= "";
	this.parse = function(s) {
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		if (s.length<346) return -1; 
		var res;
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
		for (var k=0;k<2;k++){
			this.antennaDisconnectionThreshold[k] = cSignedByte(parseInt(s.substring(ind,ind+2), 16)); ind+=2;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<7;k++){
			this.relayLogicConfigNormal[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res |= parseInt(s.substring(ind,ind+2), 16)<<8; ind+=2;
		res |= parseInt(s.substring(ind,ind+2), 16)<<16; ind+=2;
		
		ind+=6; //3bytes sin uso
		for (var k=0;k<this.NUMALARM;k++){
			this.alarmEnabled[k] = (res & (1<<k))!=0;
		}
		this.alarmEnabled[22]=false; //door open deshabilitada
		this.alarmEnabled[15]= false; //Alarma no definida
		if (factory.commomUl){
			this.alarmEnabled[7]=false; //para 7/8 ant.disconnectB1 deshabilitada
			this.alarmEnabled[9]= false; //para 7/8 ulpafail B1 deshabilitada	
		}
		for (var k=0;k<this.NUMALARM;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignAlarm[k][j] = (res & (1<<j))!=0;
			}
			if (k >=20) {
				var externalAlarmNr = k - 20;
				this.externalAlarmPolarity[externalAlarmNr] = (res & 0x80) != 0;
			}
		}
		for (var j=0;j<7;j++){
			this.relayAssignAlarm[22][j] = false; //door open sin relay assign
			this.relayAssignAlarm[15][j] = false; //Alarma no definida
			if (factory.commomUl){
				this.relayAssignAlarm[7][j] = false; //para 7/8 ant.disconnectB1 deshabilitada
				this.relayAssignAlarm[9][j] = false; //para 7/8 ulpafail B1 deshabilitada	
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
		// for (var k=0;k<4;k++){ 
			ind+=120;
			//this.alarmNames[23] = s.substring(ind,ind+30).trim();ind+=30;
		// }
		for (var k=0;k<this.NUMALARMREMOTE;k++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var j=0;j<7;j++){
				this.relayAssignAlarmRemote[k][j] = (res & (1<<j))!=0;
			}
		}		
		for (var k=0;k<4;k++){
			this.remote[0].alarmNames[10+k] = s.substring(ind,ind+30).trim();ind+=30;
			for ( var n = 1; n < this.MAXREMOTES; n++) {
				this.remote[n].alarmNames[10+k] = this.remote[0].alarmNames[10+k];
			}
		}
		var s1 = s.split("\t");
		if (s1.length >=2){
			var s2 = s1[1].split("-");
			if (s2.length >=8){
				for (var k=0;k<this.MAXREMOTES;k++){
					this.remote[k].parse(s2[k]);
				}
			}
		}
	}
	this.getFrm = function(){
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		var factory = new Factory(str);
		var res;
		var mask = 0;
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
		for (var k=0;k<2;k++){
			if (this.antennaDisconnectionThreshold[k] < -128) {
				this.antennaDisconnectionThreshold[k] = -128;
			} else if (this.antennaDisconnectionThreshold[k] > 127) {
				this.antennaDisconnectionThreshold[k] = 127;
			}
			cfg += hexformat(rSignedByte(this.antennaDisconnectionThreshold[k]),2);
		}
		for (var k=0, mask=0 ;k<7;k++){
			if (this.relayLogicConfigNormal[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask,2);
		this.alarmEnabled[22] = false; //door open deshabilitada
		this.alarmEnabled[15] = false; //alarma no definida
		if (factory.commomUl){
			this.alarmEnabled[7]=false; //para 7/8 ant.disconnectB1 deshabilitada
			this.alarmEnabled[9]= false; //para 7/8 ulpafail B1 deshabilitada	
		}
		for (var k=0, mask=0;k<this.NUMALARM;k++){
			if (this.alarmEnabled[k]) mask|= 1<<k;
		}
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		cfg += hexformat((mask & 0xff0000)>>16,2);
		cfg += "000000";//3bytes sin uso
		for (var j=0;j<7;j++){
			this.relayAssignAlarm[22][j] = false; //door open relay assign = false
			this.relayAssignAlarm[15][j] = false; //alarma no definida
			if (factory.commomUl){
				this.relayAssignAlarm[7][j] = false; //para 7/8 ant.disconnectB1 deshabilitada
				this.relayAssignAlarm[9][j] = false; //para 7/8 ulpafail B1 deshabilitada	
			}
		}
		for (var k=0;k<this.NUMALARM;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignAlarm[k][j]) mask|= 1<<j;
			}
			if (k >= 20) {
				var externalAlarmNr = k - 20;
				if (this.externalAlarmPolarity[externalAlarmNr]) {
					mask |= 0x80;
				}
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
		this.alarmNames[23] = "Force RF OFF";
		for (var k=0;k<4;k++){
			var aux = this.alarmNames[20+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		
		for (var k=0;k<this.NUMALARMREMOTE;k++){
			for (var j=0,mask=0;j<7;j++){
				if (this.relayAssignAlarmRemote[k][j]) mask|= 1<<j;
			}
			cfg += hexformat(mask,2);
		}
		for (var k=0;k<4;k++){
			var aux = this.remote[0].alarmNames[10+k].substring(0,30);
			while (aux.length<30) aux+=" ";
			cfg += aux;
		}
		cfg += "\t";
		for(var k=0;k<this.MAXREMOTES;k++){
			cfg += this.remote[k].getFrm();
			if (k<(this.MAXREMOTES-1)) cfg += "-";
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
function NFPAconfRemote(){
	
	this.NUMALARM 				= 15;
	this.alarmEnabled			= []; //NUMALARM
	this.externalAlarmPolarity 	= [false,false,false,false]; //4 external alarms
	this.alarmNames				= ["VSWR B0","LNA Fail B0","DL PA Fail B0","VSWR B1","LNA Fail B1","DL PA Fail B1","High.Temp","Undefined","Overload B0","Overload B1",
								   "External Input 1","External Input 2","External Input 3","External Input 4","Remote Disconnection",""];
	this.naturalOrder 			= [2,5,1,4,8,9,0,3,6,7,10,11,12,14,13,15]; //array auxiliar para representar la lista de alarmas de remoto
	
	for (var k=0;k<this.NUMALARM;k++)
		this.alarmEnabled.push(k<11);
	
	this.frm					= "";
	this.parse = function(s){
		if (s.length<6) return -1; 
		var res;
		var ind = 0;
		this.frm = s;
		
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.alarmEnabled[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.alarmEnabled[k+8] = (res & (1<<k))!=0;
		}
		// this.alarmEnabled[6] = false; //Se fuerza a false High.Temp
		// this.alarmEnabled[8] = false; //Se fuerza a false Overload B0
		// this.alarmEnabled[9] = false; //Se fuerza a false Overload B1
		this.alarmEnabled[13] = false; //Se fuerza a false external input 4 de remotos
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var b=0;b<4;b++){
			this.externalAlarmPolarity[b] = (res & (1<<b))!=0;
		}		
	}
	this.getFrm = function(){
		var res;
		var mask = 0;
		var cfg = "";
		
		// this.alarmEnabled[6] = false; //Se fuerza a false High.Temp
		// this.alarmEnabled[8] = false; //Se fuerza a false Overload B0
		// this.alarmEnabled[9] = false; //Se fuerza a false Overload B1
		this.alarmEnabled[13] = false; //Se fuerza a false external input 4 de remotos
		
		for (var k=0;k<this.NUMALARM;k++){
			if (this.alarmEnabled[k]) mask |= 1<<k;
		}
		mask|=0x8000;//se fuerza bit15 a '1' alarm enable de Communication Error en remote
		cfg += hexformat(mask & 0xff,2);
		cfg += hexformat((mask & 0xff00)>>8,2);
		
		mask = 0;
		for (var b=0;b<4;b++){
			if (this.externalAlarmPolarity[b]) mask |= 1<<b;
		}
		cfg += hexformat(mask,2);
		this.frm = cfg;
		return cfg;
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
	this.bbLevel = [-128,-128];
	this.frm 					= "";
	
	this.parse = function(s) {
		if (s.length<298) return -1; 
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
		for (var k=0;k<2;k++){
			this.bbLevel[k] = to_float(parseInt(s.substr(ind,4),16)); ind += 4;
		}
	}
}
function overallConfigToTextFile(config, nfpacfg, factory, tagstr, ethstr, serial, version){
	var cfg = "";
	cfg += tagToText(tagstr,config);
	cfg += rfConfigToText(config,nfpacfg,factory) + "\n";
	cfg += rfConfigRemoteToText(config,nfpacfg,factory);
	cfg += alarmSettingsToText(nfpacfg,factory) + "\n";
	cfg += alarmRemoteSettingsToText(config,nfpacfg,factory);
	cfg += ethConfigToText(ethstr);
	cfg += versionToText(version,config);
	cfg += serialToText(serial,config);
	return cfg;
}
function serialToText(serial,config){
	var cfg, j, n, valid;
	cfg = "SERIAL NUMBERS\n";
	cfg += "\tMaster:   " + serial.substr(0, 10).trim() + "\n";
	for (j=0;j<config.MAXREMOTES;j++){
		valid = config.remote[j].isConfigValid;
		if (config.connectedRemotes[j]) cfg += "\tRemote "+ (j+1) + ": " + (valid?serial.substr(15*(j+1), 10).trim():"---") + "\n";	
	}
	cfg += "\n";
	return cfg;
}
function tagToText(tagstr,config){
	var cfg, j, n, valid;
	cfg = "TAGS\n";
	cfg += "\tMaster:   " + tagstr.substr(0, 30).trim() + "\n";
	for (j=0;j<config.MAXREMOTES;j++){
		valid = config.remote[j].isConfigValid;
		if (config.connectedRemotes[j]) cfg += "\tRemote "+ (j+1) + ": " + (valid?tagstr.substr(30*(j+1), 30).trim():"---") + "\n";	
	}
	cfg += "\n";
	return cfg;
}
function versionToText(version, config){
	var j,valid,cfg,v;
	cfg  = "\nVERSION\n";
	cfg += "\tMaster:   uC:" + window.parent.navi.document.getElementById('swBox').innerHTML;
	cfg += "\tFPGA:" + window.parent.navi.document.getElementById('fwBox').innerHTML;
	cfg += "\tETH:" + window.parent.navi.document.getElementById('serverBox').innerHTML+"\n";
	for (j=0;j<config.MAXREMOTES;j++){
		valid = config.remote[j].isConfigValid;
		v = parseInt(version.substr(16+j*8,2),16)+"."+parseInt(version.substr(18+j*8,2),16);
		if (config.connectedRemotes[j]) cfg += "\tRemote "+ (j+1) + ": uC:" + (valid? v:"---") + "\n";	
	}
	cfg += "\n";	
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
function alarmSettingsToText(nfpacfg,factory){
	var j,k,p;
	var exist_el;
	var cfg = "";
	var name;
	cfg+="ALARM/RELAY SETTINGS MASTER\n";

	for (k=0; k < nfpacfg.alarmNames.length; k++) {
		p = nfpacfg.naturalOrder[k];
		name = transformAlarmName(nfpacfg.alarmNames[p],0,p,factory);
		if ( name.search("Undefined") >= 0 || name.search("Remote Disconnection") >= 0)
			continue;
		cfg+="\tAlarm Enable " + name + ": " + boolToYN(nfpacfg.alarmEnabled[p]) + "\n";
	}
	for (k=0; k < nfpacfg.alarmNames.length; k++) {
		p = nfpacfg.naturalOrder[k];
		name = transformAlarmName(nfpacfg.alarmNames[p],0,p,factory);
		if ( name.search("Undefined") >= 0 || name.search("Remote Disconnection") >= 0)
			continue;
		cfg+="\tRelay Assigned " + name + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			if (nfpacfg.relayAssignAlarm[p][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);
		cfg+="\n";

	}
	for (var k = 0; k < nfpacfg.remote[0].alarmNames.length; k++) {
		p = nfpacfg.remote[0].naturalOrder[k];
		name = transformAlarmName(nfpacfg.remote[0].alarmNames[p],1,p,factory);
		if ( name.search("Undefined") >= 0 || name.length == 0)
			continue;
		if (name.search("Remote Disconnection") >= 0)
			cfg+="\tRelay Assigned "+ name + ": ";
		else
			cfg+="\tRelay Assigned Remote "+ name + ": ";
		exist_el = false;
		for (j=0;j<4;j++){
			if (nfpacfg.relayAssignAlarmRemote[p][j]){
				cfg+=(j+1)+", ";
				exist_el = true;
			}
		}
		if (exist_el) cfg = cfg.substring(0,cfg.length-2);	
		cfg+="\n";
	}
	for (k=0;k<3;k++)
		cfg+="\tRelay "+ (k+1) +" Status On Alarm (CLOSED/OPEN): " + (nfpacfg.relayLogicConfigNormal[k]?"OPEN":"CLOSED") + "\n";
	cfg+="\tMaster User Alarm Name: ";
	for (k=3;k<4;k++)
		cfg+=nfpacfg.alarmNames[20+k].trim()+", ";
	cfg = cfg.substring(0,cfg.length-2)+"\n";
	cfg+="\tMaster User Alarm Polarity: ";
	for (k=3;k<4;k++)
		cfg+=(nfpacfg.externalAlarmPolarity[k]?"HIGH":"LOW")+", ";	
	cfg = cfg.substring(0,cfg.length-2)+"\n";
	cfg+="\tRemote User Alarm Name: ";
	for (k=0;k<4;k++)
		cfg+=nfpacfg.remote[0].alarmNames[10+k].trim()+", ";
	cfg = cfg.substring(0,cfg.length-2)+"\n";	
	return cfg;
}
function alarmRemoteSettingsToText(config,nfpacfg,factory){
	var j,k,p;
	var exist_el;
	var cfg = "";
	var name;
	
	for (j=0;j<config.MAXREMOTES;j++){
		if (config.connectedRemotes[j]){
			cfg += "ALARM/RELAY SETTINGS REMOTE "+(j+1)+":\n"
			if (config.remote[j].isConfigValid){
				for (var k = 0; k < nfpacfg.remote[j].alarmNames.length; k++) {
					p = nfpacfg.remote[0].naturalOrder[k];
					if (p==13) {
						//se quita external alarm 4 de remotos
						continue;
					}
					name = transformAlarmName(nfpacfg.remote[0].alarmNames[p],j+1,p,factory);
					if ( name.search("Undefined") >= 0 || name.length == 0)
						continue;					
					cfg+="\tAlarm Enable "+ name + ": " + boolToYN(nfpacfg.remote[j].alarmEnabled[p]) + "\n";
				}
				cfg+="\tUser Alarm Polarity: ";
				for (k=0;k<3;k++)	//se quita external alarm 4 de remotos
					cfg+=(nfpacfg.remote[j].externalAlarmPolarity[k]?"HIGH":"LOW")+", ";					
				cfg = cfg.substring(0,cfg.length-2)+"\n\n";
			}else{
				cfg += "\tDISCONNECTED\n\n";
			}
		}
	}
	
	return cfg;
}
function transformAlarmName(s,nr,index,factory){
	var name = s;
	if (factory.commomUl && ((nr==0 && index>=6 && index<=9)||(nr>0 && (name.search("LNA")>=0 || name.search("Overload")>=0) ))){
		name = name.replace("B0","");
		if (name.search("B1")>=0) name = "Undefined";
	}else{
		for (var j=0;j<2;j++)
			name = name.replace("B"+j,factory.bandNames[j]);
	}
	for (var j=0;j<2;j++){
		if (!factory.chBandEnabled[j] && !factory.adjBandEnabled[j] && name.search(factory.bandNames[j])>=0)
				name = "Undefined";
	}
	return name;
}
function rfConfigRemoteToText(config, nfpacfg, factory){
	var i,j,cfg="";	
	for (j=0;j<config.MAXREMOTES;j++){
		if (config.connectedRemotes[j]){
			cfg += "CONFIG RF REMOTE "+(j+1)+":\n"
			if (config.remote[j].isConfigValid){
				cfg += "\tRF Enabled: " + boolToYN(config.remote[j].paStateOn[0]) + "\n";
				cfg += "\tFiber Optical Loss (dBo): " + ((config.remote[j].pmax[0][0]+20)/2).toFixed(1) + "\n";
				for (i=0;i<2;i++){
					if (factory.chBandEnabled[i] || factory.adjBandEnabled[i])
						cfg += "\tPower "+factory.bandNames[i]+"(dBm): " + (config.remote[j].pmax[i][1]) + "\n";
				}
				cfg += "\n";
			}else{
				cfg += "\tDISCONNECTED\n\n";
			}
		}
	}
	return cfg;
}
function rfConfigToText(config, nfpacfg, factory){
	var i;
	var cfg = "";
	cfg += rfConfigGeneralAlarmToText(config, nfpacfg);
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
	return cfg;
}
function rfConfigGeneralAlarmToText(config, nfpacfg){
	var cfg = "";
	cfg+="CONFIG GENERAL\n";
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
	if ( factory.commomUl ) {
		cfg+="\tAntenna Disconnection Input Threshold (dBm): " + (nfpacfg.antennaDisconnectionThreshold[0]) + "\n";
	}
	cfg+="\tConfigured Remotes: ";
	for (var n=0 , j=0;j<config.MAXREMOTES;j++){
		if(config.connectedRemotes[j]){
			cfg+=(j+1)+", ";
			n++;
		}
	}
	if (n>0) cfg = cfg.substring(0,cfg.length-2);
	cfg+="\n";	
	return cfg;
}

function rfConfigGeneralBandToText(config,band){
	var j;
	var uldl = ["UL","DL"];
	var cfg = "";
	cfg+="\tGeneral\n";
	for (j=0;j<2;j++) cfg+="\t\tAttenuation " + uldl[j]+ " (dB): " + (factory.gainlimit[2*band+j]-config.gain[band][j]) +"\n";
	for (j=0;j<2;j++) cfg+="\t\tRF Output Enabled " + uldl[j]+ ": " + boolToYN(config.paEnabled[band][j])+"\n";
	cfg+="\t\tPower " + uldl[0]+ " (dBm): " + config.power[band][0]+"\n";
	cfg+="\t\tPA Enabled " + uldl[0]+ ": " + boolToYN(config.paEnabled[band][0])+"\n";
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
		if (band==0) cfg+="\t\tAssign 1st ADJBW Filter to BAND 14: " + boolToYN(config.firstADJisFirstNet) + "\n";
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
	// cfg+="\t\tReturn Loss Threshold (dB): " + (nfpacfg.retLossTh[band]) + "\n";
	// cfg+="\t\tMinimum TX Power for VSWR Detection (dBm): " + (nfpacfg.minPowerVSWR[band]) + "\n";
	// cfg+="\t\tReturn Loss Alarm Sensitivity (seconds): " + (nfpacfg.alarmNumSens[band]) + "\n";
	cfg+="\t\tDonor Antenna Failure Timer Threshold (seconds): " + (nfpacfg.timeTxLowPowLow[band]) + "\n";
	if ( !factory.commomUl ) {
		cfg+="\t\tAntenna Disconnection Input Threshold (dBm): " + (nfpacfg.antennaDisconnectionThreshold[band]) + "\n";
	}
	return cfg;
}

function boolToYN(val){
	return (val?"YES":"NO");
}