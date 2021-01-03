var pp = {

  getSetIds: async function() {
    const r = await fetch("data/sets.txt", {
      method: "GET",
    });
    return (await r.text())
      .split("\n")
      .map(e => e.trim())
      .filter(e => e != "")
      .sort()
      .reverse();
  },

  getSetDescription: async function (setId) {
    const r = await fetch(`./data/${setId}/set_descr.json`, {
      method: "GET",
    });
    let j = await r.json();
    j.id = setId;
    j.date_created = new Date(j.date_created);
    return j;
  },

  progressInit: function(parentId, p) {
    var ep = document.getElementById(parentId);
    let es = document.createElement("div");
    // es.innerHTML = "Loading data...";
    ep.appendChild(es);
    es.id = "pp-progress-text";
    es.classList.add("progress");
    let e = document.createElement("div");
    es.appendChild(e);
    e.id = "pp-progress";
    e.classList.add("progress-bar");
    if (p !== null) {
      e.style.width = `${p*100}%`;  
    } else {
      e.classList.add("progress-bar-striped");
      e.classList.add("progress-bar-animated");
      e.style.width = "100%";
    }
  },

  progressSet: function (p) {
    var e = document.getElementById("pp-progress");
    e.style.width = `${p*100}%`;
    e.innerHTML = `${(p*100).toFixed(2)}%`;
  },

};