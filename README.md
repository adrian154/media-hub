# reddit-saved-slideshow
See your saved Reddit posts as a slideshow.

# Why?
I have a lot of images/GIFs saved on Reddit, and I wanted to look at all of them in a slideshow so I made this tool.

# How to Use

1. Clone the repo.
2. [Install NodeJS](https://nodejs.org/en/download/).
3. Go to Reddit.
4. Click "preferences"

![https://i.imgur.com/2FF06LD.png](preferences)

5. Click "apps"

![https://i.imgur.com/FedaHlg.png](apps)

6. Scroll down and click "create another app..."
7. Enter any name for the app. Select "script" and enter any valid URL for the "redirect URI" field.

![https://i.imgur.com/RfT3czh.png](making the app)

8. Create a file named `credentials.json` in the root folder. You can copy it from `credentials_example.json`, which is included in the repository.
9. Fill in your username and password. Copy the client ID and the client secret from the reddit apps page. You may have to click "edit" to reveal the client secret.

![https://i.imgur.com/8tWFFdx.png](where to find)

10. Start the app by running `node app.js` in the terminal from the repo's root folder.
11. You can now see a slideshow of your saved posts by navigating to `localhost` in your browser!

TODO: Add a section on how to add app on Reddit redesign.
