function Monitor() {
	this.CHNR 						= 32;
	this.ADJNR 						= 4;
	this.MAXREMOTES					= 8;
	this.NUMALARM					= 32;
	
	this.blocked					= false;
	this.fpgaErr					= false;
	this.boardTempAlarm				= false;
	this.extremeTempActionOn		= false;
	this.ulBandPAIndependent		= true;
	this.chBandEnabled				= [true,true]; //activación sección NB band0/1
	this.adjBandEnabled				= [true,true]; //activación sección ADJ band0/1
	this.boardTemp					= 0;
	this.boardCurrent				= 0;
	this.overload					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.rxLowAlarm					= [[false,false],[false,false]]; //nb/adj band0/1
	this.oscDetect					= [false,false]; //band 0/1
	this.antennaIsol				= [false,false]; //band 0/1
	this.isolMeasRunning			= [false,false]; //band 0/1
	this.configGain					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.signalDet					= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.oscDetectCH				= []; // nb/adj band0/1 nfilter [2][2][32]
	this.maxAllowGain				= [0,0]; //band 0/1
	this.retryTime					= [0,0]; //band 0/1
	this.bbAgc					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.level						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.gain						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.paFail						= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.agcFail					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.vswr						= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.txLow						= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.statePaOn					= [[false,false],[false,false]]; //band 0/1 ul/dl
	this.estTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.detTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.refTxPow					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.paCurrent					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.relayONOFF					= []; // 7 boolean/relay
	this.relayOpenClosed			= []; // 7 boolean/relay
	this.alarmStatus				= []; //24 boolean/alarm
	this.delayTimerRunning			= []; // 7 boolean/relay
	this.delayTimer					= []; // 7 int/relay
	this.latchTimerRunning			= []; // 7 boolean/relay
	this.latchTimer					= []; // 7 int/relay	
	this.remoteConfigMask = 0;	// 1 byte, copia de máscara de remotos en configuración
	this.remoteDetectedMask = 0;	// 1 byte, máscara de remotos que dan respuesta
	this.remoteAlarmMask = 0;	// 1 byte, máscara de remotos que no dan respuesta
	this.isZeros = false;
	
	this.remote						= [];
	
	this.frm						= "";
	
	for (var k=0;k<this.MAXREMOTES;k++)
		this.remote.push(new MonitorRemote());
	
	for (var nbadj=0;nbadj<2;nbadj++){
		this.signalDet.push([]);	
		this.oscDetectCH.push([]);
		this.level.push([]);
		this.gain.push([]);
		for (var band=0;band<2;band++){
			this.signalDet[nbadj].push([]);	
			this.oscDetectCH[nbadj].push([]);
			this.level[nbadj].push([]);
			this.gain[nbadj].push([]);
			for (var ch=0;ch<(2*this.CHNR);ch++){ //se duplica el tamaño para single band
				this.oscDetectCH[nbadj][band].push(false);	
			}
			for (var uldl=0;uldl<2;uldl++){
				this.signalDet[nbadj][band].push([]);	
				this.level[nbadj][band].push([]);
				this.gain[nbadj][band].push([]);
				for (var ch=0;ch<(2*this.CHNR);ch++){ //se duplica el tamaño para single band
					this.signalDet[nbadj][band][uldl].push(false);
					this.level[nbadj][band][uldl].push(0);
					this.gain[nbadj][band][uldl].push(0);
				}
			}
		}
	}

	for (var k=0;k<7;k++){
		this.relayONOFF.push(false);
		this.relayOpenClosed.push(false);
		this.delayTimerRunning.push(false);
		this.latchTimerRunning.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}
	for (var k=0;k<this.NUMALARM;k++)
		this.alarmStatus.push(false);

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
		this.isZeros = false;
		if (s.length<1324) return -1; 
		var res,res2;
		var ind = 0;
		this.frm = s;
		//GLOBAL
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.fpgaErr = (res & 0x1)!=0;
		this.boardTempAlarm = (res & 0x2)!=0;
		this.ulBandPAIndependent = (res & 0x4)!=0;
		this.chBandEnabled[0] = (res & 0x10)!=0;
		this.adjBandEnabled[0] = (res & 0x20)!=0;
		this.chBandEnabled[1] = (res & 0x40)!=0;
		this.adjBandEnabled[1] = (res & 0x80)!=0;
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		this.boardCurrent = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
		//BAND
		for (var band=0;band<2;band++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.overload[band][0] = (res & 0x1)!=0; //ul
			this.overload[band][1] = (res & 0x2)!=0; //dl
			this.rxLowAlarm[0][band] = (res & 0x4)!=0; //nb
			this.rxLowAlarm[1][band] = (res & 0x8)!=0; //adj
			this.oscDetect[band] = (res & 0x10)!=0;
			this.antennaIsol[band] = (res & 0x20)!=0;
			this.isolMeasRunning[band] = (res & 0x40)!=0;
			if (band == 0) {
				this.extremeTempActionOn = (res & 0x80) != 0;
			}
			this.configGain[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.configGain[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR;ch++) this.signalDet[0][band][0][ch] = (res & (1<<ch))!=0; //nb ul
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR;ch++) this.signalDet[0][band][1][ch] = (res & (1<<ch))!=0; //nb dl
			this.maxAllowGain[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<this.CHNR;ch++) this.oscDetectCH[0][band][ch] = (res & (1<<ch))!=0; //nb
			this.retryTime[band] = parseInt(s.substring(ind,ind+4), 16); ind+=4;
			this.bbAgc[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.bbAgc[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			for (var uldl=0;uldl<2;uldl++){
				for (var ch=0;ch<this.CHNR;ch++){
					this.level[0][band][uldl][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
					this.gain[0][band][uldl][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
				}
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				this.agcFail[band][uldl] = (res & 0x1)!=0; 
				if ( band == 0 && uldl == 0 ) {
					this.blocked = (this.agcFail[0][0] != 0);
				}
				this.paFail[band][uldl] = (res & 0x2)!=0; 
				this.vswr[band][uldl] = (res & 0x4)!=0; 
				this.txLow[band][uldl] = (res & 0x8)!=0; 
				this.statePaOn[band][uldl] = (res & 0x80)!=0; 
				this.estTxPow[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
				this.detTxPow[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
				this.refTxPow[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
				this.paCurrent[band][uldl] = (parseInt(s.substring(ind,ind+4),16)); ind+=4;
			}
			for (var uldl=0;uldl<2;uldl++){
				for (var ch=0;ch<this.ADJNR;ch++){
					this.level[1][band][uldl][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
					this.gain[1][band][uldl][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //adj
				}
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var ch=0;ch<this.ADJNR;ch++) this.signalDet[1][band][uldl][ch] = (res & (1<<ch))!=0;//adj
				if (uldl==0){
					for (var ch=0;ch<this.ADJNR;ch++) this.oscDetectCH[1][band][ch] = (res & (1<<(ch+4)))!=0;//adj
				}
			}
		}
		//arreglo para single band.
		//si single band0 stat1-32 band 1 --> stat33-64 band0
		if (factory.singleBandEnabled[0]){
			for (var ch=0;ch<this.CHNR;ch++){
				this.oscDetectCH[0][0][ch+this.CHNR] = this.oscDetectCH[0][1][ch];
				for (var i=0;i<2;i++){
					this.signalDet[0][0][i][ch+this.CHNR] = this.signalDet[0][1][i][ch];
					this.level[0][0][i][ch+this.CHNR] = this.level[0][1][i][ch];
					this.gain[0][0][i][ch+this.CHNR] = this.gain[0][1][i][ch];
				}
			}
		}
		//si single band1 stat1-32 band 0 --> stat33-64 band1
		if (factory.singleBandEnabled[1]){
			for (var ch=0;ch<this.CHNR;ch++){
				this.oscDetectCH[0][1][ch+this.CHNR] = this.oscDetectCH[0][0][ch];
				for (var i=0;i<2;i++){
					this.signalDet[0][1][i][ch+this.CHNR] = this.signalDet[0][0][i][ch];
					this.level[0][1][i][ch+this.CHNR] = this.level[0][0][i][ch];
					this.gain[0][1][i][ch+this.CHNR] = this.gain[0][0][i][ch];
				}
			}
		}		
		//NFPA Status
		if (s.length>=1438){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<7;k++){
				this.relayONOFF[k] = (res & (1<<k))!=0;
				this.relayOpenClosed[k] = (res2 & (1<<k))!=0;
			}
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++)
				this.alarmStatus[k] = (res & (1<<k))!=0;
			
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++)
				this.alarmStatus[8+k] = (res & (1<<k))!=0;	
			
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;			
			for (var k=0;k<8;k++)
				this.alarmStatus[16+k] = (res & (1<<k))!=0;
			// nuevo byte de alarmas de master con LD/PD Fail
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var k=0;k<8;k++)
				this.alarmStatus[24+k] = (res & (1<<k))!=0;

			for (var k=0;k<7;k++){
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				this.delayTimerRunning[k] = (res & 0x80000000)!=0;
				this.delayTimer[k] = res & 0x7fffffff;
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				this.latchTimerRunning[k] = (res & 0x80000000)!=0;
				this.latchTimer[k] = res & 0x7fffffff;
			}
		}
		if (s.length>=1452) {
			this.remoteConfigMask = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.remoteDetectedMask = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.remoteAlarmMask = parseInt(s.substring(ind,ind+2), 16); ind+=2;
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
	this.isRemoteConnectionAlarm = function(n) {
		var mask = 1 << n;
		if ((this.remoteConfigMask & mask) == 0) {
			return false;
		}
		return ( (this.remoteAlarmMask & mask) != 0 );
	}
}

function MonitorRemote(){
	this.NUMALARM = 15;
	this.rfIn					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.rfOut					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.agc					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.temperature			= 0;
	this.alarmStatus			= []; //NUMALARM
	this.alarmEnabled			= []; //NUMALARM
	this.paStateOn				= [false,false];
	this.lnaStateOn				= [false,false];
	this.ver					= 0;
	this.band					= 0;
	this.frm					= "";
	
	for (var k=0;k<this.NUMALARM;k++){
		this.alarmStatus.push(false);	
		this.alarmEnabled.push(false);
	}
	
	this.parse = function(s){
		if (s.length<40) return -1; 
		var res;
		var ind = 2; //no se lee ni RS485 addr ni version trama + band
		this.frm = s;
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		this.band = (res & 0xf0) >> 4;
		this.ver = res & 0xf;
		for(var b=0;b<2;b++){
			for(var i=0;i<2;i++){
				this.rfIn[b][i] = cSignedByte(parseInt(s.substr(ind,2),16));ind+=2;
				this.agc[b][i] = parseInt(s.substr(ind,2),16);ind+=2;
				this.rfOut[b][i] = cSignedByte(parseInt(s.substr(ind,2),16));ind+=2;
			}
		}
		this.temperature = cSignedByte(parseInt(s.substr(ind,2),16));ind+=2;		
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.alarmStatus[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<6;k++){
			this.alarmStatus[k+8] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.alarmEnabled[k] = (res & (1<<k))!=0;
		}
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.alarmEnabled[k+8] = (res & (1<<k))!=0;
		}		
	    	this.alarmEnabled[13] = false;
		res = parseInt(s.substr(ind,2), 16); ind+=2;
		for (var b=0;b<2;b++){
			this.paStateOn[b] = (res & (1<<b))!=0;
			this.lnaStateOn[b] = (res & (1<<(b)))!=0; //se asignan a mismos bits que PA. (no hay on/off independiente entre LNA/PA)
		}	
	}
	
}