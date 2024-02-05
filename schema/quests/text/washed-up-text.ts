export const questEvents = {
  // player walks into water
  // they die and receive this messages
  wakeUp: [
    "You wake up.",
    "How long were you out?",
    "Your clothes are still damp with sea water. The sound of the waves crashing almost jogs your memory for a moment, but it's all a blur.",
    "There's a port nearby, maybe the fishermen there can help.",
  ],

  // ** DOCKS **

  // went to Valtham Landing first, needs to go anywhere else
  startingDock: [
    "You find your way to Valtham Landing and ask about the water",
    "\"Unless ye got f'kin gills I can't see much how y'd survive those waters.\"",
    "It's hard to understand the old fisherman through his thick drawl",
    "\"I can get ye aroun' tho, me brothers too. Pay yer fee and we'll get ya there safe.\"",
  ],
  // dock fetch quests
  docks: [
    // at "any dock other than VL", no fetch quest active yet
    [
      "You walk up to the dock and begin asking the fisherman about the waters --",
      '"Have you talked to my brother in Valtham Landing yet?"',
      "The fisherman seems to have no interest in your queries.",
      '"Listen, take this to him for me, will you?"',
      " ",
      "He hands you an Old Boot",
    ],
    // at Valtham Landing, received item from "any dock other than VL"
    [
      '"MY BOOT!"',
      "The old fisherman rapidly waddles towards you, his one boot stomps loudly with every other step.",
      '"Thank you, my brothers and I have been searching for this for ages..."',
      "He struggles the boot onto his bare foot, looks at it for a moment,",
      '"It\'s not the one."',
      "He rips it off and throws it into the water.",
      '"Thanks for trying though! While I have your attention, can you bring this to my other brother in Boatwright? He works at the docks there. Take this, too, I don\'t need it."',
      " ",
      "You receive an Old Pocket Watch",
    ],
    // at Boatwright Docks, received item from Valtham Landing
    [
      '"mmm, yes, that is my pocket watch."',
      "...",
      "\"you're still here? there's no jobs open right now.\"",
      " ",
      '"rlright, take this to my brother in Northern Point"',
      " ",
      "He hands you an Old Fishing Rod",
      " ",
      '"reward? yeah I guess... take this too, clean it up a little and maybe it\'ll be useful."',
    ],
    // at Northern Point, received item from Boatwright Docks
    [
      '"Oh, this thing."',
      '"Yup."',
      '"That\'s my fishing rod."',
      '"Well, I guess you got a good thing going for you here, take this to my brother in Sherlam Landing."',
      " ",
      "He takes the Old Fishing Rod and hands you an Old Fishing Book.",
    ],
    // at Sherlam Landing, received item from Northern Point
    [
      "The fisherman stares you directly in the eyes.",
      "He slowly takes the book from you, flips through it a few times",
      " ",
      'He hands you an Old Walking Stick and says "Rotherham"',
    ],
    // at Rotherham Docks, received item from Sherlam Landing
    [
      "The fisherman brother at Rotherham is rather busy, it takes some time to find him.",
      " ",
      '"Ah, this old thing... My brother must have sent you; this was our father\'s."',
      "\"Can you do one last favor? My brother out in Canogeo Harbor, he's a big drinker, bring him this Old Coin",
    ],
    // at Canogeo Harbor, received item from Rotherham Docks
    [
      "The fisherman brother takes the coin from you.",
      " ",
      '"I heard about all the traveling you\'ve been doing."',
      " ",
      '"How about you come out drinking with me tonight? I know a great place nearby!"',
      " ",
      '"Meet me at the The Hidden Stump Inn, you can find it 42, 32"',
    ],
  ],

  // Done with docks quests,
  // last fisherman brings player back to a bar

  // meet brewconia
  brewconia: [
    '"You look new here,"',
    "A stunning half elf in fine gemstoned bardic wear looks you up and down.",
    '"I\'m Brewconia, this is Droop."',
    "A goblin wearing a finely tailored but well stained suit pokes out from behind her legs.",
    '"Let me get a round for you, and you can get the next 2..."',
    "She entertains and dazzles the whole pub, performing with her goblin sidekick and singing fantastical tales of demons, vampires, and legends from far away.",
    "You drink, sing, and laugh for hours.",
    "Brewconia, however, is long gone before you realize the goblin robbed your coin purse.",
    'Perhaps you should "interrogate" some Hobgoblins to track him down.',
  ],

  // already has ocean bubble, upgraded class, gets aqua lungs
  aquaLungs: [
    "The magic bubble that's been following you around reacts your power.",
    "It begins to orbit you rapidly as it transforms into a self contained apparatus",
    "The transformed bubble attaches itself to you.",
    "You may now travel in water.",
  ],
};
