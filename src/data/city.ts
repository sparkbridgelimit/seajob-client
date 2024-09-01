const cityList = [{"label":"北京","value":"101010100"},{"label":"上海","value":"101020100"},{"label":"广州","value":"101280100"},{"label":"深圳","value":"101280600"},{"label":"杭州","value":"101210100"},{"label":"天津","value":"101030100"},{"label":"西安","value":"101110100"},{"label":"苏州","value":"101190400"},{"label":"武汉","value":"101200100"},{"label":"厦门","value":"101230200"},{"label":"长沙","value":"101250100"},{"label":"成都","value":"101270100"},{"label":"郑州","value":"101180100"},{"label":"重庆","value":"101040100"},{"label":"佛山","value":"101280800"},{"label":"合肥","value":"101220100"},{"label":"济南","value":"101120100"},{"label":"青岛","value":"101120200"},{"label":"南京","value":"101190100"},{"label":"东莞","value":"101281600"},{"label":"昆明","value":"101290100"},{"label":"南昌","value":"101240100"},{"label":"石家庄","value":"101090100"},{"label":"宁波","value":"101210400"},{"label":"福州","value":"101230100"},{"label":"七台河","value":"101050900"},{"label":"万宁","value":"101310800"},{"label":"三亚","value":"101310200"},{"label":"三明","value":"101230800"},{"label":"三沙","value":"101310300"},{"label":"三门峡","value":"101181700"},{"label":"上饶","value":"101240300"},{"label":"东方","value":"101310900"},{"label":"东沙群岛","value":"101282200"},{"label":"东营","value":"101121200"},{"label":"中卫","value":"101170500"},{"label":"中山","value":"101281700"},{"label":"临夏回族自治州","value":"101161300"},{"label":"临汾","value":"101100700"},{"label":"临沂","value":"101120900"},{"label":"临沧","value":"101290800"},{"label":"临高","value":"101311300"},{"label":"丹东","value":"101070600"},{"label":"丽水","value":"101210800"},{"label":"丽江","value":"101290900"},{"label":"乌兰察布","value":"101080900"},{"label":"乌海","value":"101080300"},{"label":"乌鲁木齐","value":"101130100"},{"label":"乐东黎族自治县","value":"101311600"},{"label":"乐山","value":"101271400"},{"label":"九江","value":"101240200"},{"label":"云浮","value":"101281400"},{"label":"五家渠","value":"101131900"},{"label":"五指山","value":"101310500"},{"label":"亳州","value":"101220900"},{"label":"仙桃","value":"101201400"},{"label":"伊春","value":"101050700"},{"label":"伊犁哈萨克自治州","value":"101130600"},{"label":"佳木斯","value":"101050400"},{"label":"保亭黎族苗族自治县","value":"101311800"},{"label":"保定","value":"101090200"},{"label":"保山","value":"101290300"},{"label":"信阳","value":"101180600"},{"label":"儋州","value":"101310400"},{"label":"克孜勒苏柯尔克孜自治州","value":"101131100"},{"label":"克拉玛依","value":"101130200"},{"label":"六安","value":"101221400"},{"label":"六盘水","value":"101260600"},{"label":"兰州","value":"101160100"},{"label":"兴安盟","value":"101081100"},{"label":"内江","value":"101271200"},{"label":"凉山彝族自治州","value":"101272000"},{"label":"包头","value":"101080200"},{"label":"北屯市","value":"101132100"},{"label":"北海","value":"101301300"},{"label":"十堰","value":"101201000"},{"label":"南充","value":"101270500"},{"label":"南宁","value":"101300100"},{"label":"南平","value":"101230900"},{"label":"南通","value":"101190500"},{"label":"南阳","value":"101180700"},{"label":"博尔塔拉蒙古自治州","value":"101130500"},{"label":"双河市","value":"101132400"},{"label":"双鸭山","value":"101051200"},{"label":"可克达拉市","value":"101132200"},{"label":"台州","value":"101210600"},{"label":"台湾","value":"101341100"},{"label":"吉安","value":"101240600"},{"label":"吉林","value":"101060200"},{"label":"吐鲁番","value":"101130800"},{"label":"吕梁","value":"101101100"},{"label":"吴忠","value":"101170300"},{"label":"周口","value":"101181400"},{"label":"呼伦贝尔","value":"101080700"},{"label":"呼和浩特","value":"101080100"},{"label":"和田地区","value":"101131300"},{"label":"咸宁","value":"101200700"},{"label":"咸阳","value":"101110200"},{"label":"哈密","value":"101130900"},{"label":"哈尔滨","value":"101050100"},{"label":"唐山","value":"101090500"},{"label":"商丘","value":"101181000"},{"label":"商洛","value":"101110600"},{"label":"喀什地区","value":"101131200"},{"label":"嘉兴","value":"101210300"},{"label":"嘉峪关","value":"101161200"},{"label":"四平","value":"101060300"},{"label":"固原","value":"101170400"},{"label":"图木舒克","value":"101131800"},{"label":"塔城地区","value":"101131400"},{"label":"大兴安岭地区","value":"101051300"},{"label":"大同","value":"101100200"},{"label":"大庆","value":"101050800"},{"label":"大理白族自治州","value":"101291600"},{"label":"大连","value":"101070200"},{"label":"天水","value":"101160900"},{"label":"天门","value":"101201600"},{"label":"太原","value":"101100100"},{"label":"威海","value":"101121300"},{"label":"娄底","value":"101250800"},{"label":"孝感","value":"101200400"},{"label":"宁德","value":"101230300"},{"label":"安庆","value":"101220600"},{"label":"安康","value":"101110700"},{"label":"安阳","value":"101180200"},{"label":"安顺","value":"101260300"},{"label":"定安","value":"101311000"},{"label":"定西","value":"101160200"},{"label":"宜宾","value":"101271100"},{"label":"宜昌","value":"101200900"},{"label":"宜春","value":"101240500"},{"label":"宝鸡","value":"101110900"},{"label":"宣城","value":"101221300"},{"label":"宿州","value":"101220700"},{"label":"宿迁","value":"101191300"},{"label":"屯昌","value":"101311100"},{"label":"山南","value":"101140500"},{"label":"岳阳","value":"101251000"},{"label":"崇左","value":"101300200"},{"label":"巴中","value":"101270900"},{"label":"巴彦淖尔","value":"101080800"},{"label":"巴音郭楞蒙古自治州","value":"101130400"},{"label":"常州","value":"101191100"},{"label":"常德","value":"101250600"},{"label":"平凉","value":"101160300"},{"label":"平顶山","value":"101180500"},{"label":"广元","value":"101271800"},{"label":"广安","value":"101270800"},{"label":"庆阳","value":"101160400"},{"label":"廊坊","value":"101090600"},{"label":"延安","value":"101110300"},{"label":"延边朝鲜族自治州","value":"101060900"},{"label":"开封","value":"101180800"},{"label":"张家口","value":"101090300"},{"label":"张家界","value":"101251100"},{"label":"张掖","value":"101160700"},{"label":"徐州","value":"101190800"},{"label":"德宏傣族景颇族自治州","value":"101291300"},{"label":"德州","value":"101120400"},{"label":"德阳","value":"101271700"},{"label":"忻州","value":"101101000"},{"label":"怀化","value":"101251200"},{"label":"怒江傈僳族自治州","value":"101291400"},{"label":"恩施土家族苗族自治州","value":"101201300"},{"label":"惠州","value":"101280300"},{"label":"扬州","value":"101190600"},{"label":"承德","value":"101090400"},{"label":"抚州","value":"101240400"},{"label":"抚顺","value":"101070400"},{"label":"拉萨","value":"101140100"},{"label":"揭阳","value":"101281900"},{"label":"攀枝花","value":"101270200"},{"label":"文山壮族苗族自治州","value":"101291100"},{"label":"文昌","value":"101310700"},{"label":"新乡","value":"101180300"},{"label":"新余","value":"101241000"},{"label":"新星市","value":"101132500"},{"label":"无锡","value":"101190200"},{"label":"日喀则","value":"101140200"},{"label":"日照","value":"101121500"},{"label":"昆玉市","value":"101132300"},{"label":"昌吉回族自治州","value":"101130300"},{"label":"昌江黎族自治县","value":"101311500"},{"label":"昌都","value":"101140300"},{"label":"昭通","value":"101290700"},{"label":"晋中","value":"101100400"},{"label":"晋城","value":"101100600"},{"label":"普洱","value":"101290500"},{"label":"景德镇","value":"101240800"},{"label":"曲靖","value":"101290200"},{"label":"朔州","value":"101100900"},{"label":"朝阳","value":"101071200"},{"label":"本溪","value":"101070500"},{"label":"来宾","value":"101300400"},{"label":"松原","value":"101060700"},{"label":"林芝","value":"101140400"},{"label":"果洛藏族自治州","value":"101150600"},{"label":"枣庄","value":"101121400"},{"label":"柳州","value":"101300300"},{"label":"株洲","value":"101250300"},{"label":"桂林","value":"101300500"},{"label":"梅州","value":"101280400"},{"label":"梧州","value":"101300600"},{"label":"楚雄彝族自治州","value":"101291700"},{"label":"榆林","value":"101110400"},{"label":"武威","value":"101160500"},{"label":"毕节","value":"101260500"},{"label":"永州","value":"101251300"},{"label":"汉中","value":"101110800"},{"label":"汕头","value":"101280500"},{"label":"汕尾","value":"101282100"},{"label":"江门","value":"101281100"},{"label":"池州","value":"101221500"},{"label":"沈阳","value":"101070100"},{"label":"沧州","value":"101090700"},{"label":"河池","value":"101301200"},{"label":"河源","value":"101281200"},{"label":"泉州","value":"101230500"},{"label":"泰安","value":"101120800"},{"label":"泰州","value":"101191200"},{"label":"泸州","value":"101271000"},{"label":"洛阳","value":"101180900"},{"label":"济宁","value":"101120700"},{"label":"济源","value":"101181800"},{"label":"海东","value":"101150200"},{"label":"海北藏族自治州","value":"101150300"},{"label":"海南藏族自治州","value":"101150500"},{"label":"海口","value":"101310100"},{"label":"海西蒙古族藏族自治州","value":"101150800"},{"label":"淄博","value":"101120300"},{"label":"淮北","value":"101221100"},{"label":"淮南","value":"101220400"},{"label":"淮安","value":"101190900"},{"label":"清远","value":"101281300"},{"label":"温州","value":"101210700"},{"label":"渭南","value":"101110500"},{"label":"湖州","value":"101210200"},{"label":"湘潭","value":"101250200"},{"label":"湘西土家族苗族自治州","value":"101251400"},{"label":"湛江","value":"101281000"},{"label":"滁州","value":"101221000"},{"label":"滨州","value":"101121100"},{"label":"漯河","value":"101181500"},{"label":"漳州","value":"101230600"},{"label":"潍坊","value":"101120600"},{"label":"潜江","value":"101201500"},{"label":"潮州","value":"101281500"},{"label":"澄迈","value":"101311200"},{"label":"澳门","value":"101330100"},{"label":"濮阳","value":"101181300"},{"label":"烟台","value":"101120500"},{"label":"焦作","value":"101181100"},{"label":"牡丹江","value":"101050300"},{"label":"玉林","value":"101300900"},{"label":"玉树藏族自治州","value":"101150700"},{"label":"玉溪","value":"101290400"},{"label":"珠海","value":"101280700"},{"label":"琼中黎族苗族自治县","value":"101311900"},{"label":"琼海","value":"101310600"},{"label":"甘南藏族自治州","value":"101161400"},{"label":"甘孜藏族自治州","value":"101272100"},{"label":"白城","value":"101060500"},{"label":"白山","value":"101060800"},{"label":"白杨市","value":"101132700"},{"label":"白沙黎族自治县","value":"101311400"},{"label":"白银","value":"101161000"},{"label":"百色","value":"101301000"},{"label":"益阳","value":"101250700"},{"label":"盐城","value":"101190700"},{"label":"盘锦","value":"101071300"},{"label":"眉山","value":"101271500"},{"label":"石嘴山","value":"101170200"},{"label":"石河子","value":"101131600"},{"label":"神农架","value":"101201700"},{"label":"秦皇岛","value":"101091100"},{"label":"红河哈尼族彝族自治州","value":"101291200"},{"label":"绍兴","value":"101210500"},{"label":"绥化","value":"101050500"},{"label":"绵阳","value":"101270400"},{"label":"聊城","value":"101121700"},{"label":"肇庆","value":"101280900"},{"label":"胡杨河市","value":"101132600"},{"label":"自贡","value":"101270300"},{"label":"舟山","value":"101211100"},{"label":"芜湖","value":"101220300"},{"label":"茂名","value":"101282000"},{"label":"荆州","value":"101200800"},{"label":"荆门","value":"101201200"},{"label":"莆田","value":"101230400"},{"label":"菏泽","value":"101121000"},{"label":"萍乡","value":"101240900"},{"label":"营口","value":"101070800"},{"label":"葫芦岛","value":"101071400"},{"label":"蚌埠","value":"101220200"},{"label":"衡水","value":"101090800"},{"label":"衡阳","value":"101250400"},{"label":"衢州","value":"101211000"},{"label":"襄阳","value":"101200200"},{"label":"西双版纳傣族自治州","value":"101291000"},{"label":"西宁","value":"101150100"},{"label":"许昌","value":"101180400"},{"label":"贵港","value":"101300800"},{"label":"贵阳","value":"101260100"},{"label":"贺州","value":"101300700"},{"label":"资阳","value":"101271300"},{"label":"赣州","value":"101240700"},{"label":"赤峰","value":"101080500"},{"label":"辽源","value":"101060600"},{"label":"辽阳","value":"101071000"},{"label":"达州","value":"101270600"},{"label":"运城","value":"101100800"},{"label":"连云港","value":"101191000"},{"label":"迪庆藏族自治州","value":"101291500"},{"label":"通化","value":"101060400"},{"label":"通辽","value":"101080400"},{"label":"遂宁","value":"101270700"},{"label":"遵义","value":"101260200"},{"label":"邢台","value":"101090900"},{"label":"那曲","value":"101140600"},{"label":"邯郸","value":"101091000"},{"label":"邵阳","value":"101250900"},{"label":"郴州","value":"101250500"},{"label":"鄂尔多斯","value":"101080600"},{"label":"鄂州","value":"101200300"},{"label":"酒泉","value":"101160800"},{"label":"金华","value":"101210900"},{"label":"金昌","value":"101160600"},{"label":"钦州","value":"101301100"},{"label":"铁岭","value":"101071100"},{"label":"铁门关","value":"101132000"},{"label":"铜仁","value":"101260400"},{"label":"铜川","value":"101111000"},{"label":"铜陵","value":"101221200"},{"label":"银川","value":"101170100"},{"label":"锡林郭勒盟","value":"101081000"},{"label":"锦州","value":"101070700"},{"label":"镇江","value":"101190300"},{"label":"长春","value":"101060100"},{"label":"长治","value":"101100500"},{"label":"阜新","value":"101070900"},{"label":"阜阳","value":"101220800"},{"label":"防城港","value":"101301400"},{"label":"阳江","value":"101281800"},{"label":"阳泉","value":"101100300"},{"label":"阿克苏地区","value":"101131000"},{"label":"阿勒泰地区","value":"101131500"},{"label":"阿坝藏族羌族自治州","value":"101271900"},{"label":"阿拉善盟","value":"101081200"},{"label":"阿拉尔","value":"101131700"},{"label":"阿里地区","value":"101140700"},{"label":"陇南","value":"101161100"},{"label":"陵水黎族自治县","value":"101311700"},{"label":"随州","value":"101201100"},{"label":"雅安","value":"101271600"},{"label":"鞍山","value":"101070300"},{"label":"韶关","value":"101280200"},{"label":"香港","value":"101320300"},{"label":"马鞍山","value":"101220500"},{"label":"驻马店","value":"101181600"},{"label":"鸡西","value":"101051000"},{"label":"鹤壁","value":"101181200"},{"label":"鹤岗","value":"101051100"},{"label":"鹰潭","value":"101241100"},{"label":"黄冈","value":"101200500"},{"label":"黄南藏族自治州","value":"101150400"},{"label":"黄山","value":"101221600"},{"label":"黄石","value":"101200600"},{"label":"黑河","value":"101050600"},{"label":"黔东南苗族侗族自治州","value":"101260700"},{"label":"黔南布依族苗族自治州","value":"101260800"},{"label":"黔西南布依族苗族自治州","value":"101260900"},{"label":"齐齐哈尔","value":"101050200"},{"label":"龙岩","value":"101230700"}];

export default cityList;