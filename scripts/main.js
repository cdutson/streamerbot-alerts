/*
 * Hi there! If you're looking at this, then you wanna know how this whole thing works.
 * These links will give you info for how the client connects, the events that get sent
 * through streamer bot, etc.
 *
 * Unless something is breaking (or you want to add functionality!) there shouldn't be
 * any reason to poke around in here. That said: I'm not your dad! Do what you want!
 *
 * Resource links
 * https://streamerbot.github.io/client/get-started/setup < This is client info
 * https://docs.streamer.bot/api/servers/websocket/events/twitch << list of events for twitch (and their responses)
 * https://streamerbot.github.io/client/api/events << All the events that streamerbot can emit
 * https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis << Everything you want to know about the Speech Synthesis API
 */

// NO TOUCHY BELOW
const synth = window.speechSynthesis;

const eventQueue = [];
let showingEvent = false;
let isTalking = false;
let intervalId = null;
let voices = [];

// replace {tokenName} with their value from the dataSet
// unknown tokens are replaced with an empty string
function replaceToken(targetString, dataSet) {
  return targetString.replace(/{(\w*)}/g, function (m, key) {
    return dataSet.hasOwnProperty(key) ? dataSet[key] : "";
  });
}

// given an array, returns a random item from it
function selectRandomItemFromArray(items) {
  if (!items?.length) {
    return null;
  }
  return items[Math.floor(Math.random() * items.length)];
}

// Gets the key from the data event for accessing eventResponseStructure values
function getEventStamp(data) {
  const eventInfo = data?.event;
  if (!eventInfo) {
    return null;
  }
  return `${eventInfo.source}.${eventInfo.type}`;
}

// clears out the alert info
function clearAlert() {
  const alertImage = document.getElementById("alertImage");
  alertImage.src = "";
  alertImage.classList.remove("bounce-in-img");
  alertImage.classList.add("hidden");

  document.getElementById("title").innerHTML = "";
  document.getElementById("message").innerHTML = "";
  document.getElementById("sound").src = "";
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.classList.remove(...alertContainer.classList);
}

// will run text to speech functionality with overrides if passed
// falls back to defaultTTSSettings
function textToSpeech(text, tts = {}) {
  // if flag is off, no TTS regardless of settings on the event
  if (!enableTTS) {
    return;
  }

  try {
    const voice =
      voices.find(
        (v) => v.name.indexOf(tts.voice || defaultTTSSettings.voice) > -1
      ) ?? undefined;
    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.pitch = tts.pitch || defaultTTSSettings.pitch;
    utterThis.rate = tts.rate || defaultTTSSettings.rate;
    utterThis.volume = tts.volume || defaultTTSSettings.volume;

    if (voice) {
      utterThis.voice = voice;
    }

    setTimeout(() => {
      synth.speak(utterThis);
    }, (tts.delay || defaultTTSSettings.delay) ?? 1000);
  } catch (e) {
    console.error(e);
  }
}

// entry point for injecting data into the alert container
function updateAlertContainer(data) {
  // expand here for other platforms, if you want
  if (data?.event?.source === "Twitch") {
    handleTwitchEvent(data);
  }
}

function isNumberInRangeString(range, number) {
  const rangeSplit = range.split("-");
  if (rangeSplit.length !== 2) {
    return;
  }

  return number >= Number(rangeSplit[0]) && number <= Number(rangeSplit[1]);
}

function isMultipleOfNumber(multiple, number) {
  return number % multiple === 0;
}

// returns true if should be excluded
function checkTwitchExclusions(eventInfo, eventData, structure) {
  let numberToCheck;
  if ((structure?.exclusions || []).length) {
    switch (eventInfo?.type) {
      case "Cheer":
        numberToCheck = eventData?.bits;
        break;
      case "Raid":
        numberToCheck = eventData?.viewerCount;
        break;
      case "ReSub":
        numberToCheck = eventData?.cumulativeMonths;
        break;
      case "GiftSub":
        numberToCheck = eventData?.totalSubsGifted;
        break;
      case "GiftBomb":
        numberToCheck = eventData?.gifts;
        break;
    }

    // check the numbers
    if (structure?.exclusions?.indexOf(numberToCheck) > -1) {
      return true;
    }

    // check the ranges
    return (
      structure?.exclusions
        ?.filter((v) => isNaN(v))
        .filter((range) => isNumberInRangeString(range, numberToCheck)).length >
      0
    );
    // mutiples not yet supported. Honestly these checks can be extracted and re-used between both
  }
  return false;
}

// merge variants into the base structure for specific
// overrides of events
function fetchTwitchVariant(eventInfo, eventData, structure) {
  let numberToCheck;
  let variantToMerge = {};
  let returnVal = { ...structure };

  if (Object.keys(structure?.variants || [])?.length) {
    switch (eventInfo?.type) {
      case "Cheer":
        numberToCheck = eventData?.bits;
        break;
      case "Raid":
        numberToCheck = eventData?.viewerCount;
        break;
      case "ReSub":
        numberToCheck = eventData?.cumulativeMonths;
        break;
      case "GiftSub":
        numberToCheck = eventData?.totalSubsGifted;
        break;
      case "GiftBomb":
        numberToCheck = eventData?.gifts;
        break;
    }

    variantToMerge = structure?.variants[numberToCheck];

    // check for ranges and multipliers
    if (!variantToMerge) {
      const nonNumberVariants = Object.keys(structure?.variants)?.filter((v) =>
        isNaN(v)
      );

      // if it matches a range
      const matchedRanges = nonNumberVariants.filter((range) =>
        isNumberInRangeString(range, numberToCheck)
      );
      if (matchedRanges.length) {
        variantToMerge = matchedRanges[0];
      }

      if (!variantToMerge) {
        // if it matches on a multiple
        let matchedMultiplierIndex = undefined;
        nonNumberVariants
          .filter((option) => option.startsWith("x"))
          .forEach((option) => {
            if (
              !matchedMultiplierIndex &&
              isMultipleOfNumber(option.slice(1), numberToCheck)
            ) {
              matchedMultiplierIndex = option;
            }
          });

        if (matchedMultiplierIndex) {
          variantToMerge = structure?.variants[matchedMultiplierIndex];
        }
      }
    }
  }

  return { ...returnVal, ...(variantToMerge || {}) };
}

// handles injecting info into the alert from a twitch event
// NOTE most of this can probably be abstracted away? need to see
// what other events might look like
function handleTwitchEvent(data) {
  const eventInfo = data?.event;
  let eventData = data?.data;

  // cheers (like mesasges) actually have a 'message' prop that contains all the data
  if (eventInfo?.type === "Cheer") {
    eventData = eventData.message;
  }

  const alertContainer = document.getElementById("alertContainer");
  const alertImage = document.getElementById("alertImage");
  const title = document.getElementById("title");
  const message = document.getElementById("message");
  const soundEl = document.getElementById("sound");

  if (eventInfo && eventData) {
    const eventStamp = getEventStamp(data);
    const structure = fetchTwitchVariant(
      eventInfo,
      eventData,
      eventResponseStructure[eventStamp]
    );

    alertContainer.classList.add(eventStamp.replace(".", "-").toLowerCase());

    let titleText;
    let messageText;
    let imgSrc;
    let soundFile;

    if (structure) {
      // don't fire events when they are excluded
      if (checkTwitchExclusions(eventInfo, eventData, structure)) {
        return;
      }

      if (eventData.isAnonymous) {
        titleText = replaceToken(
          selectRandomItemFromArray(structure.anonTitle),
          eventData
        );
        messageText = replaceToken(
          selectRandomItemFromArray(structure.anonMessage),
          eventData
        );
      } else {
        titleText = replaceToken(
          selectRandomItemFromArray(structure.title),
          eventData
        );
        messageText = replaceToken(
          selectRandomItemFromArray(structure.message),
          eventData
        );
      }

      if (
        ["Sub", "ReSub", "GiftSub", "GiftBomb"].indexOf(eventInfo?.type) > -1 &&
        structure.primeMessage.length &&
        eventData.subTier === 0
      ) {
        messageText = replaceToken(
          selectRandomItemFromArray(structure.primeMessage),
          eventData
        );
      }

      // override message if user has message and is supported and override is enabled
      if (structure.showUserMessage && eventData?.message) {
        messageText = eventData.message ?? messageText;
      }

      // override the image to the users profileImage if it exists and override is enabled
      if (structure.showProfileImage && eventData.profileImage) {
        imgSrc = eventData.profileImage;
      } else {
        imgSrc = selectRandomItemFromArray(structure.images);
      }

      soundFile = selectRandomItemFromArray(structure.sounds);

      if (imgSrc) {
        alertImage.src = imgSrc;
        alertImage.classList.remove("hidden");
      }

      if (soundFile) {
        soundEl.src = soundFile;
      }

      title.innerHTML = titleText;
      message.innerHTML = messageText;

      if (
        structure.textToSpeech &&
        structure.showUserMessage &&
        eventData?.message
      ) {
        if (
          eventInfo?.type !== "Cheer" ||
          eventData?.bits >=
            (structure.tts?.cheerThreshold || defaultTTSSettings.cheerThreshold)
        ) {
          textToSpeech(messageText, structure.tts);
        }
      }
    }
  }
}

// Queue-related stuff
//////////////////////

// polling interval that will look for new alerts every half-second
function startQueueProcessing() {
  if (!intervalId) {
    intervalId = setInterval(handleQueueItem, 500);
  }
}

// workhourse function that will show the next alert as long as
// another alert is not currently being rendered
function handleQueueItem() {
  if (!showingEvent && eventQueue.length) {
    const newEvent = eventQueue.shift();
    const eventStamp = getEventStamp(newEvent);
    const structure = eventResponseStructure[eventStamp];

    updateAlertContainer(newEvent);
    startShowAnimation();

    setTimeout(function () {
      startEndAnimation();
    }, structure.duration ?? defaultEventDisplayTime);
  }
}

// event to push listener data to the queue and starts the polling
function addEventToQueue(data) {
  eventQueue.push(data);
  startQueueProcessing();
}

// animation stuff
//////////////////////

function startShowAnimation() {
  const alertContainer = document.getElementById("alertContainer");
  document.getElementById("alertImage").classList.add("bounce-in-img");
  alertContainer.classList.add("bounce-in");
  alertContainer.classList.remove("bounce-out");
}

function startEndAnimation() {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.classList.add("bounce-out");
  alertContainer.classList.remove("bounce-in");
}

// event listener to do some shenanigans when the animate-in animation starts
function onAnimationStart(event) {
  if (event.animationName === "bounce-in") {
    showingEvent = true;
    const soundEl = document.getElementById("sound");

    if (soundEl?.src) {
      try {
        soundEl.play();
      } catch (e) {
        console.error("music error", e);
      }
    }
  }
}

// event listener to do some shenanigans when the animate-out animation ends
function hideOnAnimationEnd(event) {
  if (event.animationName === "bounce-out") {
    clearAlert();
    showingEvent = false;
  }
  if (event.animationName === "bounce-in") {
    document.getElementById("alertContainer").classList.remove("bounce-in");
  }
}

function attachListeners() {
  // animation listeners
  document
    .getElementById("alertContainer")
    .addEventListener("animationstart", onAnimationStart);
  document
    .getElementById("alertContainer")
    .addEventListener("animationend", hideOnAnimationEnd);

  if (synth) {
    voices = synth.getVoices();
  }
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      voices = synth.getVoices();
    };

    voices = synth.getVoices();
  }
}

// Entry point for whole application. attaches the websocket listeners as
// well as the animation listeners

//https://streamerbot.github.io/client/get-started/setup << if you want custom options

const client = new StreamerbotClient({
  subscribe: "*",
  onData: (data) => {
    const eventName = getEventStamp(data);
    if (Object.keys(eventResponseStructure).indexOf(eventName) > -1) {
      addEventToQueue(data);
    }
  },
});
