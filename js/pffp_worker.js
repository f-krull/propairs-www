// propairs flat-file parser

importScripts('pako.min.js');

class PffParser {
  buff = "";
  table = [];
  onClose;
  onRowParsed;
  filter;
  inputCount = 0;
  constructor(cbClose, onRowParsed, cbFilter) {
    this.onClose = cbClose;
    this.onRowParsed = onRowParsed;
    this.rowFilter = cbFilter;
  }

  static fields = {
    // SEEDIDX: 1,
    SEEDPB: 2,
    // SEEDCB1: 3,
    // SEEDCB2: 4,
    SEEDPU: 5,
    // SEEDCU1: 6,
    // STATUS: 7,
    CBI1: 8,
    CBI2: 9,
    // BNUMICHAINS: 10,
    // BNUMGAPS: 11,
    // BNUMI1GAPS: 12,
    // BNUMI2GAPS: 13,
    BNUMI1CA: 14,
    BNUMI2CA: 15,
    // BNUMNONICHAINS: 16,
    // BNUMCOF: 17,
    BNUMS2BONDS: 18,
    // CB1: 19,
    // CB2X: 20,
    // UNUMCHAINS: 21,
    // UNUMGAPS: 22,
    // UNUMXCHAINS: 23,
    UALIGNEDIRATIO: 24,
    // UNUMMATCHEDCOF: 25,
    // UNUMUNMATCHEDCOF: 26,
    UIRMSD: 27,
    // UNUMCLASHES: 28,
    CU1: 29,
    // ROT1: 30,
    // ROT2: 31,
    // ROT3: 32,
    // ROT4: 33,
    // ROT5: 34,
    // ROT6: 35,
    // ROT7: 36,
    // ROT8: 37,
    // ROT9: 38,
    // ROT10: 39,
    // ROT11: 41,
    // ROT12: 42,
    COF: 42,
    CLUSID: 43,
    // CLUSMEMID: 44,
    // CLUSMEDDIST: 45,
  };

  _parseLine(s) {
    const t = s.split(" ");
    let r = {}
    Object.keys(PffParser.fields).forEach(k => {
      r[k] = t[PffParser.fields[k]-1];
    });
    return r;
  }
  
  push(s) {
    this.buff += s;
    while (true) {
      const i = this.buff.indexOf('\n');
      if (i < 0) {
        break;
      }
      const row = this._parseLine(
        this.buff
          .substring(0,i)
          .replace(/\ +/gi," ")
      );
      this.buff = this.buff.substring(i+1);
      // remove header
      if (this.inputCount && this.rowFilter(row)) {
        this.table.push(row);
      }
      this.inputCount++;
      this.onRowParsed(this.inputCount);
    }
  }

  close() {
    // in case last line doesn't end with "\n"
    if (this.buff != "") {
      this.table.push(this._parseLine(this.buff));
    }
    this.onClose(this.table);
  }
}

function getRowFilter(filterDef) {
  return function(row) {
    let r = true;
    Object.keys(filterDef).forEach(k => {
      // for the pdb codes, we only match the prefix
      r &= (k == "SEEDPB" || k == "SEEDPU") 
        ? row[k].startsWith(filterDef[k])
        : row[k] == filterDef[k];
    });
    return r;
  }
}

var pffp;
const inflate = new pako.Inflate({ level: 3, to: "string"});

onmessage = function(msg) {
  if (msg.data.type == "init") {
    pffp = new PffParser(
      (t) => postMessage({ type: 'done', value: t}), 
      (n) => postMessage({ type: 'progress', value: n }),
      getRowFilter(msg.data.value.filter),
    );
    
    inflate.onData = (d) => pffp.push(d);
    inflate.onEnd = () => pffp.close();
  } else if (msg.data.type == "data") {
    inflate.push(msg.data.value.gz, false);
  }
};

