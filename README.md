# neopixel-light-panel-ui
Frontend app for a custom neopixel lightpanel. Allows for the creation of configurable presets, and the control of which preset is being shown by the lightpanel. Backend web api and animation engine can be found at https://github.com/drybones/NeoPixelLightPanel

## Dev
Use `npm start` fromt he command line and then attach the debugger to the browser.

## Prod 
Use `npm run build` to compile into the `build` folder. Then `serve -s build` to start the static server.

Currently using `/etc/rc.local` to serve the static build on start-up:
```
serve -s /home/pi/github/neopixel-light-panel-ui/build &
```

## Config
`package.json` moves the default port to `5000` to avoid conflicting with backend.

The backend endpoint can be configured with `REACT_APP_LIGHTPANEL_API_SERVER`. You'll need to change this for a prod deployment with an endpoint reachable from the browser.