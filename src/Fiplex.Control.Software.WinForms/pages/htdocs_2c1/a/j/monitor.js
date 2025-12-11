function Monitor() {
	this.CHNR 						= 32;
	this.ADJNR 						= 4;
	
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
	this.bbAgcOut					= [[0,0],[0,0]]; //band 0/1 ul/dl
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
	this.relayONOFF					= []; // 8 boolean/relay
	this.relayOpenClosed			= []; // 8 boolean/relay
	this.gralAlarm					= []; //16 boolean/alarm
	this.bandAlarm					= []; //2band x 8boolean/alarm
	this.bbuAlarm					= []; //16 boolean/alarm
	this.delayTimerRunning			= []; // 8 boolean/relay
	this.delayTimer					= []; // 8 int/relay
	this.latchTimerRunning			= []; // 8 boolean/relay
	this.latchTimer					= []; // 8 int/relay	
	this.cnDet					= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][32]
	this.isZeros = false;
	this.bbuChargerErrorCode;

	this.frm						= "";
	
	for (var nbadj=0;nbadj<2;nbadj++){
		this.signalDet.push([]);	
		this.oscDetectCH.push([]);
		this.level.push([]);
		this.gain.push([]);
		this.cnDet.push([]);
		for (var band=0;band<2;band++){
			this.signalDet[nbadj].push([]);	
			this.oscDetectCH[nbadj].push([]);
			this.level[nbadj].push([]);
			this.gain[nbadj].push([]);
			this.cnDet[nbadj].push([]);
			for (var ch=0;ch<(2*this.CHNR);ch++){ //se duplica el tamaño para single band
				this.oscDetectCH[nbadj][band].push(false);	
				this.cnDet[nbadj][band].push(false);
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
	for (var band=0;band<2;band++){
		this.bandAlarm.push([]);
		for (var k=0;k<8;k++){
			this.bandAlarm[band].push(false);
		}
	}
	for (var k=0;k<16;k++) {
		this.bbuAlarm.push(false);
	}
	for (var k=0;k<8;k++){
		this.relayONOFF.push(false);
		this.relayOpenClosed.push(false);
		this.delayTimerRunning.push(false);
		this.latchTimerRunning.push(false);
		this.delayTimer.push(0);
		this.latchTimer.push(0);
	}
	for (var k=0;k<16;k++)
		this.gralAlarm.push(false);

	this.level_in_ul_minmax = [];	// B0/B1 NB/ADJ1/../ADJ4 min/max
	for (var band=0;band<2;band++){
		this.level_in_ul_minmax.push([]);
		for (var k=0;k<1+this.ADJNR;k++){
			this.level_in_ul_minmax[band].push([]);
			for (var i=0;i<2;i++){
				this.level_in_ul_minmax[band][k].push(-128);
			}
		}
	}
	this.automatic_ul_gain_running = false;

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
		if (s.length!=1548) return -1;
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
		//NFPA Status
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++){
			this.relayONOFF[k] = (res & (1<<k))!=0;
			this.relayOpenClosed[k] = (res2 & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++)
			this.gralAlarm[k] = (res & (1<<k))!=0;
		
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (var k=0;k<8;k++)
			this.gralAlarm[8+k] = (res & (1<<k))!=0;			
		
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;		
		for (var k=0;k<8;k++){
			this.bandAlarm[0][k] = (res & (1<<k))!=0;
			this.bandAlarm[1][k] = (res2 & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		res2 = parseInt(s.substring(ind,ind+2), 16); ind+=2;		
		for (var k=0;k<8;k++) {
			this.bbuAlarm[k] = (res & (1<<k))!=0;
			this.bbuAlarm[8+k] = (res2 & (1<<k))!=0;
		}
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuChargerErrorCode = res;
		for (var k=0;k<8;k++){
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.delayTimerRunning[k] = (res & 0x80000000)!=0;
			this.delayTimer[k] = res & 0x7fffffff;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			this.latchTimerRunning[k] = (res & 0x80000000)!=0;
			this.latchTimer[k] = res & 0x7fffffff;
		}
		// AGC BAND OUT
		for (var band=0;band<2;band++) {
			for (var uldl=0;uldl<2;uldl++) {
				this.bbAgcOut[band][uldl] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; 
			}
		}
		// C/N
		for (var band=0;band<2;band++) {
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			// alert(hexformat(res,8));
			for (var ch=0;ch<this.CHNR;ch++) this.cnDet[0][band][ch] = (res & (1<<ch))!=0; //nb
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=0;ch<this.ADJNR;ch++) this.cnDet[1][band][ch] = (res & (1<<ch))!=0; //adj
		}
		// level in UL min/max - commissioning gain UL 7/8/FN
		for (var band=0;band<2;band++) {
			for (var k=0; k<1+this.ADJNR; k++){
				for (var i=0; i<2; i++) {
					this.level_in_ul_minmax[band][k][i] = cSignedByte(parseInt(s.substring(ind,ind+2),16)); ind+=2;
				}
			}
		}
		res = parseInt(s.substring(ind,ind+2),16); ind+=2;
		this.automatic_ul_gain_running = (res & 0x01)!=0;
		//arreglo para single band.
		//si single band0 stat1-32 band 1 --> stat33-64 band0
		if (factory.singleBandEnabled[0]){
			for (var ch=0;ch<this.CHNR;ch++){
				this.oscDetectCH[0][0][ch+this.CHNR] = this.oscDetectCH[0][1][ch];
				this.cnDet[0][0][ch+this.CHNR] = this.cnDet[0][1][ch];
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
				this.cnDet[0][1][ch+this.CHNR] = this.cnDet[0][0][ch];
				for (var i=0;i<2;i++){
					this.signalDet[0][1][i][ch+this.CHNR] = this.signalDet[0][0][i][ch];
					this.level[0][1][i][ch+this.CHNR] = this.level[0][0][i][ch];
					this.gain[0][1][i][ch+this.CHNR] = this.gain[0][0][i][ch];
				}
			}
		}		
	}
}