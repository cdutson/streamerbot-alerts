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

// NEW TODO LIST

// Update documentation (kofi event structure)
// dry out event handling start

// NO TOUCHY BELOW
const synth = window.speechSynthesis;

const eventQueue = [];
let showingEvent = false;
let isTalking = false;
let intervalId = null;
let voices = [];
const giftSubIds = [];

// replace {tokenName} with their value from the dataSet
// unknown tokens are replaced with an empty string
function replaceToken(targetString, dataSet) {
  return targetString.replace(/{(\S*)}/g, function (m, key) {
    if (dataSet.hasOwnProperty(key)) {
      return dataSet[key];
    } else if (key.split(".").length > 1) {
      const keyparts = key.split(".");
      let objRef = dataSet;

      keyparts.forEach((part) => {
        if (objRef.hasOwnProperty(part)) {
          objRef = objRef[part];
        } else {
          objRef = null;
        }
      });
      return objRef ? objRef : "";
    }
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
function getEventStamp(eventInfo) {
  if (!eventInfo) {
    return null;
  }
  return `${eventInfo.source}.${eventInfo.type}`;
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
  let alert;
  let structure;
  const source = data?.event?.source;

  if (source === "Twitch") {
    [alert, structure] = handleTwitchEvent(data);
  } else if (source === "Kofi") {
    [alert, structure] = handleKoFiEvent(data);
  }

  if (alert && structure) {
    injectAlertMarkup(alert);
    updateSoundEl(structure);
    triggerAnimation(structure.duration);
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

// Based on the source and type of event, find the value of
// specific prop from event to use as a value check for variants and exclusions
function getValueToCheck(eventInfo, eventData) {
  if (!eventInfo || !eventData) return;

  if (eventInfo.source === "Twitch") {
    switch (eventInfo.type) {
      case "Cheer":
        return eventData.bits;
      case "Raid":
        return eventData.viewerCount;
      case "ReSub":
        return eventData.cumulativeMonths;
      case "GiftSub":
        return eventData.totalSubsGifted;
      case "GiftBomb":
        return eventData.gifts;
    }
  } else if (eventInfo.source === "Kofi") {
    return eventData.amount;
  }
  return;
}

// tries to find a match with more complex checks given an array of strings and the comparison
function findMatch(keys, numberToCheck) {
  // if it matches a range
  let match;

  // Check for range match
  const matchedRanges = keys.filter((range) =>
    isNumberInRangeString(range, numberToCheck)
  );

  if (matchedRanges.length) {
    match = matchedRanges[0];
  }

  //
  if (!match) {
    match = keys
      .filter((option) => option.startsWith("x"))
      .find((option) => isMultipleOfNumber(option.slice(1), numberToCheck));
  }

  if (!match) {
    match = keys
      .filter((option) => option.startsWith(">"))
      .find((option) => Number(numberToCheck) > Number(option.slice(1)));
  }

  if (!match) {
    match = keys
      .filter((option) => option.startsWith("<"))
      .find((option) => Number(numberToCheck) < Number(option.slice(1)));
  }
  return match;
}

// based on the event source, get the correct template to render alert
function fetchHtmlTemplate(eventInfo) {
  let template;
  switch (eventInfo?.source) {
    case "Twitch":
      template = document.querySelector("#twitchAlertTemplate");
      break;
    case "Kofi":
      template = document.querySelector("#kofiAlertTemplate");
      break;
  }

  if (template) {
    return template.content.cloneNode(true);
  }

  return undefined;
}

// injects alert markup node into the correct spot
function injectAlertMarkup(node) {
  if (node) {
    document.querySelector("#alertContainer")?.appendChild(node);
  }
}

// updates the sound element on the page with a sound based on structure
function updateSoundEl(structure) {
  const soundEl = document.getElementById("sound");
  const soundFile = selectRandomItemFromArray(structure.sounds);
  if (soundEl && soundFile) {
    soundEl.src = soundFile;
  }
}

// returns true if should be excluded
function checkForEventExclusions(eventInfo, eventData, structure) {
  let numberToCheck;
  if ((structure?.exclusions || []).length) {
    numberToCheck = getValueToCheck(eventInfo, eventData);
    // check the numbers
    if (
      structure?.exclusions?.indexOf(Number(numberToCheck)) > -1 ||
      structure?.exclusions?.indexOf(numberToCheck) > -1
    ) {
      return true;
    }

    // check for other matches
    const nonNumberVariants = structure?.exclusions?.filter((v) => isNaN(v));

    return !!findMatch(nonNumberVariants, numberToCheck);
  }
  return false;
}

// checks if a gift sub is in the exclusion list
function checkForGiftBombExclusions(eventInfo, eventData) {
  if (!supressGiftBombSubEvents || eventInfo?.type !== "GiftSub") {
    return false;
  }
  return !!giftSubIds.find((id) => id === eventData.recipientUserId);
}
// merge variants into the base structure for specific
// overrides of events
function fetchEventVariant(eventInfo, eventData, structure) {
  let numberToCheck;
  let variantToMerge = {};
  let returnVal = { ...structure };

  if (Object.keys(structure?.variants || [])?.length) {
    numberToCheck = getValueToCheck(eventInfo, eventData);

    variantToMerge =
      structure?.variants[Number(numberToCheck)] ??
      structure?.variants[numberToCheck];

    // check for other matches
    if (!variantToMerge) {
      const nonNumberVariants = Object.keys(structure?.variants)?.filter((v) =>
        isNaN(v)
      );

      variantToMerge =
        structure?.variants[findMatch(nonNumberVariants, numberToCheck)] ||
        undefined;
    }
  }

  return { ...returnVal, ...(variantToMerge || {}) };
}

// show data into template
function compileAlertMarkup(eventInfo, data) {
  const { imgSrc, title, message } = data;

  const contents = fetchHtmlTemplate(eventInfo);

  if (contents) {
    contents
      .querySelector(".alert")
      ?.classList.add(getEventStamp(eventInfo).replace(".", "-").toLowerCase());

    const alertImage = contents.getElementById("alertImage");
    const titleEl = contents.getElementById("title");
    const messageEl = contents.getElementById("message");

    if (imgSrc) {
      alertImage.src = imgSrc;
      alertImage.classList.remove("hidden");
    }

    titleEl.innerHTML = title;
    messageEl.innerHTML = message;
  }

  return contents;
}

// handles injecting info into the alert from a twitch event
// NOTE most of this can probably be abstracted away? need to see
// what other events might look like
function handleTwitchEvent(data) {
  const eventInfo = data?.event;
  let eventData = data?.data;
  let returnVal = [null, null];
  const templateData = {
    imgSrc: null,
    title: null,
    message: null,
  };

  if (eventInfo && eventData) {
    const eventStamp = getEventStamp(eventInfo);
    const structure = fetchEventVariant(
      eventInfo,
      eventData,
      eventResponseStructure[eventStamp]
    );

    if (structure) {
      // don't fire events when they are excluded
      if (checkForEventExclusions(eventInfo, eventData, structure)) {
        return returnVal;
      }

      // if the giftsub was part of a giftbomb, and we're supressing them
      if (checkForGiftBombExclusions(eventInfo, eventData)) {
        // strip out id from list, exit early
        giftSubIds = giftSubIds.filter((id) => id !== eventData.userId);
        return returnVal;
      }

      if (eventData.isAnonymous) {
        templateData.title = replaceToken(
          selectRandomItemFromArray(structure.anonTitle),
          eventData
        );
        templateData.message = replaceToken(
          selectRandomItemFromArray(structure.anonMessage),
          eventData
        );
      } else {
        templateData.title = replaceToken(
          selectRandomItemFromArray(structure.title),
          eventData
        );
        templateData.message = replaceToken(
          selectRandomItemFromArray(structure.message),
          eventData
        );
      }

      if (
        ["Sub", "ReSub", "GiftSub", "GiftBomb"].indexOf(eventInfo?.type) > -1 &&
        structure.primeMessage.length &&
        eventData.is_prime
      ) {
        templateData.message = replaceToken(
          selectRandomItemFromArray(structure.primeMessage),
          eventData
        );
      }

      if (supressGiftBombSubEvents && eventInfo?.type === "GiftBomb") {
        giftSubIds.push(
          ...(eventData?.recipients?.map((sub) => sub?.id) || [])
        );
      }

      // override message if user has message and is supported and override is enabled
      if (
        structure.showUserMessage &&
        (eventData?.message || eventData?.text)
      ) {
        const msg =
          typeof eventData?.message === "string"
            ? eventData?.message
            : eventData?.text;
        templateData.message = msg ?? templateData.message;
      }

      // override the image to the users profileImage if it exists and override is enabled
      if (structure.showProfileImage && eventData.profileImage) {
        templateData.imgSrc = eventData.profileImage;
      } else {
        templateData.imgSrc = selectRandomItemFromArray(structure.images);
      }

      if (
        structure.textToSpeech &&
        structure.showUserMessage &&
        templateData.message
      ) {
        if (
          eventInfo?.type !== "Cheer" ||
          eventData?.bits >=
            (structure.tts?.cheerThreshold || defaultTTSSettings.cheerThreshold)
        ) {
          textToSpeech(templateData.message, structure.tts);
        }
      }
      returnVal = [compileAlertMarkup(eventInfo, templateData), structure];
    }
  }
  return returnVal;
}

function handleKoFiEvent(data) {
  const eventInfo = data?.event;
  let eventData = data?.data;
  let returnVal = [null, null];
  const templateData = {
    imgSrc: null,
    title: null,
    message: null,
  };

  if (eventInfo && eventData) {
    const eventStamp = getEventStamp(eventInfo);
    const structure = fetchEventVariant(
      eventInfo,
      eventData,
      eventResponseStructure[eventStamp]
    );
    if (structure) {
      // don't fire events when they are excluded
      if (checkForEventExclusions(eventInfo, eventData, structure)) {
        return returnVal;
      }

      templateData.title = replaceToken(
        selectRandomItemFromArray(
          eventData.isPublic ? structure.title : structure.anonTitle
        ),
        eventData
      );

      templateData.message = replaceToken(
        selectRandomItemFromArray(
          eventData.isPublic ? structure.message : structure.anonMessage
        ),
        eventData
      );

      if (structure.showUserMessage && eventData.message) {
        templateData.message = eventData.message;
      }

      templateData.imgSrc = selectRandomItemFromArray(structure.images);

      if (
        structure.textToSpeech &&
        structure.showUserMessage &&
        templateData.message
      ) {
        textToSpeech(templateData.message, structure.tts);
      }

      returnVal = [compileAlertMarkup(eventInfo, templateData), structure];
    }
  }
  return returnVal;
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

    updateAlertContainer(newEvent);
  }
}

function triggerAnimation(duration) {
  setTimeout(function () {
    startEndAnimation();
  }, duration ?? defaultEventDisplayTime);
}

// event to push listener data to the queue and starts the polling
function addEventToQueue(data) {
  if (DEBUG_MODE) {
    console.log("event added to queue:", data);
  }

  eventQueue.push(data);
  startQueueProcessing();
}

// animation stuff
//////////////////////

// clears out the alert info
function clearAlert() {
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.classList.remove(...alertContainer.classList);
  alertContainer.innerHTML = "";
}

function startEndAnimation() {
  document.querySelector(".alert").classList.add("bounce-out");
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
    document.querySelector(".alert").classList.remove("bounce-in");
  }
}

function attachListeners() {
  // animation listeners
  document.addEventListener("animationstart", onAnimationStart);
  document.addEventListener("animationend", hideOnAnimationEnd);

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

function setCSSVars() {
  let root = document.documentElement;

  root.addEventListener("mousemove", (e) => {
    root.style.setProperty("--primary-text-color", primaryTextColor);
    root.style.setProperty("--default-title-color", titleColor);
    root.style.setProperty("--text-shadow", textShadow);
    root.style.setProperty("--font-stack", fontStack);
    root.style.setProperty("--animate-in-speed", animateInSpeed);
    root.style.setProperty("--animate-out-speed", animateOutSpeed);
    root.style.setProperty("--img-animate-in-speed", imgAnimateInSpeed);
    root.style.setProperty("--img-animate-out-speed", imgAnimateOutSpeed);
  });
}

// Entry point for whole application. attaches the websocket listeners as
// well as the animation listeners

//https://streamerbot.github.io/client/get-started/setup << if you want custom options

const client = new StreamerbotClient({
  subscribe: "*",
  onData: (data) => {
    if (DEBUG_MODE) {
      console.log("streamerbot event:", data);
    }

    const eventName = getEventStamp(data?.event);
    if (Object.keys(eventResponseStructure).indexOf(eventName) > -1) {
      addEventToQueue(data);
    }
  },
});
