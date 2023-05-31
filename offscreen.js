chrome.runtime.onMessage.addListener(function (msg) {
    console.log(msg);

    clientId = msg.clientId;
    metadataId = msg.metadataId;

    getXml(apiResourceUrl.replace('{token}', msg.token), getMetadata);

});

var clientId = "";
var metadataId = "";

var apiResourceUrl = "https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}";
var apiLibraryUrl = "{baseuri}/library/metadata/{id}?X-Plex-Token={token}";
var downloadUrl = "{baseuri}{partkey}?download=1&X-Plex-Token={token}";

var accessTokenXpath = "//Device[@clientIdentifier='{clientid}']/@accessToken";
var baseUriXpath = "//Device[@clientIdentifier='{clientid}']/Connection[@local=0][@protocol='https']/@uri";
var directoryTypeXpath = "//Directory/@type";
var mediaPartKeyXpath = "//Media/Part[1]/@key";
var baseUri = null;
var accessToken = null;

var getXml = function (url, callback) {
    fetch(url)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(xml => callback(xml));
};

var getMetadata = function(xml) {
    var baseUriNodes = xml.evaluate(baseUriXpath.replace('{clientid}', clientId), xml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var accessTokenNode = xml.evaluate(accessTokenXpath.replace('{clientid}', clientId), xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    var thisBaseURINode = baseUriNodes.iterateNext();
    var URIs = [];

    while (thisBaseURINode) {
        URIs.push(thisBaseURINode.textContent)
        thisBaseURINode = baseUriNodes.iterateNext()
    }

    if (URIs.length == 0) {
        console.log("This server has no valid URIs.")
    } else if (URIs.length == 1) {
        baseUri = URIs[0]
    } else {
        baseUri = URIs[0]
        URIs.forEach(function(e) {
            if(e.includes('plex.direct')) {
                baseUri = e
            }
        });
    }

    if (accessTokenNode.singleNodeValue) {
        accessToken = accessTokenNode.singleNodeValue.textContent;
        console.log("Your access token for the current server is " + accessToken)

        getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId).replace('{token}', accessToken), getDownloadUrl);
        
    } else {
        console.log("Cannot find a valid accessToken.");
    }
};

var getDownloadUrl = function(xml) {
    // first we check what type of page we're looking at
    directoryType = xml.evaluate(directoryTypeXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    
    if(directoryType.singleNodeValue) {
        if (directoryType.singleNodeValue.textContent == "season") {
            console.log("this is a season.")
            // we can grab all the episodes at once if we append /children to the current URL
            getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId + "/children").replace('{token}', accessToken), extractAllMediaUrlsCallback);
        } else if (directoryType.singleNodeValue.textContent == "show") {
            console.log("this is a show.")
            // we can grab all the episodes at once if we append /allLeaves to the current URL
            getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId + "/allLeaves").replace('{token}', accessToken), extractAllMediaUrlsCallback);
        } else {
            console.log("I don't know how to handle this page.");
        }
    } else {
        // if there's no Directory element, it's not a season or show.
        // probably an individual media item (tv episode or movie).
        var mediaPartKeyNode = xml.evaluate(mediaPartKeyXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

        // but we still make sure before trying to get the URLs
        if (mediaPartKeyNode.singleNodeValue) {
            console.log("this is a single media item.");
            extractAllMediaUrlsCallback(xml);
        } else {
            console.log("I don't know how to handle this page.")
        }
    }
};

var extractAllMediaUrls = function(xml) {
    var partKeyNodeSet = xml.evaluate(mediaPartKeyXpath, xml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var thisNode = partKeyNodeSet.iterateNext();
    var urls = "";
    
    while (thisNode) {
      urls += downloadUrl.replace('{baseuri}', baseUri).replace('{partkey}', thisNode.textContent).replace('{token}', accessToken) + '\n';
      thisNode = partKeyNodeSet.iterateNext();
    }
    
    return urls;
};

var extractAllMediaUrlsCallback = function(xml) {
    displayTextInNewTab(extractAllMediaUrls(xml));
};

function displayTextInNewTab(text){
    var win = window.open();
    win.document.write('<iframe src="data:text/plain;charset=utf-8,' + encodeURIComponent(text)  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}
