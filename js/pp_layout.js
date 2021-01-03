const navCfg = [
  {
    type: "menu_entries",
    entries: [ 
      {
        type: "button",
        title: "Home",
        file: "home.html",
      },
      {
        type: "dropdown",
        title: "Interactive",
        entries: [
          {
            type: "button",
            title: "Non-redundant data set",
            file: "home.html",
          },
          {
            type: "button",
            title: "Comprehensive data set",
            file: "comprehensive.html",
          },
        ]
      }, {
        type: "dropdown",
        title: "Download",
        entries: [
          {
            type: "button",
            title: "Coordinate files (*.pdb)",
            file: "dl_pdb.html",
          },
          {
            type: "button",
            title: "Flat-file tables",
            file: "dl_pff.html",
          },
        ]
      },
    ],
  },
];

function _addButton(ep, cfg) {
  let eli = document.createElement("li");
  ep.appendChild(eli);
  eli.classList.add("nav-item");
  {
    let ea = document.createElement("a");
    eli.appendChild(ea);
    ea.classList.add("nav-link");
    ea.href = cfg.file;
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
        ea.href = cfge.file;
      }
    });
  }
}

const pplayout = {
  nav: function(nCfg) {
    let ep = document.getElementById("pp-nav");
    let enav = document.createElement("nav");
    ep.appendChild(enav);
    enav.classList.add("navbar");
    enav.classList.add("navbar-expand-lg");
    enav.classList.add("navbar-light");
    enav.classList.add("bg-light");
    let ecf = document.createElement("div");
    enav.appendChild(ecf);
    ecf.classList.add("container-fluid");
    {
      let ea = document.createElement("a");
      ecf.appendChild(ea);
      ea.classList.add("navbar-brand");
      ea.href = "./home.html";
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
    nCfg.forEach(menu_entries => {
      let eul = document.createElement("ul");
      edc.appendChild(eul);
      eul.classList.add("navbar-nav");
      eul.classList.add("me-auto");
      eul.classList.add("mb-2");
      eul.classList.add("mb-lg-0");
      menu_entries.entries.forEach( menu_e => {
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
    });
  }
}

pplayout.nav(navCfg);

const ppNavCurr = (function(){
  const fnCurr = location.pathname.split("/").pop();

  function _recSearch(e) {
    if (Object.keys(e).includes("file") && e.file == fnCurr) {
      return e;
    }
    if (Object.keys(e).includes("entries")) {
      for (const ee of e.entries) {
        const r = _recSearch(ee);
        if (r) {
          return r;
        }
      }
    }
  }

  let r = null;
  for (const e of navCfg) {
    r = _recSearch(e);
    if (r) {
      return r;
    }
  };

})(navCfg);

if (ppNavCurr) {
  document.title = `ProPairs ${ppNavCurr.title}`;
}