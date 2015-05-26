$(document).ready(function() {

//------------------------------------------------------------------------------

// helper functions
function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}
function getModelStr(p) {
   var res = '';
   if (p.length < 5) {
       return res;
   }
   if (p.charAt(4) == '0') {
      /* nothing */
   } else if (p.charAt(4) == 'a') {
       res += '(Model 1)';
   } else if (p == '-') {
   } else {
      res = '(biol.unit ' + parseInt(p.charAt(4)) + ')';
   }
   return res;
}
function getPdbName4(p) {
   var res = '';
   if (p.length < 4) {
       return res;
   }
   return p.substr(0, 4);
}
function convertIntSim(p) {
   p = parseFloat(p);
   if (isNaN(p)) {
      return "-";
   }
   return (Math.round(p * 100)).toString() + ' %';
}
function convertRmsd(p) {
   p = parseFloat(p);
   if (isNaN(p)) {
      return "-";
   }
   return p.toString() + ' &Aring;';
}
function countDirectSubelements(obj) {
    var count = 0;
    for(var i in obj)
        if(obj.hasOwnProperty(i))
            count++;

    return count;
}


//------------------------------------------------------------------------------

function DbConfig() {
   this.dataSetPrefix = 'data';
   this.dataSetPath   = './data/';
   this.dataSetListPath = './data/sets.txt';
   this.dataSetFile   = 'merged.json';
   this.dataPdbPath   = './pdb/';
};


//------------------------------------------------------------------------------

function DbSetLink() {
   this._tmpl = $('#dbSetTableLinkTemplate').html().trim();
   this._urlPdb = 'http://www.rcsb.org/pdb/explore/explore.do?structureId=';
   this._urlHet = 'http://www.rcsb.org/pdb/ligand/ligandsummary.do?hetId=';
}
DbSetLink.prototype.getPdb = function(pdbName) {
   var tmpData = '-';
   if (pdbName.length < 4) {
       return tmpData;
   }
   tmpData = this._tmpl
      .replace(/{{text}}/, pdbName.substr(0, 4))
      .replace(/{{link}}/, this._urlPdb + pdbName.substr(0, 4));
   if (pdbName.length < 12) {
      tmpData += " " +pdbName.substr(5);
   } else {
      tmpData += " " + pdbName.substr(5, 4) + "...";
   }
   return tmpData;
};
DbSetLink.prototype._getHet = function(het) {
   return this._tmpl
      .replace(/{{text}}/, het)
      .replace(/{{link}}/, this._urlHet + het);
};
DbSetLink.prototype.getHet = function(het) {
   var tmpData = '';
   var maxNum = 3;
   var _this = this;
   for (var i = 0; i < het.length; i++) {
      if (het[i] != "-") {
         tmpData += " " + DbSetLink.prototype._getHet.call(_this, het[i]);
      }
      if (i >= maxNum) {
         tmpData += " ..."
         break;
      }
   }
   if (tmpData == '') {
      tmpData = "-";
   }
   return tmpData;
};


//------------------------------------------------------------------------------

function DbSetSelector() {
   this._sets = [];
   this._setSelection = $('#SetSelection');
   this._init.apply(this, arguments);
}
// which data set is currently selected?
DbSetSelector.prototype.getCurr = function() {
   return this._setSelection.val();
};
DbSetSelector.prototype._init = function(dbConfig) {
   console.log("DbSetSelector init:");
   // get data set names
   var _this = this;
   $.ajax({
      'async' : false,
      'global': false,
      'dataType': "text",
      url: dbConfig.dataSetListPath,
      success: function(data) {
         var sets = data.split(/\r\n|\n/);
         DbSetSelector.prototype._newData.call(_this, sets);
      }
   });
};
DbSetSelector.prototype._newData = function(sets) {
   this._sets = sets;
   var _this = this;
   // append to selection
   $.each(this._sets, function(index, setName) {
      if (setName != "") {
         var shortName = setName.replace(/^data/,'');
         _this._setSelection.append(new Option(shortName, setName));
         console.log('  append ' + shortName);
      }
   });
};


//------------------------------------------------------------------------------

function DbFilter() {
   this._dbControl   =  $('#dbControl');
   this._dbFilter    =  $('#dbControl #Filter');
   this._dbFilterBtn =  $('#dbControl #ShowFilter');
   this.reset.apply(this);
   this._dbFilter.hide();
   this._dbFilter.prop("disabled", false);
}
DbFilter.prototype.reset = function() {
   this._dbControl.find("#IncludeIncompl").prop('checked', false);
   this._dbControl.find("#IncludeNMR").prop('checked', true);
   this._dbControl.find("#Keyword").val("");
   this._dbControl.find("#Cofactors").val("a");
   this._dbControl.find("#RangeTarget").val("1");
   this._dbControl.find("#SimMin").val("");
   this._dbControl.find("#IrmsdMin").val("");
   this._dbControl.find("#IcaMin").val("");
   this._dbControl.find("#SimMax").val("");
   this._dbControl.find("#IrmsdMax").val("");
   this._dbControl.find("#IcaMax").val("");
}
DbFilter.prototype.show = function() {
   this._dbFilterBtn.prop("disabled", true);
   this._dbFilter.slideDown();
}
DbFilter.prototype.hide = function() {
   this._dbFilterBtn.prop("disabled", false);
   this._dbFilter.slideUp();
}
DbFilter.prototype._getMinMax = function(set, key) {
   var vmin = Number.MAX_VALUE;
   var vmax = 0;
   $.each(set, function(rowkey, row) {
      if (isNaN(parseFloat(row[key])) == false) {
         vmin = Math.min(vmin, row[key]);
         vmax = Math.max(vmax, row[key]);
      }
   });
   return [vmin, vmax]
}
DbFilter.prototype._isOkMinMax = function(set, key1, key2, vmin, vmax, both) {
   var ret = {};
   $.each(set, function(rowkey, row) {
      var ok1 = isNaN(row[key1]) == false && row[key1] >= vmin && row[key1] <= vmax;
      var ok2 = isNaN(row[key2]) == false && row[key2] >= vmin && row[key2] <= vmax;
      if (both == true && (ok1 && ok2)) {
         ret[rowkey] = row;
      } else if (both == false && (ok1 || ok2)) {
         ret[rowkey] = row;
      }
   });
   return ret;
}
DbFilter.prototype._isOkMin = function(set, key1, key2, vmin, both) {
   var ret = {};
   $.each(set, function(rowkey, row) {
      var ok1 = isNaN(row[key1]) == false && row[key1] >= vmin;
      var ok2 = isNaN(row[key2]) == false && row[key2] >= vmin;
      if (both == true && (ok1 && ok2)) {
         ret[rowkey] = row;
      } else if (both == false && (ok1 || ok2)) {
         ret[rowkey] = row;
      }
   });
   return ret;
}
DbFilter.prototype._isOkMax = function(set, key1, key2, vmax, both) {
   var ret = {};
   $.each(set, function(rowkey, row) {
      var ok1 = isNaN(row[key1]) == false && (row[key1] <= vmax);
      var ok2 = isNaN(row[key2]) == false && (row[key2] <= vmax);
      if (both == true && (ok1 && ok2)) {
         ret[rowkey] = row;
      } else if (both == false && (ok1 || ok2)) {
         ret[rowkey] = row;
      }
   });
   return ret;
}
DbFilter.prototype._isOk = function(set, key1, key2, vmin, vmax, both) {
   if (isNaN(vmin) == false && isNaN(vmax) == false) {
      return DbFilter.prototype._isOkMinMax(set, key1, key2, vmin, vmax, both);
   } else if (isNaN(vmin) == false) {
      return DbFilter.prototype._isOkMin(set, key1, key2, vmin, both);
   } else if (isNaN(vmax) == false) {
      return DbFilter.prototype._isOkMax(set, key1, key2, vmax, both);
   }
   return set;
}
DbFilter.prototype._filterSim = function(set, both) {
   var vmin = parseFloat(this._dbControl.find("#SimMin").val()) / 100;
   var vmax = parseFloat(this._dbControl.find("#SimMax").val()) / 100;
   return DbFilter.prototype._isOk(set, "u1Sim", "u2Sim", vmin, vmax, both);
}
DbFilter.prototype._filterIrmsd = function(set, both) {
   var vmin = parseFloat(this._dbControl.find("#IrmsdMin").val());
   var vmax = parseFloat(this._dbControl.find("#IrmsdMax").val());
   return DbFilter.prototype._isOk(set, "u1Rmsd", "u2Rmsd", vmin, vmax, both);
}
DbFilter.prototype._filterIca = function(set, both) {
   var vmin = parseFloat(this._dbControl.find("#IcaMin").val());
   var vmax = parseFloat(this._dbControl.find("#IcaMax").val());
   return DbFilter.prototype._isOk(set, "bNumCa", "bNumCa", vmin, vmax, both);
}
DbFilter.prototype._filterPaired = function(set) {
   var po = this._dbControl.find("#IncludeIncompl").prop('checked');
   if (po == true) {
      return set;
   }
   var ret = {};
   $.each(set, function(rowkey, row) {
      if (isNaN(parseFloat(row["u2Rmsd"])) == false) {
         ret[rowkey] = row;
      }
   });
   return ret;
}
DbFilter.prototype._filterNmr = function(set) {
   var po = this._dbControl.find("#IncludeNMR").prop('checked');
   if (po == true) {
      return set;
   }
   var ret = {};
   $.each(set, function(rowkey, row) {
      if (row["u1Name"].charAt(4) != "a" && row["u2Name"].charAt(4) != "a") {
         ret[rowkey] = row;
      }
   });
   return ret;
}
DbFilter.prototype._filterCof = function(set) {
   var sel = this._dbControl.find("#Cofactors").val();
   if (sel == "r") { //required
      var ret = {};
      $.each(set, function(rowkey, row) {
         if (row["bCof"].length > 0){
            ret[rowkey] = row;
         }
      });
      return ret;
   } else if (sel == "f") { //forbidden
      var ret = {};
      $.each(set, function(rowkey, row) {
         if (row["bCof"].length <= 0){
            ret[rowkey] = row;
         }
      });
      return ret;
   }
   return set;
}
DbFilter.prototype._filterKeyword = function(set) {
   // assuming bType is upper case
   var kw = this._dbControl.find("#Keyword").val().toUpperCase();
   if (kw == "") {
      return set;
   }
   console.log(kw);
   var ret = {};
   $.each(set, function(rowkey, row) {
      if (row["bType"].indexOf(kw) != -1){
         ret[rowkey] = row;
      }
   });
   return ret;
}
DbFilter.prototype._analyzeSim = function(set) {
   var vu1 = DbFilter.prototype._getMinMax.call(this, set, "u1Sim");
   var vu2 = DbFilter.prototype._getMinMax.call(this, set, "u2Sim");
   var vmin = Math.min(vu1[0], vu2[0]);
   var vmax = Math.min(vu1[1], vu2[1]);
   this._dbControl.find("#SimRange").html("" + Math.round(vmin * 100) + "-" + Math.round(vmax * 100) + " %");
}
DbFilter.prototype._analyzeIrmsd = function(set) {
   var vu1 = DbFilter.prototype._getMinMax.call(this, set, "u1Rmsd");
   var vu2 = DbFilter.prototype._getMinMax.call(this, set, "u2Rmsd");
   var vmin = Math.min(vu1[0], vu2[0]);
   var vmax = Math.min(vu1[1], vu2[1]);
   this._dbControl.find("#IrmsdRange").html("" + vmin + "-" + vmax + " &Aring;");
}
DbFilter.prototype._analyzeIca = function(set) {
   var vu1 = DbFilter.prototype._getMinMax.call(this, set, "bNumCa");
   var vmin = vu1[0];
   var vmax = vu1[1];
   this._dbControl.find("#IcaRange").html("" + vmin + "-" + vmax);
}
DbFilter.prototype.analyze = function(set) {
   DbFilter.prototype._analyzeSim.call(this, set);
   DbFilter.prototype._analyzeIca.call(this, set);
   DbFilter.prototype._analyzeIrmsd.call(this, set);
}
DbFilter.prototype.apply = function(set) {
   var fset = set;

   fset = DbFilter.prototype._filterPaired.call(this, fset);
   fset = DbFilter.prototype._filterCof.call(this, fset);
   fset = DbFilter.prototype._filterNmr.call(this, fset);
   fset = DbFilter.prototype._filterKeyword.call(this, fset);
   var both = this._dbControl.find("#RangeTarget").val() == "2";
   fset = DbFilter.prototype._filterSim.call(this, fset, both);
   fset = DbFilter.prototype._filterIca.call(this, fset, both);
   fset = DbFilter.prototype._filterIrmsd.call(this, fset, both);
   this._dbControl.find("#Stats").html(countDirectSubelements(fset) + "/" + countDirectSubelements(set));
   
   var keys = [];
   for (k in fset) {
     keys.push(k);
   }
   keys.sort();
   rset = {};
   for (i = 0; i < keys.length; i++){
       rset[keys[i]] = fset[keys[i]];
   }
   return rset;
}


//------------------------------------------------------------------------------

function DbSet(dbConfig) {
   this._bodyTmpl = $('#dbSetTableBodyTemplate').html().trim();
   this._dstHead = $('#dbSetTable table thead');
   this._dstBody = $('#dbSetTable table tbody');
   this._dbSetLink = new DbSetLink();
   this._dbConfig = dbConfig;
   this._dbSetIds = [];
   this._currBIdx = 0;
   this._prevBIdx = 0;
   this._nextBIdx = 0;
   this._dataOrg = [];
};
// read data set and display as list
DbSet.prototype.updateSet = function(setName, dbFilter) {
   console.log("DbSet updateSet:");
   var _this = this;
   var c = this._dbConfig;
   console.log('  ' + c.dataSetPath + "/" + setName + '/' + c.dataSetFile);
   $.ajax({
   'async': false,
   'global': false,
   'url': c.dataSetPath + "/" + setName + '/' + c.dataSetFile,
   'dataType': "json",
   'success': function (data) {
      console.log(data);
      _this._dataOrg = data;
      DbSet.prototype.update.call(_this, setName, dbFilter);
      dbFilter.analyze(_this._dataOrg);
   }
  });
}
DbSet.prototype.update = function (setName, dbFilter) {
   var _this = this;
   // apply filter
   var data = dbFilter.apply(this._dataOrg);
   this._dbSetIds = [];
   $.each(data, function(rowkey, row) {
      _this._dbSetIds.push(rowkey);
   });
   // uncheck master checkbox
   this._dstHead.find("input").prop('checked', false);

   var tData;
   tData = '';
   $.each(data, function(rowkey, row) {
      tData +=
         dbSet._bodyTmpl
            .replace(/{{setCurr}}/g, setName)
            .replace(/{{setPath}}/g, _this._dbConfig.dataSetPath)
            .replace(/{{bIndex}}/g,  rowkey)
            .replace(/{{bName}}/g,   dbSet._dbSetLink.getPdb(row['bName']))
            .replace(/{{bType}}/g,   row['bType'].toLowerCase())
            .replace(/{{bNumCa}}/g,  row['bNumCa'])
            .replace(/{{bCof}}/g,    dbSet._dbSetLink.getHet(row['bCof']))
            .replace(/{{u1Name}}/g,  dbSet._dbSetLink.getPdb(row['u1Name']))
            .replace(/{{u1Sim}}/g,   convertIntSim(row['u1Sim']))
            .replace(/{{u1Cof}}/g,   dbSet._dbSetLink.getHet(row['u1Cof']))
            .replace(/{{u1Rmsd}}/g,  row['u1Rmsd'])
            .replace(/{{u2Name}}/g,  dbSet._dbSetLink.getPdb(row['u2Name']))
            .replace(/{{u2Sim}}/g,   convertIntSim(row['u2Sim']))
            .replace(/{{u2Cof}}/g,   dbSet._dbSetLink.getHet(row['u2Cof']))
            .replace(/{{u2Rmsd}}/g,  row['u2Rmsd'])
           ;
   });
   this._dstBody.html(tData);
}
DbSet.prototype._getNext = function(rowkey) {
   var sets = this._dbSetIds;
   if (sets.length > 0 && sets[sets.length-1] == rowkey) {
      return sets[sets.length-1];
   }
   for (var i = 1; i < sets.length; i++) {
      if (sets[i-1] == rowkey) {
         return sets[i];
      }
   }
   assert(false, "rowkey not found");
   return rowkey;
}
DbSet.prototype._getPrev = function(rowkey) {
   var sets = this._dbSetIds;
   if (sets.length > 0 && sets[0] == rowkey) {
      return sets[0];
   }
   for (var i = 1; i < sets.length; i++) {
      if (sets[i] == rowkey) {
         return sets[i-1];
      }
   }
   assert(false, "rowkey not found");
   return rowkey;
}
DbSet.prototype.setCurr = function(bIndex) {
   console.log("DbSet setCurr:");
   // unmark last row
   var lastRow = this._getRow(this._currBIdx);
   if (lastRow != "") {
      lastRow.removeClass("marked");
   }
   if (bIndex < 0) {
      return;
   }
   // mark new row
   var newRow = this._getRow(bIndex);
   newRow.addClass("marked");
   this._currBIdx = bIndex;
   this._prevBIdx = DbSet.prototype._getPrev.call(this, bIndex);
   this._nextBIdx = DbSet.prototype._getNext.call(this, bIndex);
   console.log("  curr:" + bIndex + " prev:" + this._prevBIdx + " next:" + this._nextBIdx);
}
DbSet.prototype.getCurr = function() {
   return this._currBIdx;
}
DbSet.prototype.getNext = function() {
   return this._nextBIdx;
}
DbSet.prototype.getPrev = function() {
   return this._prevBIdx;
}
DbSet.prototype._getRow = function(bIndex) {
   return this._dstBody.find("[data-id=\"" + bIndex + "\"]");
}
DbSet.prototype.select = function(bIndex, val) {
   var row = DbSet.prototype._getRow.call(this, bIndex);
   var cb = row.find(":checkbox");
   cb.prop('checked', val);
}
DbSet.prototype.selectAll = function(val) {
   this._dstBody.find(":checkbox").each(function(idx, cb) {
       $(cb).prop('checked', val);
   });
}
DbSet.prototype.isSelected = function(bIndex) {
   var row = DbSet.prototype._getRow.call(this, bIndex);
   var cb = row.find(":checkbox");
   //console.log("DbSet isSel: " + bIndex + " -> " + cb.prop('checked'));
   return cb.prop('checked');
}
DbSet.prototype.getFiles = function(conf, setName, b, u) {
   console.log('DbSet getFiles:');
   var files = new Array();
   for (var i = 0; i < this._dbSetIds.length; i++) {
      var bIndex = this._dbSetIds[i];
      if (DbSet.prototype.isSelected.call(this, bIndex) == true) {
         var bName = this._dataOrg[bIndex]['bName']
            .replace(" ", "_")
            .replace(":", "-")
            ;
         console.log('  adding ' + bIndex + " " + bName);
         var fnPrefix = 'ProPairsSet/' + bName + "_" + bIndex;
         var urlPrefix = conf.dataSetPath + "/" + setName + '/' + "/" + conf.dataPdbPath + "/" + bIndex;
         if (b == true) {
            files.push({ filename: fnPrefix + '_b1.pdb' , url: urlPrefix + '_b1.pdb'});
            files.push({ filename: fnPrefix + '_b2.pdb' , url: urlPrefix + '_b2.pdb'});
         } 
         if (u == true) {
            files.push({ filename: fnPrefix + '_u1.pdb' , url: urlPrefix + '_u1.pdb'});
            files.push({ filename: fnPrefix + '_u2.pdb' , url: urlPrefix + '_u2.pdb'});
         }
      }
   }
   return files;
}


//------------------------------------------------------------------------------
function DbDetailImgCtrl() {
   this._dbDetailView = $('#dbDetailView');
   this._cB1 = true;
   this._cB2 = true;
   this._cU1 = true;
   this._cU2 = true;         
}
DbDetailImgCtrl.prototype._init = function() {

}
DbDetailImgCtrl.prototype.read = function(cplx, f) {
   var c = this._dbDetailView.find("[data-cplx=" + cplx + "] input").prop("checked");
   this._dbDetailView.find("[data-cplx=" + cplx + "] input").prop("checked", f ? !c : c);
   this._cB1 = this._dbDetailView.find("[data-cplx=B1] input").prop("checked");
   this._cB2 = this._dbDetailView.find("[data-cplx=B2] input").prop("checked");
   this._cU1 = this._dbDetailView.find("[data-cplx=U1] input").prop("checked");
   this._cU2 = this._dbDetailView.find("[data-cplx=U2] input").prop("checked");
}
DbDetailImgCtrl.prototype.update = function() {
   this._dbDetailView.find("[data-cplx=B1] input").prop("checked", this._cB1);
   this._dbDetailView.find("[data-cplx=B2] input").prop("checked", this._cB2);
   this._dbDetailView.find("[data-cplx=U1] input").prop("checked", this._cU1);
   this._dbDetailView.find("[data-cplx=U2] input").prop("checked", this._cU2);
}
DbDetailImgCtrl.prototype.get = function() {
   var ret = "";
   ret += this._cB1 ? "1" : "0";
   ret += this._cB2 ? "1" : "0";
   ret += this._cU1 ? "1" : "0";
   ret += this._cU2 ? "1" : "0";
   return ret;
}

function DbDetail() {
   this._currIdx = -1;
   this._dbDetail = $('#dbDetail');
   this._dbDetailDataAln = $('#dbDetailData');
   this._dbDetailTmpl = $('#dbDetailDataAlnTemplate').html().trim();
   this._dbDetailPdbTmpl = $('#dbDetailDataAlnPdbTemplate').html().trim();
   this._dbDetailCof1Tmpl = $('#dbDetailDataAlnCof1Template').html().trim();
   this._dbDetailCof1nTmpl = $('#dbDetailDataAlnCof1nTemplate').html().trim();
   this._dbDetailCof2Tmpl = $('#dbDetailDataAlnCof2Template').html().trim();
   this._dbDetailCof2nTmpl = $('#dbDetailDataAlnCof2nTemplate').html().trim();
   this._dbDetailView = $('#dbDetailView');
   this._dbDetailViewTmpl = $('#dbDetailViewTemplate').html().trim();
   this._dbDetailAlignmentTemplate = $('#dbDetailAlignmentTemplate').html().trim();
   this._dbNavNext = $('#dbDetailNav #next');
   this._dbNavPrev = $('#dbDetailNav #prev');
   this._dbNavSel = $('#dbDetailNav :checkbox');
   this._diagClus = $("#diagClus");
   this._dbClustTmpl = $('#dbDetailDataClusTemplate').html().trim();;
   this._imgCtrl = new DbDetailImgCtrl();
   this._currClus = '';
   this._init.apply(this, arguments);
}
DbDetail.prototype._init = function() {
   this._dbDetail.hide();
}
DbDetail.prototype.reset = function() {
   DbDetail.prototype.update.call(this, null, null, null);
   this._dbDetail.slideUp();
}
DbDetail.prototype._parseIntSim = function(intSim) {
   if (intSim == "-") {
      return "-"
   }
   var res = Math.round(parseFloat(intSim) * 100);
   return res.toString() + '%';
}
DbDetail.prototype.toggleAln = function(id) {
   var alnctn = this._dbDetailDataAln.find("[data-id=\"" + id + "\"]").find(".alnData");
   alnctn.slideToggle("slow");
}
DbDetail.prototype._getDetailPdb = function(pdb5) {
   if (pdb5.length != 5) {
      return pdb5;
   }
   return this._dbDetailPdbTmpl
      .replace(/{{pdb}}/g, getPdbName4(pdb5))
      .replace(/{{biounit}}/g, getModelStr(pdb5))
   ;
}
DbDetail.prototype._updateAln = function(aln) {
   var _this = this;
   if (aln == null) {
      return null;
   }
   var tData = "";
   $.each(aln, function(rowkey, row) {
     tData += _this._dbDetailAlignmentTemplate
      .replace(/{{int}}/g, row["int"])
      .replace(/{{pdbb}}/g, row["pdbb"])
      .replace(/{{chainb}}/g, row["chainb"])
      .replace(/{{alb}}/g, row["alb"])
      .replace(/{{pdbu}}/g, row["pdbu"])
      .replace(/{{chainu}}/g, row["chainu"])
      .replace(/{{alu}}/g, row["alu"])
      .replace(/{{aln}}/g, row["aln"])
      .replace(/{{nalint}}/g, row["nalint"])
      .replace(/{{nint}}/g, row["nint"])
      ;
   });
   return tData;
}
DbDetail.prototype._updateClus = function(c) {
   numSimilar = c.split("\n").length -1 -1 -1; // end, header and id
   if (numSimilar <= 0) {
      return "";
   } 
   this._currClus = c.replace('\n', '<br>');
   var tmp = this._dbClustTmpl;
   return tmp.replace(/{{numsim}}/g, numSimilar.toString() + " similar Interface" + (numSimilar > 1 ? "s" : ""));
}
DbDetail.prototype.showClus = function() {
   this._diagClus.html("<p>" + this._currClus + "</p>");
   this._diagClus.dialog({modal: true, width: 700});
}
DbDetail.prototype._getCofRow = function(cr1, crn, bcofa, ucofa) {
   var tData = '';
   var hasU2 = (ucofa.length > 0 && ucofa[0] != "-")
   for (var i = 0; i < bcofa.length; i++) {
      var tmp = (i == 0) ? cr1 : crn;
      var bsplit = bcofa[i].split(/ (.+)?/)
      var bcof = bsplit[0]
      var bloc = bsplit[1]
      var usplit = hasU2 ? ucofa[i].split(/ (.+)?/) : ["",""];
      var ucof = usplit[0]
      var uloc = usplit[1]
      tData += tmp
         .replace(/{{bcof}}/g,  bcof)
         .replace(/{{bloc}}/g,  bloc)
         .replace(/{{arrow}}/g, hasU2 ? "&rarr;" : "")
         .replace(/{{ucof}}/g,  ucof)
         .replace(/{{uloc}}/g,  uloc)
      ;
   }
   return tData;
}
DbDetail.prototype.readImgCtrl = function(cplx, f) {
   this._imgCtrl.read(cplx, f);
}
DbDetail.prototype.update = function(dbSet, conf, setName) {
   var _this = this;
   console.log('DbDetail update:');
   var doToggle = false;
   doToggle = doToggle || ( (this._currIdx == -1) &&  !(dbSet == null));
   doToggle = doToggle || (!(this._currIdx == -1) &&   (dbSet == null));
   this._currIdx = dbSet === null ? -1 : dbSet.getCurr();
   if (this._currIdx == -1) {
      if (doToggle) {
         this._dbDetail.slideToggle();
      }
      return;
   }
   // get detail data
   console.log('  ' + conf.dataSetPath + "/" + setName + "/info/" + this._currIdx + "/" + this._currIdx + ".json");
   var json = null;
   $.ajax({
      'async': false,
      'global': false,
      'url': conf.dataSetPath + "/" + setName + "/info/" + this._currIdx + "/" + this._currIdx + ".json",
      'dataType': "json",
      'success': function (data) {
          json = data;
      }
  });
  console.log(json);
  var tData = '';
  tData = this._dbDetailTmpl
      .replace(/{{u1name}}/g,  DbDetail.prototype._getDetailPdb.call(this, json['u1p']))
      .replace(/{{u1type}}/g,  json['u1type'].toLowerCase())
      .replace(/{{b1c}}/g,     json['b1c'])
      .replace(/{{u1c}}/g,     json['u1c'])
      .replace(/{{b1ci}}/g,    json['b1ci'])
      .replace(/{{u1ci}}/g,    json['u1ci'])
      .replace(/{{b1gaps}}/g,  json['b1gaps'])
      .replace(/{{u1gaps}}/g,  json['u1gaps'])
      .replace(/{{b1ca}}/g,    json['b1ca'])
      .replace(/{{u1irmsd}}/g, convertRmsd(json['u1irmsd']))
      .replace(/{{u1sim}}/g,   DbDetail.prototype._parseIntSim(json['u1sim']))

      .replace(/{{bname}}/g,   DbDetail.prototype._getDetailPdb.call(this, json['bp']))
      .replace(/{{btype}}/g,   json['btype'].toLowerCase())
      .replace(/{{bclus}}/g,   DbDetail.prototype._updateClus.call(this, json['cluster']))

      .replace(/{{u2name}}/g,  DbDetail.prototype._getDetailPdb.call(this, json['u2p']))
      .replace(/{{u2type}}/g,  json['u2type'].toLowerCase())
      .replace(/{{b2c}}/g,     json['b2c'])
      .replace(/{{u2c}}/g,     json['u2c'])
      .replace(/{{b2ci}}/g,    json['b2ci'])
      .replace(/{{u2ci}}/g,    json['u2ci'])
      .replace(/{{b2gaps}}/g,  json['b2gaps'])
      .replace(/{{u2gaps}}/g,  json['u2gaps'])
      .replace(/{{b2ca}}/g,    json['b2ca'])
      .replace(/{{u2irmsd}}/g, convertRmsd(json['u2irmsd']))
      .replace(/{{u2sim}}/g,   DbDetail.prototype._parseIntSim(json['u2sim']))
      ;
   this._dbDetailDataAln.html(tData);

   // add cofactor rows
   var cr1 = this._dbDetailCof1Tmpl;
   var crn = this._dbDetailCof1nTmpl;
   var dst = this._dbDetailDataAln.find("tr.x1.cof");
   dst.after(DbDetail.prototype._getCofRow(cr1, crn, json['b1cof'], json['u1cof']));
   var cr1 = this._dbDetailCof2Tmpl;
   var crn = this._dbDetailCof2nTmpl;
   var dst = this._dbDetailDataAln.find("tr.x2.cof");
   dst.after(DbDetail.prototype._getCofRow(cr1, crn, json['b2cof'], json['u2cof']));

   // add alignments
   tData = DbDetail.prototype._updateAln.call(this, json['aln1']);
   var alnctn = this._dbDetailDataAln.find("[data-id=\"aln1\"]").find(".alnData");
   alnctn.html(tData);
   alnctn.hide();
   tData = DbDetail.prototype._updateAln.call(this, json['aln2']);
   var alnctn = this._dbDetailDataAln.find("[data-id=\"aln2\"]").find(".alnData");
   alnctn.html(tData);
   alnctn.hide();
   this._dbDetailDataAln.find("[data-id=\"aln2\"]").find("button").prop("disabled", tData == null);

   // show new images
   var tData = '';
   imgUrl = "./{{setPath}}/{{setCurr}}/info/{{bIndex}}/img_p{{cplx}}";
   imgUrl = imgUrl.replace(/{{setCurr}}/g, setName)
                  .replace(/{{setPath}}/g, conf.dataSetPath)
                  .replace(/{{bIndex}}/g,  this._currIdx)
                  .replace(/{{cplx}}/g,  this._imgCtrl.get())
                  ;
   tData = this._dbDetailViewTmpl
      .replace(/{{imgUrl}}/g, imgUrl)
      ;
   this._dbDetailView.html(tData);
   this._imgCtrl.update();
   $.reel.scan();
   
   if (doToggle) {
      this._dbDetail.slideToggle();
   }
   // disable prev/next?
   this._dbNavNext.prop("disabled", dbSet.getNext() == this._currIdx);
   this._dbNavPrev.prop("disabled", dbSet.getPrev() == this._currIdx);

   DbDetail.prototype.select.call(this, this._currIdx, dbSet.isSelected(this._currIdx));
   // precache images
   DbDetail.prototype.precache.call(this, dbSet.getNext(), conf, setName);
   DbDetail.prototype.precache.call(this, dbSet.getPrev(), conf, setName);
   DbDetail.prototype.precacheCurr.call(this, this._currIdx, conf, setName);
}
DbDetail.prototype.updateView = function(conf, setName) {
   imgUrl = "./{{setPath}}/{{setCurr}}/info/{{bIndex}}/img_p{{cplx}}";
   imgUrl = imgUrl.replace(/{{setCurr}}/g, setName)
                  .replace(/{{setPath}}/g, conf.dataSetPath)
                  .replace(/{{bIndex}}/g,  this._currIdx)
                  .replace(/{{cplx}}/g,  this._imgCtrl.get())
                  ;
   this._dbDetailView.find("#reelimg").reel("images", imgUrl + "_##.jpg");
   this._imgCtrl.update();
}

DbDetail.prototype.getCurrIdx = function() {
   return this._currIdx;
}
DbDetail.prototype.precache = function(bIndex, conf, setName) {
    var imgs = new Array();
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p" + this._imgCtrl.get() + '_01.jpg');
    $(imgs).each(function(){
        $('<img/>')[0].src = this;
    });
}
DbDetail.prototype.precacheCurr = function(bIndex, conf, setName) {
    var imgs = new Array();
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0000_01.jpg");
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0001_01.jpg");
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0010_01.jpg");
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0011_01.jpg");        
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0100_01.jpg");
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0101_01.jpg");
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0110_01.jpg");                    
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p0111_01.jpg");                    
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1000_01.jpg");                    
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1001_01.jpg");                    
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1010_01.jpg");                    
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1011_01.jpg");                                        
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1100_01.jpg");                                        
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1101_01.jpg");                                        
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1110_01.jpg");                                        
    imgs.push(conf.dataSetPath + "/" + setName + "/info/" + bIndex +'/img_' + "p1111_01.jpg");                                             
    $(imgs).each(function(){
        $('<img/>')[0].src = this;
    });
}
DbDetail.prototype.select = function(bIndex, val) {
   // ensure we are showing the selected bIndex
   if (bIndex == this._currIdx) {
      this._dbNavSel.prop('checked', val);
   }
}


//------------------------------------------------------------------------------

function DownloadInfo() {
   this._len = 0;
   this._curr = 0;
   this._dlLink = $("#downloadLink");
   this._dlInfo = $("#downloadInfo");
   this.reset.apply(this, arguments);
}
DownloadInfo.prototype.reset = function() {
   this._dlLink.hide();
   this._dlInfo.show();
   this._dlInfo.text("Download PDBs");
}
DownloadInfo.prototype.start = function(len) {
   this._dlInfo.text("downloading...");
   this._curr = 0;
   this._len = len;
}
DownloadInfo.prototype.progress = function() {
   this._curr++;
   DownloadInfo.prototype.status.call(this);
}
DownloadInfo.prototype.done = function(dlName, dlUrl) {
   this._curr = this._len;
   this._dlInfo.hide();
   this._dlLink.show();
   var link = document.getElementById('downloadLink');
   link.download = dlName;
   link.href = dlUrl;
   link.click();
}
DownloadInfo.prototype.status = function() {
   console.log("DownloadInfo: " + Math.round(this._curr / this._len * 1000) / 10);
   this._dlInfo.text("downloading (" + Math.round(this._curr / this._len * 1000) / 10 + "%)");
   return this._curr / this._len;
}



//------------------------------------------------------------------------------

function DownLoader() {
   this._files = [];
   this._currFile = 0;
   this.zip = null;
}
DownLoader.prototype._reset = function() {
   this._files = [];
   this._currFile = 0;
   this.zip = null;
}
DownLoader.prototype.start = function(files) {
   console.log("DownLoader start:");
   DownLoader.prototype._reset.call(this);
   if (files.length == 0) {
      alert("Error: No PDB files selected! Try to mark entries by their checkboxes.");
      return;
   }
   loader.busy();
   this._files = files;
   DownLoader.prototype._notify.call(this, 0);
   this._zip = new JSZip();
   downloadInfo.reset(files.length);
   downloadInfo.start(files.length);
}
DownLoader.prototype._get = function(file) {
   console.log("DownLoader get: " + file);
   var dfd = $.Deferred();
   $.ajax({
      url: file,
      success: dfd.resolve,
      error: dfd.reject
   });
   return dfd.promise();
}
DownLoader.prototype._notify = function(curr) {
   var _this = this;
   if (curr < this._files.length) {
      DownLoader.prototype._get.call(this, this._files[curr].url).then( function(data) {
         // add this file
         fn = _this._files[curr].filename;
         if (data.length <= 4) {
            fn += "_not_available"
         }
         _this._zip.file(fn, data);
         // keep track of progress
         downloadInfo.progress();
         // download next file
         DownLoader.prototype._notify.call(_this, curr + 1);
      }, function() {
         alert("Error: unable to download file \"" + _this._files[curr].url + "\"");
      });
   } else if (this._files.length > 0) {
      console.log("DownLoader: done");
      // we are done -> compress
      var blob = _this._zip.generate({compression:"DEFLATE",type:"blob"});
      downloadInfo.done('ProPairsSet.zip', window.URL.createObjectURL(blob));
      loader.ready();
   }
}


//------------------------------------------------------------------------------

function Loader() {
   this._body = $("body");
}
Loader.prototype.busy = function() {
   this._body.addClass("loading");
}
Loader.prototype.ready = function() {
   this._body.removeClass("loading");
}


//------------------------------------------------------------------------------

// init
var loader = new Loader();
//loader.busy();
var dbConfig = new DbConfig();
var dbSetSelector = new DbSetSelector(dbConfig);
var dbFilter = new DbFilter();
var dbSet = new DbSet(dbConfig);
var dbDetail = new DbDetail();
dbDetail.reset();
var downLoader = new DownLoader();
var downloadInfo = new DownloadInfo();
dbSet.updateSet(dbSetSelector.getCurr(), dbFilter);

window.setTimeout(function() {
   
   loader.ready();
});


// table row link
$('#dbSetTable tbody').on('click', 'a', function(e){
   e.stopPropagation();
   console.log(">link click a: " + this);
});
// table row checkbox
$('#dbSetTable tbody').on('click', 'input', function(e){
   e.stopPropagation();
   var id = $(this).closest('tr').data('id');
   console.log(">trcheckbox click input: " + id + ":" + this.checked);
   dbSet.select(id,  this.checked);
   dbDetail.select(id,  this.checked);
   downloadInfo.reset();
});
// table master checkbox
$('#dbSetTable thead').on('click', 'input', function(e){
   console.log(">master-checkbox click input: " + this.checked);
   dbSet.selectAll(this.checked);
   dbDetail.select(dbSet.getCurr(),  this.checked);
   downloadInfo.reset();
});
// table row preview
$('#dbSetTable tbody').on('click', 'td', function(e){
   e.preventDefault();
   console.log(">row click td: " + this);
   var id = $(this).closest('tr').data('id');
   console.log("  " + id);
   dbSet.setCurr(id);
   dbDetail.update(dbSet, dbConfig, dbSetSelector.getCurr());
});
// detail thumbnail images
$('#dbDetailView').on('click', 'td', function(e){
   var cplx = $(this).closest("td").data('cplx');
   console.log(">view click: " + cplx);
   if (e.target.nodeName == "TD")  {
      dbDetail.readImgCtrl(cplx, true);
      dbDetail.updateView(dbConfig, dbSetSelector.getCurr());   
   } else {
      dbDetail.readImgCtrl(cplx, false);
      dbDetail.updateView(dbConfig, dbSetSelector.getCurr());   
   }
});
// alignment
$('#dbDetailData').on('click', '.aln button', function(e){
   var id = $(this).closest('.aln').data('id');
   console.log(">alnclick: " + id);
   dbDetail.toggleAln(id);
});
$('#dbDetailData').on('click', '#clus', function(e){
   console.log(">clus: ");
   dbDetail.showClus();
});

// detail navigation
$('#dbDetailNav #close').on('click', function(e){
   e.preventDefault();
   console.log(">close click:");
   dbDetail.reset();
   dbSet.setCurr(-1);
});
$('#dbDetailNav #next').on('click', function(e){
   e.preventDefault();
   console.log(">next click:");
   var next = dbSet.getNext();
   console.log("  from " + dbSet.getCurr() + " to " + next);
   dbSet.setCurr(next);
   dbDetail.update(dbSet, dbConfig, dbSetSelector.getCurr());
});
$('#dbDetailNav #prev').on('click', function(e){
   e.preventDefault();
   console.log(">prev click:");
   var prev = dbSet.getPrev();
   console.log("  from " + dbSet.getCurr() + " to " + prev);
   dbSet.setCurr(prev);
   dbDetail.update(dbSet, dbConfig, dbSetSelector.getCurr());
});
$('#dbDetailNav :checkbox').on('click', function(e){
   e.stopPropagation();
   var id = dbSet.getCurr();
   console.log(">navcheckbox click input: " + id + ":" + this.checked);
   dbSet.select(id,  this.checked);
   dbDetail.select(id,  this.checked);
   downloadInfo.reset();
});
// control set selection
$('#dbControl #SetSelection').on('change', function(e){
   console.log(">dbControl click SetSelection: " + dbSetSelector.getCurr());
   loader.busy();
   window.setTimeout(function() {
      dbFilter.reset();
      dbSet.updateSet(dbSetSelector.getCurr(), dbFilter);
      dbDetail.reset();
      downloadInfo.reset();
      loader.ready();
   });
});
// filter control
$('#dbControl #Reset').on('click', function(e){
   console.log(">dbControl click reset:");
   loader.busy();
   window.setTimeout(function() {
      dbFilter.reset();
      dbSet.update(dbSetSelector.getCurr(), dbFilter);
      dbDetail.reset();
      downloadInfo.reset();
      loader.ready();
   });
});
$('#dbControl #Apply').on('click', function(e){
   console.log(">dbControl click apply:");
   loader.busy();
   window.setTimeout(function() {
      dbSet.update(dbSetSelector.getCurr(), dbFilter);
      dbDetail.reset();
      downloadInfo.reset();
      loader.ready();
   });
});
$('#dbControl #ShowFilter').on('click', function(e){
   console.log(">dbControl click ShowFilter:");
   dbFilter.show();
});
$('#dbControl #HideFilter').on('click', function(e){
   console.log(">dbControl click HideFilter:");
   dbFilter.hide();
});
// download
$("#downloadInfo").click(function (e) {
   console.log("DbDownloader:");
   // check bound/unbound selection
   var dlb = true;
   var dlu = true;
   var sel = $("input[name=DownloadType]:checked").val();
   if (sel == "bound") {
      dlb = true;
      dlu = false;
   } else if (sel == "unbound") {
      dlb = false;
      dlu = true;
   }
   var files = dbSet.getFiles(dbConfig, dbSetSelector.getCurr(), dlb, dlu);

   downLoader.start(files);
});
$("input[name=DownloadType]").change(function (e) {
   downloadInfo.reset();
});


/*
$( document ).tooltip({
  show: {
    delay: 1000
  }
});
*/





});

