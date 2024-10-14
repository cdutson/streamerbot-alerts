# Streamer.bot Alerts

This project is to allow for a streamer using OBS or Streamlabs (or anything that supports adding an HTML source) to have simple, functional alert overlays with minimal configuration. I created this project as I wanted to remove my dependence on streamelements, and having alert overlay reactions for things like Cheers, Raids, etc. was a significant hurtle.

After some (too much) research, I realized that by using the streamerbot websocket client, I could build my own system, and thus this project was born. This is a living project as I run into more functionality (and bugs therein) with a laundry-list of things I wish to support. I am also happy to have PR requests in fixing issues, adding functionality, etc.

## Current functionality

- Currently supports the following Twitch events:
  - Follow
  - Cheer
  - Raid
  - Sub
  - ReSub
  - GiftSub
  - GiftBomb
- custom images per alert type
- custom sounds per alert type
- custom text for alert titles and details
- option to inject users' message instead of detail message
- supports browser Text-to-speech (with overrides for each event type)
- supports overrides for certain events for specific interactions

## Getting started

1. Install [Streamer.bot](https://streamer.bot), and connect it to Twitch.
1. Turn on the Websocket Server:
![image](https://github.com/user-attachments/assets/525b2405-ff56-4bdb-a45b-3936b95f7b4f)
1. Add a new browser source in your streaming tool, and set it to point to the Alerts.html file of this project:
![image-1](https://github.com/user-attachments/assets/6e743129-83cf-4c78-b8ea-211fe60ee461)
1. [Set up your alert reactions](#alert-setup) in the `scripts/config.js` file.

## Global config

There are some global settings used for the defaults for alerts:

```javascript
// The default amount of time, in milliseconds that the alert will be displayed for
const defaultEventDisplayTime = 5000;

// if false no Text-To-Speech will fire, regardless of settings
const enableTTS = false;

// look at https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis for more info on TTS props and voices
const defaultTTSSettings = {
  cheerThreshold: 100,
  delay: 1000,
  pitch: 1,
  rate: 1.3,
  voice: "Zira",
  volume: 1,
};
```

## Alerts Setup

Inside of the config.js file is a variable called `eventResponseStructure`. each key of that is related to an event emitted by streamerbot. When an alert is triggered, the code will select a random title, message, image, and sound for the alert from the configuration therein.

> [!NOTE]
> For all titles and messages (as well as the anonymous options) the event details are injected in as keys that can be used as token replacement. For example: `{displayName}` will be replaced with the `displayName` value from the triggered event. This will work for any value, but it's primative replacement so expect JS shenanigans.

#### Example:

```javascript
const eventResponseStructure = {
  "Twitch.Follow": {
    // Event name
    title: ["New Follower"],
    message: ["Welcome {displayName}!", "Howdy {displayName}!"],
    images: ["images/welcome-1.webp"],
    sounds: ["sounds/alert-follow.mp3"],
    duration: 8000,
  },
  "Twitch.Cheer": {
    title: ["{displayName} gave bits!"],
    anonTitle: ["Bits!"],
    message: ["Thanks for the {bits} bits, {displayName}"],
    anonMessage: ["Thanks for the {bits} bits, anonymous patron!"],
    images: ["images/cheer-1.webp"],
    sounds: ["sounds/alert-cheer.mp3"],
    duration: 4000,
  },
};
```

> [!NOTE]
> For a full list of possible events, please refer to the [streamer.bot documentation](https://streamerbot.github.io/client/api/events) that lists all possible emitted events.

> [!NOTE]
> For details for all of the Twitch events sent from streamer.bot, please refer to the events list from the [streamer.bot documentation](https://docs.streamer.bot/api/servers/websocket/events/twitch).

### Alert structure:

| Prop             | Type                                | Explanation                                                                                            | Events used                           |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| title            | `[string]`                          | Array of titles that show as the title of the alert                                                    | All                                   |
| message          | `[string]`                          | Array of messages that show under the title                                                            | All                                   |
| images           | `[string]`                          | Array of images that can be displayed for the event                                                    | All                                   |
| sounds           | `[string]`                          | Array of sounds that can be played for the event                                                       | All                                   |
| duration         | `int`                               | value in milliseconds for how long to display the alert                                                | All                                   |
| showUserMessage  | `bool`                              | if true, will render the users message instead of a config message                                     | Cheer, Sub, ReSub                     |
| textToSpeech     | `bool`                              | if true, will attempt to use TTS to read the message. Only used if `showUserMessage` is also true      | Cheer, Sub, ReSub                     |
| anonTitle        | `[string]`                          | Array of titles that show for any alert that has the `isAnonymous` flag                                | Cheer, GiftSub, GiftBomb              |
| anonMessage      | `[string]`                          | Array of messages that show for any alert that has the `isAnonymous` flag                              | Cheer, GiftSub, GiftBomb              |
| showProfileImage | `bool`                              | if true, will render the senders profile image if one is provided                                      | Raid                                  |
| tts              | [tts object](#tts-object-structure) | overrides global TTS settings                                                                          | Cheer, Sub, ReSub                     |
| variants         | [variants object](#variants)        | overrides alerts under specific conditions                                                             | Cheer, Raid, ReSub, GiftSub, GiftBomb |
| exclusions       | `[string\|int]`                     | excludes the alert when specific conditions met. Refer to [variants](#variants) section for conditions | Cheer, Raid, ReSub, GiftSub, GiftBomb |

### TTS Object structure

With the exception of `delay` and `cheerThreshold` all of the values of these props are derrived from the [Speech Synthesis Utterance API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)
| Prop | Type | Explanation |
| ------------- | ------------- | ------------- |
| voice | `string` | name of voice to use. Please check your browser's default language |
| pitch | `float between 0 and 2` | pitch adjustment for the voice |
| rate | `float between 0.1 and 10` | speed adjustment for text playback |
| volume | `float between 0 and 1` | volume adjustment for text playback |
| delay | `int` | value in milliseconds to delay the text playback |
| cheerThreshold | `int` | **only used for cheer events** how many bits need to be given to enable TTS |

### Variants

Variants are special alert replacements when certain conditions are met. Each event type that can have a variant will have a comparison value that is used in check:

| Event Type | Comparison Value   |
| ---------- | ------------------ |
| Cheer      | `bits`             |
| Raid       | `viewerCount`      |
| ReSub      | `cumulativeMonths` |
| GiftSub    | `totalSubsGifted`  |
| GiftBomb   | `gifts`            |

Currently there are 3 variant types you can use:

| Variant        | Explanation                                                                             | Example usage | matches               |
| -------------- | --------------------------------------------------------------------------------------- | ------------- | --------------------- |
| exact match    | Will match when the comparison value matches the target exactly                         | `100`         | 100 matches           |
| range match    | Will match when the comparison value falls within the target range values (inclusively) | `100-200`     | 100, 105, 200 matches |
| multiple match | Will match when the comparison value is a multiple of the target value                  | `x100`        | 100, 200, 300 matches |

> [!WARNING]
> There is a hierarchy to the matching. Exact match is first, then ranges, and finally multiples. When multiple matches are found with ranges or multiples, the first match will be used.

#### Example:

```javascript
const eventResponseStructure = {
  "Twitch.Cheer": {
    title: ["{displayName} gave bits!"],
    anonTitle: ["Bits!"],
    message: ["Thanks for the {bits} bits, {displayName}"],
    anonMessage: ["Thanks for the {bits} bits, anonymous patron!"],
    images: ["images/cheer-1.webp"],
    sounds: ["sounds/alert-cheer.mp3"],
    showUserMessage: true,
    duration: 4000,
    textToSpeech: true,
    exclusions: [],
    tts: {
      delay: 3000,
    },
    variants: {
      100: {
        title: ["special event!"],
        tts: {
          delay: 3000,
        },
      },
      "100-200": {
        title: ["This is a range event!"],
      },
      "100-300": {
        title: [
          "This will never fire for anything between 100-200, because the previous range matches",
        ],
      },
      x500: {
        title: ["This is a multiple match"],
      },
    },
  },
};
```

## Future plans/ideas:

- [ ] support other platforms (YouTube is next on the list) (please contribute!)
- [ ] additional variants support
- [ ] equalize exclusions to variants
- [ ] code clean-up
- [ ] Config tool (no-code config creation)
- [ ] Separate project for Chat client using WebSocket
