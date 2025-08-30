module.exports = (s) => {
    var r=s.toLowerCase();
    r = r.replace(new RegExp(/[àáâãäå]/g),"a");
    r = r.replace(new RegExp(/[èéêë]/g),"e");
    r = r.replace(new RegExp(/[ìíîï]/g),"i");
    r = r.replace(new RegExp(/ñ/g),"n");
    r = r.replace(new RegExp(/[òóôõö]/g),"o");
    r = r.replace(new RegExp(/[ùúûü]/g),"u");
    r = r.replace(/[&\/\\#,+()$~%.'":*?!¿<>{}]/g,'');
    r = r.trim().split(" ").join("-")
    return r;
}
