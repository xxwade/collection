// get url  params
function getQuerystring(name){
    var    reg=new RegExp("(^|&)"+name+"=([^&]*)(&|$)"),r=window.location.search.substr(1).match(reg);
    if(r!=null)
        return decodeURI(r[2]);
    return null;
}
