module.exports = ()=>{
    var min = 1000;
    var max = 9999;
     return parseInt(Math.random() * (max - min) + min);
}