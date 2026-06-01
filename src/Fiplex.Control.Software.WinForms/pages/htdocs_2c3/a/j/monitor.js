function Monitor() {
	this.NR_OF_RELAYS_MAX			= 10
	this.CHNR 						= 40;
	this.ADJNR 						= 4;
	

	this.blocked					= false;
	this.extremeTempActionOn		= false;
	this.ulBandPAIndependent		= true;
	this.chBandEnabled				= [true,true]; //activación sección NB band0/1
	this.adjBandEnabled				= [true,true]; //activación sección ADJ band0/1
	this.boardTemp					= 0;
	this.isolMeasRunning			= [false,false]; //band 0/1
	this.configGain					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.signalDet					= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR]
	this.oscDetectCH				= []; // nb/adj band0/1 nfilter [2][2][this.CHNR]
	this.maxAllowGain				= [0,0]; //band 0/1
	this.retryTime					= 0;
	this.afeTemp					= 0;
	this.fpgaTemp					= 0;
	this.paTemp						= [0,0]; //band 0/1
	this.bbAgc						= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.bbAgcOut					= [[0,0],[0,0]]; //band 0/1 ul/dl
	this.level						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR]
	this.gain						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR]
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
	this.cnDet						= []; // nb/adj band0/1 ul/dl nfilter [2][2][2][this.CHNR]
	this.isZeros = false;
	this.bbuChargerErrorCode;
	this.bbuDeepDischarge;
	this.voltageMonitoring			= [ //8 voltage values
		{'meas': 0.0, 'value': 5.00},
		{'meas': 0.0, 'value': 4.30},
		{'meas': 0.0, 'value': 3.30},
		{'meas': 0.0, 'value': 2.30},
		{'meas': 0.0, 'value': 1.80},
		{'meas': 0.0, 'value': 1.20},
		{'meas': 0.0, 'value': 0.92},
		{'meas': 0.0, 'value': 0.85}
	];
	this.hwFailAlarms = [//6 boolean/alarm: I2C EEPROM Error, High Stability Freq Reference Unlock, LMK Main Unlock, AFE JESD Alarm, FPGA Power Good Alarm, FPGA SPI FAIL
		{'alarm': false, 'mask': 0x02, 'name': "I2C/EEPROM Error"},
		{'alarm': false, 'mask': 0x20, 'name': "High Stability Freq Reference Unlock"},
		{'alarm': false, 'mask': 0x04, 'name': "PLL Unlock"},
		{'alarm': false, 'mask': 0x08, 'name': "AFE JESD Error"},
		{'alarm': false, 'mask': 0x10, 'name': "FPGA Power Error"},
		{'alarm': false, 'mask': 0x40, 'name': "FPGA SPI Error"}

	]; 
	this.dlPaFailAlarms = [//2 band x 4 boolean/alarm: Commm Error, PA Status Error, PA Temperature, PA Overload
		{'alarm': [false,false], 'mask': 0x1, 'name': "Comm Error"},
		{'alarm': [false,false], 'mask': 0x2, 'name': "PA Status Error"},
		{'alarm': [false,false], 'mask': 0x4, 'name': "PA High Temperature"},
		{'alarm': [false,false], 'mask': 0x8, 'name': "PA Overload"}
	]; 

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
			for (var ch=0;ch<this.CHNR;ch++){
				this.oscDetectCH[nbadj][band].push(false);	
				this.cnDet[nbadj][band].push(false);
			}
			for (var uldl=0;uldl<2;uldl++){
				this.signalDet[nbadj][band].push([]);	
				this.level[nbadj][band].push([]);
				this.gain[nbadj][band].push([]);
				for (var ch=0;ch<this.CHNR;ch++){
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
	for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
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
		if (s.length<8){
			return -2; //blocked
		}
		if ( this.checkIsZeros(s) ) {
			this.isZeros = true;
			return;
		}
		this.isZeros = false;
		if (s.length<1892) return -1;
		var res,res2;
		var ind = 0;
		this.frm = s;
		//GLOBAL
		res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
		this.ulBandPAIndependent = (res & 0x4)!=0;
		this.chBandEnabled[0] = (res & 0x10)!=0;
		this.adjBandEnabled[0] = (res & 0x20)!=0;
		this.chBandEnabled[1] = (res & 0x40)!=0;
		this.adjBandEnabled[1] = (res & 0x80)!=0;
		this.boardTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		for (var band=0;band<2;band++){
			this.paTemp[band] = (parseInt(s.substring(ind,ind+=2),16));
			if (this.paTemp[band] > 127) this.paTemp[band] -= 256;
		}
		//BAND
		for (var band=0;band<2;band++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.isolMeasRunning[band] = (res & 0x40)!=0;
			if (band == 0) {
				this.extremeTempActionOn = (res & 0x80) != 0;
			} else {
				this.bbuDeepDischarge = (res & 0x80) != 0;
			}
			this.configGain[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.configGain[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			for (var uldl=0;uldl<2;uldl++){
				res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
				for (var ch=0;ch<32;ch++){//32 first channels
					this.signalDet[0][band][uldl][ch] = (res & (1<<ch))!=0;
				}
			}
			this.maxAllowGain[band] = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			res = parseInt(s.substring(ind,ind+8), 16); ind+=8;
			for (var ch=0;ch<32;ch++){//32 first channels
				this.oscDetectCH[0][band][ch] = (res & (1<<ch))!=0; //nb
			}
			if (band==0){
				this.retryTime = parseInt(s.substring(ind,ind+=4), 16);
			}else{
				this.afeTemp = parseInt(s.substring(ind,ind+=4), 16);
			}
			
			this.bbAgc[band][0] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //ul
			this.bbAgc[band][1] = parseInt(s.substring(ind,ind+2), 16); ind+=2; //dl
			for (var uldl=0;uldl<2;uldl++){
				for (var ch=0;ch<32;ch++){//32 first channels
					this.level[0][band][uldl][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
					this.gain[0][band][uldl][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
				}
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				if ( band == 0 && uldl == 0 ) {
					this.blocked = (res & 0x1)!=0; 
					for (var k=0;k<this.hwFailAlarms.length;k++){
						this.hwFailAlarms[k].alarm = (res & this.hwFailAlarms[k].mask)!=0;
					}	
				}
				if (uldl==1){ //dl pa fail alarms
					for (var k=0;k<this.dlPaFailAlarms.length;k++){
						this.dlPaFailAlarms[k].alarm[band] = (res & this.dlPaFailAlarms[k].mask)!=0;
					}
				}
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
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		res2 = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
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
		// alert("ann.="+this.bbuAlarm[12]+","+this.bbuAlarm[13]+","+this.bbuAlarm[14]+","+this.bbuAlarm[15])
		res = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.bbuChargerErrorCode = res;
		for (var k=0;k<this.NR_OF_RELAYS_MAX;k++){
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
			for (var ch=0;ch<32;ch++){//32 first channels
				this.cnDet[0][band][ch] = (res & (1<<ch))!=0; //nb
			}
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
		// automatic ul gain running
		res = parseInt(s.substring(ind,ind+2),16); ind+=2;
		this.automatic_ul_gain_running = (res & 0x01)!=0;
		//16 extra channel filters info
		//signal detect
		for (var uldl=0;uldl<2;uldl++){
			for (var band=0;band<2;band++){
				res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
				for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
					this.signalDet[0][band][uldl][ch] = (res & (1<<(ch-32)))!=0;
				}
			}
		}
		//osc detect
		for (var band=0;band<2;band++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
				this.oscDetectCH[0][band][ch] = (res & (1<<(ch-32)))!=0;
			}
		}
		//cn detect
		for (var band=0;band<2;band++){
			res = parseInt(s.substring(ind,ind+2), 16); ind+=2;
			for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
				this.cnDet[0][band][ch] = (res & (1<<(ch-32)))!=0;
			}
		}
		//level and gain
		for (var uldl=0;uldl<2;uldl++){
			for (var band=0;band<2;band++){
				for (var ch=32;ch<this.CHNR;ch++){//8 final CH of each array of length config.CHNR
					this.level[0][band][uldl][ch] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
					this.gain[0][band][uldl][ch] = to_ufloat(parseInt(s.substring(ind,ind+4),16)); ind+=4; //nb
				}
			}
		}
		//voltage monitoring
		for (var k=0;k<8;k++){
			this.voltageMonitoring[k].meas = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		}
		//FPGA temperature
		this.fpgaTemp = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
	}
}