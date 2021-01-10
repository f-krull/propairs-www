const _navCfg = {
  "menu": [
    {
      type: "button",
      title: "Home",
      url: "index.html",
    },
    {
      type: "dropdown",
      title: "Interactive",
      entries: [
        {
          type: "button",
          title: "Non-redundant data set",
          url: "nonredundant.html",
        },
        {
          type: "button",
          title: "Comprehensive data set",
          url: "comprehensive.html",
        },
      ]
    }, {
      type: "dropdown",
      title: "Download",
      entries: [
        {
          type: "button",
          title: "Coordinate files (*.pdb)",
          url: "dl_pdb.html",
        },
        {
          type: "button",
          title: "Flat-file tables",
          url: "dl_pff.html",
        },
      ]
    }, {
      type: "dropdown",
      title: "Info",
      entries: [
        {
          type: "button",
          title: "FAQ",
          url: "doc_faq.html",
        },
        {
          type: "button",
          title: "ProPairs algorithm",
          url: "doc_algo.html",
        },
      ]
    },
  ],
  "link": {
    title: "GitHub",
    url: "https://github.com/propairs/propairs",
  },
};

function _addButton(ep, cfg) {
  let eli = document.createElement("li");
  ep.appendChild(eli);
  eli.classList.add("nav-item");
  {
    let ea = document.createElement("a");
    eli.appendChild(ea);
    ea.classList.add("nav-link");
    ea.href = cfg.url;
    ea.innerHTML = cfg.title;
  }
}

function _addDropdown(ep, cfg) {
  let eli = document.createElement("li");
  ep.appendChild(eli);
  eli.classList.add("nav-item");
  eli.classList.add("dropdown");
  {
    let ea = document.createElement("a");
    eli.appendChild(ea);
    ea.innerHTML = cfg.title;
    ea.id = "navbarDropdown";
    ea.classList.add("nav-link");
    ea.classList.add("dropdown-toggle");
    ea.setAttribute("role", "button");
    ea.setAttribute("data-bs-toggle", "dropdown");
    ea.setAttribute("aria-expanded", "false");
    let eul = document.createElement("ul");
    eli.appendChild(eul);
    eul.classList.add("dropdown-menu");
    eul.setAttribute("aria-labelledby", "navbarDropdown");
    cfg.entries.forEach(cfge => {
      let eli = document.createElement("li");
      eul.appendChild(eli);
      {
        let ea = document.createElement("a");
        eli.appendChild(ea);
        ea.classList.add("dropdown-item");
        ea.innerHTML = cfge.title;
        ea.href = cfge.url;
      }
    });
  }
}

function _createNav(nCfg, ep) {
  if (!ep){
    return;
  }
  let enav = document.createElement("nav");
  ep.appendChild(enav);
  enav.classList.add("navbar");
  enav.classList.add("navbar-expand-lg");
  enav.classList.add("navbar-light");
  enav.classList.add("bg-light");
  enav.classList.add("shadow-sm");
  let ecf = document.createElement("div");
  enav.appendChild(ecf);
  ecf.classList.add("container-fluid");
  {
    let ea = document.createElement("a");
    ecf.appendChild(ea);
    ea.classList.add("navbar-brand");
    ea.href = "./index.html";
    let eimg = document.createElement("img");
    ea.appendChild(eimg);
    eimg.src = "img/propairs_a_89x89.png";
    eimg.width = 89;
    eimg.height = 89; 
    let ebtn = document.createElement("button");
    ecf.appendChild(ebtn);
    ebtn.classList.add("navbar-toggler");
    ebtn.setAttribute("data-bs-toggle", "collapse");
    ebtn.setAttribute("data-bs-target", "#navbarSupportedContent");
    ebtn.setAttribute("aria-controls", "navbarSupportedContent");
    ebtn.setAttribute("aria-expanded", "false");
    ebtn.setAttribute("aria-label", "Toggle navigation");
    {
      let espan = document.createElement("span");
      ebtn.appendChild(espan);
      espan.classList.add("navbar-toggler-icon");
    }
  }
  let edc = document.createElement("div");
  ecf.appendChild(edc);
  edc.classList.add("collapse");
  edc.classList.add("navbar-collapse");
  edc.id = "navbarSupportedContent";
  {
    let eul = document.createElement("ul");
    edc.appendChild(eul);
    eul.classList.add("navbar-nav");
    eul.classList.add("me-auto");
    eul.classList.add("mb-2");
    eul.classList.add("mb-lg-0");
    nCfg.menu.forEach( menu_e => {
      switch (menu_e.type) {
        case "button":
          _addButton(eul, menu_e)
          break;
      case "dropdown":
          _addDropdown(eul, menu_e)
          break;
        default:
          console.log("error: menu entry ->" + menu_e.type);
          break;
      }
    });
  }
  if (nCfg.link) {
    let ea = document.createElement("a");
    edc.appendChild(ea);
    ea.classList.add("p-2");
    ea.classList.add("text-dark");
    ea.innerHTML = nCfg.link.title;
    ea.href = nCfg.link.url;
  }
}

// add footer
function _createFooter(e) {
  if (!e) {
    return;
  }
  e.classList.add("text-muted");
  e.classList.add("py-3");
  e.classList.add("mt-lg-4");
  e.innerHTML = 
    `
      <div class="container">
        <hr>
        <span class="mb-1">© 2021 by F. Krull, Universitetet i Oslo</span><br>
        <span class="mb-1">
          Krull, F., Korff, G., Elghobashi-Meinhardt, N., &amp; Knapp, E. W. "ProPairs: A Data Set for Protein-Protein Docking" 
        <i>Journal of Chemical Information and Modeling</i> <b>2015</b>, 55 (7), 1495–1507.
        <a href="http://dx.doi.org/10.1021/acs.jcim.5b00082" target="_blank">
          DOI: 10.1021/acs.jcim.5b00082
        </a>
      </span>
    </div>`;
};

function _getNavCurr(e) {
  const fnCurr = location.pathname.split("/").pop();
  //--
  function _recSearch(entries) {
    for (var i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.url == fnCurr) {
        return e;
      }
      if (e.entries) {
        const r = _recSearch(e.entries);
        if (r) return r;
      }
    }
    return null;
  }
  //--
  return _recSearch(e.menu);
}


const pplayout = {
  navCurr: null,

  init: () => {
    pplayout.navCurr = _getNavCurr(_navCfg);
    if (pplayout.navCurr) document.title = `ProPairs ${pplayout.navCurr.title}`;
  },
  nav: () =>  _createNav(_navCfg, document.getElementById("pp-nav")),
  footer: () => _createFooter(document.getElementById("pp-footer")),
};
