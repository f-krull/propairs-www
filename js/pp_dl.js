function _getNewCard(ep, dscr) {
  let ec = document.createElement("div");
  ep.appendChild(ec);
  ec.classList.add("card");
  ec.classList.add("mb-lg-3");
  ec.classList.add("shadow-sm");
  ec.classList.add("mb-1");
  let eh = document.createElement("div");
  ec.appendChild(eh);
  eh.classList.add("card-header");
  {
    let es1 = document.createElement("span");
    eh.appendChild(es1);
    es1.classList.add("fw-bold");
    es1.classList.add("pe-2");
    es1.innerHTML = dscr.id;
    //eh.innerHTML = `Snapshot ${dscr.date_created.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`
    let es2 = document.createElement("span");
    eh.appendChild(es2);
    es2.innerHTML = `(${dscr.descr})`
  }
  return ec;
}

function _createDlItem(ep, name, url, text) {
  let edl = document.createElement("dl");
  ep.appendChild(edl);
  edl.classList.add("row");
  {
    let edt = document.createElement("dt");
    edl.appendChild(edt);
    edt.classList.add("col-sm-3");
    let ea = document.createElement("a");
    edt.appendChild(ea);
    ea.innerHTML = name;
    ea.href = url;
    let edd = document.createElement("dd");
    edl.appendChild(edd);
    edd.classList.add("col-sm-7");
    edd.innerHTML = text;
  }
}


// NOTE: actually it would be cleaner to do the async stuff (slow) after the getElementById (fast)
(async function() {
  // get set ids
  const set_ids  = await pp.getSetIds();
  // get set descriptions
  const set_descrs = await Promise.all(set_ids.map(async e => {
    return await pp.getSetDescription(e);
  }));
  // sort by date
  set_descrs.sort( (a,b) => a.date_created < b.date_created );
  // generate list items
  

  (function(ep){
    if (!ep) {
      return;
    }
    ep.innerHTML = '';
    set_descrs.forEach(e => {
      var ec = _getNewCard(ep, e);
      {
        let ecb = document.createElement("div");
        ec.appendChild(ecb);
        ecb.classList.add("card-body");
        _createDlItem(ecb,
          "representative ProPairs set",
          `data/${e.id}/propairs_set_${e.id}_paired_representative.tar.gz`,
          `${e.num_representative_interfaces} interfaces. Similar interfaces have been removed; only representative complexes and unbound structures are contained.`,
        );
      }
    });
  })(document.getElementById("coord-files"));

  (function(ep){
    if (!ep) {
      return;
    }
    ep.innerHTML = '';
    set_descrs.forEach(e => {
      var ec = _getNewCard(ep, e);
      {
        let ecb = document.createElement("div");
        ec.appendChild(ecb);
        ecb.classList.add("card-body");
        _createDlItem(ecb,
          "comprehensive ProPairs set",
          `data/${e.id}/propairs_set_${e.id}_unpaired_comprehensive.txt.gz`,
          `${e.num_interfaces} interfaces, ${e.num_alignments} entries (no redundancy was removed, but contains information for similarities and clusters).  See <a href="comprehensive.html?set=${e.id}">here</a> to view the file without downloading.`,
        );
        _createDlItem(ecb,
          "representative ProPairs set",
          `data/${e.id}/propairs_set_${e.id}_paired_representative.txt.gz`,
          `${e.num_representative_interfaces} interfaces (similar interfaces have been removed; only representative complexes and unbound structures are contained)`,
        );
      }
    });
  })(document.getElementById("plain-files"));

})();