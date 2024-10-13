/*
eventResponseStructure structure:
[key as combination of event.source and event.type e.g "Twitch.Cheer"]: {
    title: [],
    message: [],
    // image and sound arrays take strings pointing to a local file location
    images?: [], // if no images, nothing displayed
    sounds?: [], // if no sounds, no sounds played
    duration?: 0 // miliseconds, defaults to 5000 if not set
}

additionally
- textToSpeech: for any event with a message
- tts: if you want to override any of your global tts settings (only matters for anything with textToSpeech enabled)
- anonTitle: for any event that has `isAnonymous` flag
- anonMessage: for any event that has `isAnyonymous` flag
- showUserMessage: for any event with a user message that you want to display _instead_ of your message
- showProfileImage :for any event with a profileImage (Raids) that you want to display _instead_ of your image
- primeMessage: for any sub event where the subTier exists and is 0 (prime)
- variants: exist for the following events: Cheer, Raid, ReSub, GiftSub, GiftBomb.
  Variants support exact matches (e.g. 100), ranges (100-200), and multiples (x100). Varients will override
  whatever key/values you put in there over the base event shape
*/

// By default all alerts will display for 5 seconds before fading out
const defaultEventDisplayTime = 5000;

const enableTTS = true; // if false no TTS regardless of settings
// look at https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis for more info on TTS props and voices
const defaultTTSSettings = {
  cheerThreshold: 100,
  delay: 1000,
  pitch: 1,
  rate: 1.3,
  voice: "Zira",
  volume: 1,
};

/* Every object in eventResponseStructure will be used by the event loop to react to specific events
 * currently supported:
 * - Twitch.Follow
 * - Twitch.Cheer
 * - Twitch.Raid
 * - Twitch.Sub
 * - Twitch.ReSub
 * - Twitch.GiftSub
 * - Twitch.GiftBomb
 *
 * If you want to add more, you can! technically any event should be "supported" but in reality
 * some events are very special snowflake events, and you'll have to edit updateAlertContainer
 * (if you want to support other platforms) and handleTwitchEvent for any specific event weirdness
 */

const eventResponseStructure = {
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#follow
  "Twitch.Follow": {
    title: ["New Follower"],
    message: ["Welcome {displayName}!", "Howdy {displayName}!"],
    images: ["images/welcome-1.webp"],
    sounds: ["sounds/alert-follow.mp3"],
    duration: 8000,
  },
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#cheer
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
    },
  },
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#raid
  "Twitch.Raid": {
    title: ["{displayName} is here!"],
    message: ["Welcome!", "Hello raiders!"],
    images: [],
    sounds: ["sounds/alert-raid.mp3"],
    showProfileImage: true,
    duration: 8000,
  },
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#sub
  "Twitch.Sub": {
    title: ["New Subscriber"],
    message: ["Thanks for the sub, {displayName}!"],
    primeMessage: ["Thanks for the Twitch Prime sub {displayName}!"],
    images: ["images/sub-1.webp"],
    sounds: ["sounds/alert-sub.mp3"],
    showUserMessage: true,
    duration: 10000,
  },
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#resub
  "Twitch.ReSub": {
    title: ["{displayName} Resubscribed!"],
    message: ["Thanks for the {cumulativeMonths} months, {displayName}!"],
    primeMessage: [
      "Thanks for resubbing with your Twitch Prime sub {displayName}!",
    ],
    images: ["images/sub-1.webp"],
    sounds: ["sounds/alert-sub.mp3"],
    showUserMessage: true,
    duration: 10000,
  },
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#gift-sub
  "Twitch.GiftSub": {
    title: ["{recipientDisplayName} was gifted a sub"],
    anonTitle: ["{recipientDisplayName} was gifted a sub"],
    message: ["Thanks for the gift sub, {displayName}"],
    anonMessage: ["Thanks for the gift sub, anonymous patron!"],
    primeMessage: ["There are prime gift subs?!"],
    images: ["images/sub-1.webp"],
    sounds: ["sounds/alert-sub.mp3"],
    duration: 10000,
  },
  // https://docs.streamer.bot/api/servers/websocket/events/twitch#gift-bomb
  "Twitch.GiftBomb": {
    title: ["{displayName} gifted {gifts} subs"],
    anonTitle: ["{gifts} subs have been gifted"],
    message: ["Thanks {displayName} for the subs!"],
    anonMessage: ["Thanks for the {gifts} subs!"],
    primeMessage: ["There are prime gift subs?!"],
    images: ["images/sub-1.webp"],
    sounds: ["sounds/alert-sub.mp3"],
    duration: 10000,
  },
};
