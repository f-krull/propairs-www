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

};