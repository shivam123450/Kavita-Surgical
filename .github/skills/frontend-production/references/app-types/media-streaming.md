# Video and audio streaming (on demand, live, TV apps)

## Contents
- The player
- Startup and quality of experience
- Accessibility of media
- Catalogue and browsing pages
- TV and remote-control apps
- Protecting content

## The player
- **Use a player library; never hand-roll adaptive streaming.**
  - **Shaka Player:** DASH and HLS, DRM through EME (Widevine, PlayReady, FairPlay), many platforms.
  - **hls.js:** HLS only, and smaller.
  - Prefer MSE playback through the library (ManagedMediaSource on iOS 17.1+); native HLS only where MSE is missing, or for AirPlay.
  - **Video.js** (v10 succeeds Vidstack, whose 1.x line only gets fixes) for an accessible player UI.
- **Check the DRM and device support matrix** of the chosen player against your target devices, and test on the real ones. Support differs between TV brands and models.
- **Tune adaptive bitrate and buffer settings** for your content. Most production playback problems come from these settings, not from code.
- **One player instance per screen.** `destroy()` it on unmount and release its media source; players are a common cause of leaks (memory.md).
- **Media Session API** for lock-screen and headset controls; picture-in-picture where it helps; background playback rules decided on purpose.

## Startup and quality of experience
- **Load the player's JavaScript only when playback is likely** (hovering, or opening a title), not on the catalogue's first load.
- **`preconnect` to the video CDN.** Use a poster image sized like the video, and, for a native `<video src>`, `preload="metadata"`. With an MSE player, `preload` has no effect: don't load the manifest until playback is likely.
- **Autoplay only muted, with `playsinline` on iOS.** Respect reduced motion and data-saver settings for previews.
- **Measure quality of experience:**
  - time to first frame;
  - how much of each view is spent rebuffering;
  - average bitrate, and how often it switches;
  - errors by type;
  - viewers who leave before playback starts.

  Send these to monitoring. Enable CMCD in the player to share playback state with the CDN (query mode by default; have the CDN drop `CMCD` from its cache key).

## Accessibility of media
- **Captions (WebVTT) for every video,** on by user choice and remembered; transcripts for audio; audio description where the visuals carry meaning. The European Accessibility Act covers audiovisual media services.
- **Player controls work with the keyboard** (Space for play and pause, the arrows to seek and change volume), have accessible names, and stay visible while focused.
- **Nothing flashes more than 3 times a second** in the UI. Warn about flashing content.

## Catalogue and browsing pages
- **They are image-heavy:** responsive images in AVIF or WebP, lazy below the fold, sized to avoid layout shift.
- **Horizontal rows of titles:** virtualized or paged, scroll-snap, and keyboard-reachable with visible focus.
- **The catalogue is server-rendered** for SEO and LCP; the player and personalised rows load in the browser.
- **Continue-watching progress** is saved regularly and when the page is hidden (`visibilitychange`, `pagehide`), with `navigator.sendBeacon` or `fetch` `keepalive`.

## TV and remote-control apps (10-foot UI)
- **Spatial navigation:** every element is reachable with the arrow keys, focus moves predictably, and the focus state is large and high-contrast. Use a spatial-navigation library (Norigin), not ad-hoc key handlers.
- **Back always works** and goes back one level.
- **Overscan safe area:** keep content about 5% in from the edges. Use large type and simple layouts.
- **Low-power devices:** limit animations and DOM size, keep memory under the device's limit, and test on the real TV models, not desktop Chrome.

## Protecting content
- **Signed, short-lived playback URLs or tokens,** issued by the server. Licence and geo checks happen on the server, never in client code.
- **DRM protects the stream, not the page.** Don't build fake protections that hurt accessibility, such as disabling right-click or keyboard shortcuts.

Sources: [Shaka Player](https://github.com/shaka-project/shaka-player) · [hls.js](https://github.com/video-dev/hls.js) · [MDN Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) · [MDN Encrypted Media Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API) · [MDN Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) · [Norigin Spatial Navigation](https://github.com/NoriginMedia/Norigin-Spatial-Navigation)
