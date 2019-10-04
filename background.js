var clientId = "";
var metadataId = "";

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
    // Send a message to the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    });
});

// get info back from the in-page content
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "got_plex_token" ) {
        console.log("Your plex token is " + request.token);
        console.log("The current clientId is " + request.clientId);
        console.log("The current metadataId is " + request.metadataId);
        clientId = request.clientId;
        metadataId = request.metadataId;
        getXml(apiResourceUrl.replace('{token}', request.token), getMetadata);
      }
    }
);

var apiResourceUrl = "https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}";
var apiLibraryUrl = "{baseuri}/library/metadata/{id}?X-Plex-Token={token}";
var downloadUrl = "{baseuri}{partkey}?download=1&X-Plex-Token={token}";

var accessTokenXpath = "//Device[@clientIdentifier='{clientid}']/@accessToken";
var baseUriXpath = "//Device[@clientIdentifier='{clientid}']/Connection[@local=0][@protocol='https']/@uri";
var directoryTypeXpath = "//Directory/@type";
var partKeyXpath = "//Media/Part[1]/@key";
var baseUri = null;
var accessToken = null;

var getXml = function(url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request.responseXML);
        }
    };
    request.open("GET", url);
    request.send();
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
    var partKeyNode = xml.evaluate(partKeyXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

    if (partKeyNode.singleNodeValue) {
        console.log("this is a single media item.");
        displayTextInNewTab(downloadUrl.replace('{baseuri}', baseUri).replace('{partkey}', partKeyNode.singleNodeValue.textContent).replace('{token}', accessToken));
        // TODO: here we should be iterating through a list instead of picking the first element
        // we may be able to reuse the "processSeasonChildren" function (and rename it to something more generic)
    } else {
        console.log("we're not on the page for a single media item. checking if it's a season or show.");
        
        directoryType = xml.evaluate(directoryTypeXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        
        if (directoryType.singleNodeValue.textContent == "season") {
            console.log("we're on the page for a season.")
            getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId + "/children").replace('{token}', accessToken), processSeasonChildrenCallback);
        } else if (directoryType.singleNodeValue.textContent == "show") {
            console.log("we're on the page for a show.")
            getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId + "/allLeaves").replace('{token}', accessToken), processSeasonChildrenCallback);
        } else {
            console.log("I don't know how to handle this page.");
        }
    }
};

var processSeasonChildren = function(xml) {
    var partKeyNodeSet = xml.evaluate(partKeyXpath, xml, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var thisNode = partKeyNodeSet.iterateNext();
    var urls = "";
    
    while (thisNode) {
      urls += downloadUrl.replace('{baseuri}', baseUri).replace('{partkey}', thisNode.textContent).replace('{token}', accessToken) + '\n';
      thisNode = partKeyNodeSet.iterateNext();
    }
    
    return urls;
};

var processSeasonChildrenCallback = function(xml) {
    displayTextInNewTab(processSeasonChildren(xml));
};

function displayTextInNewTab(text){
    var win = window.open();
    win.document.write('<iframe src="data:text/plain;charset=utf-8,' + encodeURIComponent(text)  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    //chrome.tabs.create({"url": request.url});
}
