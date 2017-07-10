/**
 * @author DYTH 2015
 */
var baseOprUrl = "http://124.17.4.31:8080/DBASCollectionService";
var baseOprUrl1 = "http://124.17.4.31:8080/dbas";

var configOptions = {
    "authorInfoKey": "authorInfo",
    "style": "normal", //normal,dark,midnight,grayscale,googlelite...
    "city": "北京",
    "zoomlevel": 15,
    "proxyUrl": "app/proxy/proxy.jsp",
    "isLogin": true,
    "LoginUrls": {
        "url": baseOprUrl + "/authentication/collection/login"
    },
    "thumbnailBaseUrl": baseOprUrl + "/",
    "thumbnailBaseUrl1": baseOprUrl1 + "/attachment/",
    "OprUrls": {
        "attachment": {
            "deleteUrl": baseOprUrl + "/attachment/delete/"
        },
        "building": {
            "addUrl": baseOprUrl + "/building/add",
            "queryUrl": baseOprUrl + "/building/search",
            "deleteUrl": baseOprUrl + "/building/delete",
            "updateUrl": baseOprUrl + "/building/update",
            "uploadUrl": baseOprUrl + "/building/upload2",
            "typeStaticUrl": baseOprUrl + "/statistics/type",
            "rovalStaticUrl": baseOprUrl + "/statistics/approval",
            "numStaticUrl": baseOprUrl + "/statistics/count"
        },
        "house": {
            "queryUrl": baseOprUrl1 + "/house/query",
            "typeStaticUrl": baseOprUrl1 + "/statistics/type",
            "timeStaticUrl": baseOprUrl1 + "/statistics/time",
            "floorStaticUrl": baseOprUrl1 + "/statistics/floor",
            "numStaticUrl": baseOprUrl1 + "/statistics/count"
        },
        "online": {
            "queryUrl": baseOprUrl + "/online/query"
        },
        "devicetrack": {
            "queryUrl": baseOprUrl + "/devicetrack/search"
        },
        "user": {
            "addUrl": baseOprUrl + "/user/add",
            "queryUrl": baseOprUrl + "/user/query",
            "deleteUrl": baseOprUrl + "/user/delete",
            "updateUrl": baseOprUrl + "/user/update"
        },
        "role": {
            "addUrl": baseOprUrl + "/role/add",
            "queryUrl": baseOprUrl + "/role/query",
            "deleteUrl": baseOprUrl + "/role/delete",
            "updateUrl": baseOprUrl + "/role/update"
        },
        "ysxinfo": {
            "addUrl": baseOprUrl1 + "/ysxinfo/add",
            "queryUrl": baseOprUrl1 + "/ysxinfo/query",
            "deleteUrl": baseOprUrl1 + "/ysxinfo/delete",
            "updateUrl": baseOprUrl1 + "/ysxinfo/update"
        },
        "region": {
            "addUrl": baseOprUrl + "/region/add",
            "queryUrl": baseOprUrl + "/region/query",
            "deleteUrl": baseOprUrl + "/region/delete",
            "updateUrl": baseOprUrl + "/region/update"
        },
        "buildingimages": {
            "queryUrl": baseOprUrl1 + "/buildingimages/query",
            "deleteUrl": baseOprUrl1 + "/buildingimages/delete",
            "uploadUrl": baseOprUrl1 + "/buildingimages/upload"
        }
    }
};