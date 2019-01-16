var request = require('sync-request');
var fs = require('fs');
var cheerio = require('cheerio');

var cookie = fs.readFileSync('cookie', 'utf-8').trim();
var nPages = 10;

var hdrs ={
    'Accept': '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
    'Origin': 'http://www.jianshu.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.8',
    'Cookie': cookie,
};

var tokenRE = /<meta name="csrf-token" content="(.+?)" \/>/;
var idRE = /\/notes\/(\d+)/;

function getLinksWithHtml(html) {
    
    var $ = cheerio.load(html);
    var $links = $('a.title');
    var res = [];
    for(var i = 0; i < $links.length; i++) {
        res.push('https://www.jianshu.com' + 
            $links.eq(i).attr('href'));
    }
    return res;
}

function getLinks(url, n=nPages) {
    
    var res = [];
    
    for(var i = 1; i <= n; i++){
        
        var subUrl = `${url}?order_by=added_at&page=${i}`;
        var co = request('GET', subUrl, {headers: hdrs})
            .getBody().toString();
        var subRes = getLinksWithHtml(co);
        res = res.concat(subRes);
    }
    
    return res;
}

var li = getLinks('https://www.jianshu.com/c/NEt52a');

for (var url of li) {
    try {
        var co = request('GET', url, {headers: hdrs})
            .getBody().toString();
        var id = idRE.exec(co)[1];
        var token = tokenRE.exec(co)[1];
        hdrs['X-CSRF-Token'] = token;
        hdrs['Referer'] = url;
        
        var r = request('POST', `https://www.jianshu.com/notes/${id}/like`, {headers: hdrs});
        var code = r.statusCode.toString();
        
        if(code.startsWith('2')) 
            console.log(`${id} success`)
        else {
            var msg = r.body.toString();
            console.log(`${id} fail: ${msg}`);
        }
    } catch(ex) {
        console.log(ex.toString());
    }
}