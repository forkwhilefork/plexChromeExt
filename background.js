chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('offscreen.html'),
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'service workers are missing basic functionality so we need this',
});

// Called when the user clicks on the browser action.
chrome.action.onClicked.addListener(function(tab) {
    // Send a message to the active tab
    // "tell me what the plex token, clientId, and metadataId are"
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
    });
});

// actually don't need this, content script's message goes to offscreen
// so we don't need to receive here and pass along
/*// get info back from the in-page content
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "got_plex_token" ) {
        console.log("Your plex token is " + request.token);
        console.log("The current clientId is " + request.clientId);
        console.log("The current metadataId is " + request.metadataId);

        // send info to the offscreen page to do everything else
        chrome.runtime.sendMessage({"clientId": request.clientId, "metadataId": request.metadataId, "token": request.token});
      }
    }
);*/
