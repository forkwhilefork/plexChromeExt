var clientIdRegex = new RegExp("server\/([a-f0-9]{40})\/");
var metadataIdRegex = new RegExp("key=%2Flibrary%2Fmetadata%2F(\\d+)");

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "clicked_browser_action" ) {
        if (typeof localStorage.myPlexAccessToken != "undefined") {
            clientId = clientIdRegex.exec(window.location.href);
            metadataId = metadataIdRegex.exec(window.location.href);
            if (clientId && clientId.length == 2) {
                if (metadataId && metadataId.length == 2) {
                    chrome.runtime.sendMessage({"message": "got_plex_token", "token": localStorage.myPlexAccessToken,
                                                "clientId": clientId[1], "metadataId": metadataId[1]});
                } else {
                    console.log("couldn't get metadataId - possibly you're not looking at a media item");
                }
            } else {
                console.log("couldn't get clientId");
            }
        } else {
            console.log("You are currently not browsing or logged into a Plex web environment.");
        }
      }
    }
  );