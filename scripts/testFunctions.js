function addTestPrimeGiftBombEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "GiftBomb",
    },
    data: {
      isAnonymous: false,
      gifts: 10,
      totalGifts: 0,
      subTier: 0 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestAnonGiftBombEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "GiftBomb",
    },
    data: {
      isAnonymous: true,
      gifts: 10,
      totalGifts: 0,
      subTier: 1 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestGiftBombEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "GiftBomb",
    },
    data: {
      isAnonymous: false,
      gifts: 10,
      totalGifts: 0,
      subTier: 1 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestPrimeGiftSubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "GiftSub",
    },
    data: {
      isAnonymous: false,
      totalSubsGifted: 1,
      cumulativeMonths: 4,
      monthsGifted: 1,
      fromSubBomb: false,
      subBombCount: 1,
      recipientUserId: 78788783,
      recipientUsername: "pkmnfrk",
      recipientDisplayName: "Pkmnfrk",
      subTier: 0 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestAnonGiftSubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "GiftSub",
    },
    data: {
      isAnonymous: true,
      totalSubsGifted: 1,
      cumulativeMonths: 4,
      monthsGifted: 1,
      fromSubBomb: false,
      subBombCount: 1,
      recipientUserId: 78788783,
      recipientUsername: "pkmnfrk",
      recipientDisplayName: "Pkmnfrk",
      subTier: 1 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestGiftSubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "GiftSub",
    },
    data: {
      isAnonymous: false,
      totalSubsGifted: 1,
      cumulativeMonths: 4,
      monthsGifted: 1,
      fromSubBomb: false,
      subBombCount: 1,
      recipientUserId: 78788783,
      recipientUsername: "pkmnfrk",
      recipientDisplayName: "Pkmnfrk",
      subTier: 1 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestPrimeResubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "ReSub",
    },
    data: {
      cumulativeMonths: 25,
      shareStreak: true,
      streakMonths: 1,
      subTier: 0 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      color: "#FF4500",
      emotes: [],
      message: "this is a prime resub event",
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestResubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "ReSub",
    },
    data: {
      cumulativeMonths: 25,
      shareStreak: true,
      streakMonths: 1,
      subTier: 1 /* 0 - Prime, 1 - Tier 1, 2 - Tier 2, 3 - Tier 3 */,
      color: "#FF4500",
      emotes: [],
      message: "This is a test resub event",
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1 /* 1 - Viewer, 2 - VIP, 3 - Moderator, 4 - Broadcaster  */,
    },
  });
}

function addTestPrimeSubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "Sub",
    },
    data: {
      subTier: 0,
      color: "#008D99",
      emotes: [],
      message: "This is a prime test sub event",
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1,
    },
  });
}

function addTestSubEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "Sub",
    },
    data: {
      subTier: 1,
      color: "#008D99",
      emotes: [],
      message: "This is a test sub event",
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1,
    },
  });
}

function addTestRaidEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "Raid",
    },
    data: {
      viewerCount: 42,
      profileImage:
        "https://static-cdn.jtvnw.net/jtv_user_pictures/5767966e-921a-49f4-92a8-3ae9e6c599cc-profile_image-70x70.png",
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      role: 1,
    },
  });
}

function addTestFollowEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "Follow",
    },
    data: {
      userId: 78788783,
      userName: "barrybluejeans",
      displayName: "BarryBluejeans",
      isTest: false,
    },
  });
}

function addTestCheerEvent() {
  addEventToQueue({
    timeStamp: "2024-09-24T21:45:22.9266071-04:00",
    event: {
      source: "Twitch",
      type: "Cheer",
    },
    data: {
      message: {
        internal: false,
        msgId: "0b3e6d17-745e-4025-ae1b-86fc2e410e5a",
        userId: "78788783",
        userName: "barrybluejeans",
        role: 1,
        subscriber: true,
        displayName: "BarryBluejeans",
        channel: "testchannel",
        message: "Cheer221 What are the chances this does a thing?",
        isHighlighted: false,
        isMe: false,
        isCustomReward: false,
        isAnonymous: false,
        isReply: false,
        bits: 39 * 4,
        firstMessage: false,
        hasBits: true,
        emotes: [],
        cheerEmotes: [
          {
            bits: 221,
            color: "#9c3ee8",
            type: "CheerEmote",
            name: "Cheer",
            startIndex: 0,
            endIndex: 7,
            imageUrl:
              "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/100/4.gif",
          },
        ],
        badges: [
          {
            name: "founder",
            version: "0",
            imageUrl:
              "https://static-cdn.jtvnw.net/badges/v1/511b78a9-ab37-472f-9569-457753bbe7d3/3",
          },
          {
            name: "bits-leader",
            version: "1",
            imageUrl:
              "https://static-cdn.jtvnw.net/badges/v1/8bedf8c3-7a6d-4df2-b62f-791b96a5dd31/3",
          },
        ],
        monthsSubscribed: 24,
        isTest: false,
      },
    },
  });
}
