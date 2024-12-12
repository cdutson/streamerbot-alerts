# Streamer.bot Alerts

https://github.com/user-attachments/assets/31fb2475-16be-44f9-be36-e68e87905918

This project exists to allow for a streamer using OBS or Streamlabs (or anything that supports adding an HTML source) to have simple, functional alert overlays with minimal configuration. I created this project as I wanted to remove my dependence on streamelements, and having alert overlay reactions for things like Cheers, Raids, etc. was a significant hurtle.

After some (too much) research, I realized that by using the streamerbot websocket client, I could build my own system, and thus this project was born. This is a living project as I run into more functionality (and bugs therein) with a laundry-list of things I wish to support. I am also happy to have PR requests in fixing issues, adding functionality, etc.

> [!NOTE]
> This project is not for large and elaborate alert reactions! You'll want to get your hands dirty with streamer.bot and OBS (or whatever) to perform more elaborate actions, but this will get you some simple, easy alerts with minimal setup.

## Current functionality

This project currently supports the following Twitch events:

- Follow
- Cheer
- Raid
- Sub
- ReSub
- GiftSub
- GiftBomb

This project currently supports the following KoFi events:

- Donation
- Subscription
- Resubscription
- ShopOrder

A Quick look at features:

- custom images per alert type
- custom sounds per alert type
- custom text for alert titles and details
- option to inject users' message instead of detail message
- supports browser Text-to-speech (with overrides for each event type)
- supports overrides for certain events for specific interactions
- ability to suppress GiftSub events if a GiftBomb event happens
- debug mode, which will provide a firehose of console logs of events from streamerbot

## Getting started

1. Install [Streamer.bot](https://streamer.bot), and connect it to Twitch.
1. Turn on the Websocket Server:
   ![image](https://github.com/user-attachments/assets/525b2405-ff56-4bdb-a45b-3936b95f7b4f)
1. Add a new browser source in your streaming tool, and set it to point to the Alerts.html file of this project:
   ![image-1](https://github.com/user-attachments/assets/6e743129-83cf-4c78-b8ea-211fe60ee461)
1. [Set up your alert reactions](#alert-setup) in the `scripts/config.js` file.

> [!NOTE]
> To enable KoFi integration, please refer to the connection instructions found in the [Streamer.Bot KoFi integration page](https://docs.streamer.bot/guide/integrations/ko-fi).

## Global config

There are some global settings used for the defaults for alerts:

```javascript
// The default amount of time, in milliseconds that the alert will be displayed for
const defaultEventDisplayTime = 5000;

// if false no Text-To-Speech will fire, regardless of settings
const enableTTS = false;

// if DEBUG_MODE is set to true, events will be emitted into the console. This is useful if
// you're customizing your events, and want to see what data is sent with any given event.
const DEBUG_MODE = false;

// if enabled, only the GiftBomb event will be triggered, and the individual GiftSub events will be suppressed
const supressGiftBombSubEvents = true;

// look at https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis for more info on TTS props and voices
const defaultTTSSettings = {
  amountThreshold: 100, // only applies to Twitch.Cheer, KoFi.Donation, and KoFi.ShopOrder events currently
  delay: 1000,
  pitch: 1,
  rate: 1.3,
  voice: "Zira",
  volume: 1,
};
```

There are also a number of variables you can use to set some of the CSS variables through the config js if you don't want to mess around with the CSS file:

```javascript
// CSS variable settings

// If you want to use these overrides, set this to true
const useCSSVariables = false;
// color of message
const primaryTextColor = "#ffffff";
// color of alert title
const titleColor = "#00eeae";
// text shadow applied to both message and title
const textShadow =
  "0px 0px 2px rgba(0, 0, 0, 0.85), 0px 0px 4px rgba(0, 0, 0, 0.7)";
// the fonts you want to use. These fonts need to be installed on your system if you want them to work.
const fontStack = "'Montserrat-optimized', Monserrat, Verdana, sans-serif";
// how fast the alert should animate in
const animateInSpeed = "2s";
// how fast the alert should animate out
const animateOutSpeed = "2s";
// how fast the image of the alert should animate in
const imgAnimateInSpeed = "2.5s";
// how fast the image of the alert should animate out
const imgAnimateOutSpeed = "2.5s";
```

## Alerts Setup

Inside of the config.js file is a variable called `eventResponseStructure`. each key of that is related to an event emitted by streamerbot. When an alert is triggered, the code will select a random title, message, image, and sound for the alert from the configuration therein.

> [!NOTE]
> For all titles and messages (as well as the anonymous options) the event details are injected in as keys that can be used as token replacement. For example: `{user_name}` will be replaced with the `user_name` value from the triggered event. You can also dig for props in the data structure. For example `{user.name}` will look in data, find the `user` object, and then attempt to get the `name` prop therein. If it fails, an empty string is returned.

#### Example:

```javascript
const eventResponseStructure = {
  "Twitch.Follow": {
    title: ["New Follower"],
    message: ["Welcome {user_name}!", "Howdy {user_name}!"],
    images: ["images/welcome-1.webp"],
    sounds: ["sounds/alert-follow.mp3"],
    duration: 8000,
  },
  "Twitch.Cheer": {
    title: ["{user.name} gave bits!"],
    anonTitle: ["Bits!"],
    message: ["Thanks for the {bits} bits, {user.name}"],
    anonMessage: ["Thanks for the {bits} bits, anonymous patron!"],
    images: ["images/cheer-1.webp"],
    sounds: ["sounds/alert-cheer.mp3"],
    duration: 4000,
  },
};
```

You can refer to the sample config file that comes with this project for more examples.

> [!NOTE]
> For a full list of possible events, please refer to the [streamer.bot documentation](https://streamerbot.github.io/client/api/events) that lists all possible emitted events.

> [!NOTE]
> For details for all of the Twitch events sent from streamer.bot, please refer to the events list from the [streamer.bot documentation](https://docs.streamer.bot/api/servers/websocket/events/twitch), or enabled DEBUG_MODE to see a firehose of events that comes from streamerbot.

#### Note on KoFi events

All KoFi events have effectively the same structure (with a few exceptions):

| Prop      | Type                                | Explanation                                               | Events used                                               |
| --------- | ----------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| messageId | `string`                            | id of the message                                         | All                                                       |
| timestamp | `UTC timestamp string`              | a UTC timestamp of the event                              | All                                                       |
| from      | `string`                            | name of the user                                          | All                                                       |
| isPublic  | `boolean`                           | represents whether the event is an anomymous event or not | All                                                       |
| message   | `string`                            | message provided by user                                  | All                                                       |
| amount    | `string (represents a float value)` | amount of money in the event                              | All                                                       |
| currency  | `string`                            | a short currency string for the currency used             | All                                                       |
| tier      | `string`                            | name of the teir the user has subbed at                   | Resubscription, possibly Subscription (need confirmation) |
| items     | `[string]`                          | Array ids referring to items purchased                    | ShopOrder                                                 |

### Alert structure:

#### Twitch events

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

#### KoFi events

| Prop            | Type                                | Explanation                                                                                            | Events used |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| title           | `[string]`                          | Array of titles that show as the title of the alert                                                    | All         |
| message         | `[string]`                          | Array of messages that show under the title                                                            | All         |
| images          | `[string]`                          | Array of images that can be displayed for the event                                                    | All         |
| sounds          | `[string]`                          | Array of sounds that can be played for the event                                                       | All         |
| duration        | `int`                               | value in milliseconds for how long to display the alert                                                | All         |
| showUserMessage | `bool`                              | if true, will render the users message instead of a config message                                     | All         |
| textToSpeech    | `bool`                              | if true, will attempt to use TTS to read the message. Only used if `showUserMessage` is also true      | All         |
| anonTitle       | `[string]`                          | Array of titles that show for any alert that has the `isAnonymous` flag                                | All         |
| anonMessage     | `[string]`                          | Array of messages that show for any alert that has the `isAnonymous` flag                              | All         |
| tts             | [tts object](#tts-object-structure) | overrides global TTS settings                                                                          | All         |
| variants        | [variants object](#variants)        | overrides alerts under specific conditions                                                             | All         |
| exclusions      | `[string\|int]`                     | excludes the alert when specific conditions met. Refer to [variants](#variants) section for conditions | All         |

### TTS Object structure

With the exception of `delay` and `amountThreshold` all of the values of these props are derrived from the [Speech Synthesis Utterance API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)
| Prop | Type | Explanation |
| ------------- | ------------- | ------------- |
| voice | `string` | name of voice to use. Please check your browser's default language |
| pitch | `float between 0 and 2` | pitch adjustment for the voice |
| rate | `float between 0.1 and 10` | speed adjustment for text playback |
| volume | `float between 0 and 1` | volume adjustment for text playback |
| delay | `int` | value in milliseconds to delay the text playback |
| amountThreshold | `int` | **only used for Twitch.Cheer, KoFi.Donation, and KoFi.ShopOrder events** how many bits/amount needed to be given to enable TTS |

### Variants

Variants are special alert replacements when certain conditions are met. Each event type that can have a variant will have a comparison value that is used in check:

#### Twitch Variants

| Event Type | Comparison Value   |
| ---------- | ------------------ |
| Cheer      | `bits`             |
| Raid       | `viewerCount`      |
| ReSub      | `cumulativeMonths` |
| GiftSub    | `totalSubsGifted`  |
| GiftBomb   | `gifts`            |

#### KoFi Variants

Currently the only value used for evaluation is `amount`.

Currently there are 3 variant types you can use:

| Variant            | Explanation                                                                             | Example usage | matches                   |
| ------------------ | --------------------------------------------------------------------------------------- | ------------- | ------------------------- |
| exact match        | Will match when the comparison value matches the target exactly                         | `100`         | 100 matches               |
| range match        | Will match when the comparison value falls within the target range values (inclusively) | `100-200`     | 100, 105, 200 matches     |
| multiple match     | Will match when the comparison value is a multiple of the target value                  | `x100`        | 100, 200, 300 matches     |
| greater than match | Will match when the comparison value is a greater than the target value                 | `>1000`       | 1001, 2000, 30000 matches |
| less than match    | Will match when the comparison value is a less than the target value                    | `<10`         | 9, 2, 3 matches           |

> [!WARNING]
> There is a hierarchy to the matching. Exact match is first, then ranges, then multiples, then greater than, and then less than. When multiple matches are found the first match will be used.

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

## CSS information

If you want to get your hands dirty with the CSS, go nuts! I pulled the bounce animation from [Nelle de Jones](https://codepen.io/nelledejones/pen/gOOPWrK)'s codepen post, and in there you can find many other examples if the bounce doesn't do it for you. If you just want to change the variables you can do that using the [Global config](#global-config).

All events have a special class assigned to the event. For example a twitch cheer event will have `twitch-cheer` as a class added to the alert window, allowing you to do very specific overrides on a per event basis if you should choose. The format is `{source.toLowerCase}-{event.toLowerCase}`

## Future plans/ideas:

- [ ] support other platforms (YouTube is next on the list) (please contribute!)
- [x] additional variants support
- [x] equalize exclusions to variants
- [ ] Config tool (no-code config creation)
- [ ] Separate project for Chat client using WebSocket

## Support me (if you want)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S2KGPMT)
