# plexChromeExt
This is a very simple Chrome extension. It makes it easier to download media from Plex servers. 


# Installation
For now, you have to install it manually. Browse to `chrome://extensions/` and click "Developer mode" in the top right. Now click "Load unpacked extension…" and select the extension’s directory. You should now see your extension in the list.

# Operation
1. Open the Plex web UI
2. Find what you want to download. The following types of media are supported: (1) TV shows, (2) TV seasons, (3) TV episodes, and (4) Movies
3. Click the extension icon to the right of the address bar
4. A new tab will open with one or more links
5. Download these links any way you want. What I usually do is
	a. Copy the links into a text file (e.g. `files.txt`)
	b. Run `wget --content-disposition -i files.txt`

# Contributing
Feel free to submit pull requests or issues.