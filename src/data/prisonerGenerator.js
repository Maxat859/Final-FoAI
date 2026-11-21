export const DEFAULT_SEED = 2026;
export const DEFAULT_TOTAL_COUNT = 1000;
export const DEFAULT_FALLBACK_PORTRAIT = "portrait.default";
export const DEFAULT_AVAILABLE_PORTRAITS = Object.freeze([
  "portrait.default",
  "portrait.erasyl"
]);

const FIRST_NAMES = Object.freeze([
  "Абай", "Адиль", "Айбек", "Айдар", "Акжол", "Али", "Алмас", "Амир",
  "Ануар", "Арсен", "Арыстан", "Асет", "Бахтияр", "Бейбит", "Бек", "Берик",
  "Галым", "Дамир", "Дарын", "Даулет", "Даурен", "Досжан", "Елдос", "Ербол",
  "Ерлан", "Ермек", "Ернар", "Ерсин", "Жанат", "Жангир", "Жасулан", "Заңғар",
  "Ислам", "Канат", "Кенес", "Куат", "Мадияр", "Максат", "Медет", "Мурат",
  "Мухтар", "Нариман", "Нурбол", "Нурдаулет", "Нуржан", "Нурсултан", "Рауан", "Ринат",
  "Сабит", "Самат", "Султан", "Талгат", "Темирлан", "Толеген", "Улан", "Чингиз",
  "Шалкар", "Шынгыс", "Айдана", "Айжан", "Айнур", "Айсулу", "Акбота", "Акерке",
  "Алтынай", "Амина", "Арайлым", "Аружан", "Асель", "Асем", "Ботагоз", "Гаухар",
  "Гульназ", "Дана", "Жанар", "Жанель", "Жулдыз", "Зарина", "Индира", "Камила",
  "Карлыгаш", "Лаура", "Малика", "Меруерт", "Назерке", "Перизат", "Салтанат", "Томирис"
]);

const LAST_NAME_INITIALS = Object.freeze([
  "А.", "Б.", "В.", "Г.", "Д.", "Е.", "Ж.", "З.", "И.", "К.",
  "М.", "Н.", "О.", "Р.", "С.", "Т.", "У.", "Ш."
]);

const BLOCKS = Object.freeze(["A", "B", "C", "D"]);
const STATUSES = Object.freeze(["active", "active", "active", "active", "under_review", "restricted"]);

export const DEFAULT_CHARACTERS = {
  "main": [
    {
      "id": "Q-01047",
      "displayName": "Ерасыл",
      "roleTier": "main",
      "portraitAssetId": "portrait.erasyl",
      "spriteId": "character.player.erasyl",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4001",
        "EVT-4002"
      ],
      "riskAssessment": {
        "label": "HIGH",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-14:20",
      "storyFlags": {
        "hasSeenOwnFile": false,
        "isPlayer": true
      }
    },
    {
      "id": "Q-01002",
      "displayName": "Арман",
      "roleTier": "main",
      "portraitAssetId": "portrait.arman",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4003"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-10:15",
      "storyFlags": {
        "talkedToPlayer": false,
        "roleHint": "mentor"
      }
    },
    {
      "id": "Q-01003",
      "displayName": "Руслан",
      "roleTier": "main",
      "portraitAssetId": "portrait.ruslan",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4004",
        "EVT-4005"
      ],
      "riskAssessment": {
        "label": "MEDIUM",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-11:40",
      "storyFlags": {
        "talkedToPlayer": false,
        "roleHint": "informant"
      }
    },
    {
      "id": "Q-01004",
      "displayName": "Данияр",
      "roleTier": "main",
      "portraitAssetId": "portrait.daniyar",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4006"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-09:30",
      "storyFlags": {
        "talkedToPlayer": false,
        "roleHint": "technician"
      }
    },
    {
      "id": "Q-01005",
      "displayName": "Тимур",
      "roleTier": "main",
      "portraitAssetId": "portrait.timur",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "under_review",
      "observations": [
        "EVT-4007",
        "EVT-4008"
      ],
      "riskAssessment": {
        "label": "HIGH",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-13:05",
      "storyFlags": {
        "talkedToPlayer": false,
        "roleHint": "archive_witness"
      }
    },
    {
      "id": "Q-01006",
      "displayName": "Мадина",
      "roleTier": "main",
      "portraitAssetId": "portrait.madina",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4009"
      ],
      "riskAssessment": {
        "label": "MEDIUM",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-12:50",
      "storyFlags": {
        "talkedToPlayer": false,
        "roleHint": "system_analyst"
      }
    }
  ],
  "secondary": [
    {
      "id": "Q-01007",
      "displayName": "Нурлан",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_2",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4011"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-11:07",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01008",
      "displayName": "Асхат",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_3",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "active",
      "observations": [
        "EVT-4012"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-12:14",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01009",
      "displayName": "Бауыржан",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_4",
      "spriteId": "character.prisoner.default",
      "blockId": "D",
      "status": "active",
      "observations": [
        "EVT-4013"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-13:21",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01010",
      "displayName": "Саят",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_1",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4014"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-14:28",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01011",
      "displayName": "Алишер",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_2",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4015"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-15:35",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01012",
      "displayName": "Бекзат",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_3",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "active",
      "observations": [
        "EVT-4016"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-16:42",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01013",
      "displayName": "Кайрат",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_4",
      "spriteId": "character.prisoner.default",
      "blockId": "D",
      "status": "active",
      "observations": [
        "EVT-4017"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-17:49",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01014",
      "displayName": "Ержан",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_1",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4018"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-18:56",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01015",
      "displayName": "Олжас",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_2",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4019"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-19:03",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01016",
      "displayName": "Серик",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_3",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "active",
      "observations": [
        "EVT-4020"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-10:10",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01017",
      "displayName": "Мирас",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_4",
      "spriteId": "character.prisoner.default",
      "blockId": "D",
      "status": "active",
      "observations": [
        "EVT-4021"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-11:17",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01018",
      "displayName": "Айдос",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_1",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4022"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-12:24",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01019",
      "displayName": "Жандос",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_2",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4023"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-13:31",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01020",
      "displayName": "Куаныш",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_3",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "active",
      "observations": [
        "EVT-4024"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-14:38",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01021",
      "displayName": "Марат",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_4",
      "spriteId": "character.prisoner.default",
      "blockId": "D",
      "status": "active",
      "observations": [
        "EVT-4025"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-15:45",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01022",
      "displayName": "Диас",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_1",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4026"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-16:52",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01023",
      "displayName": "Азамат",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_2",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4027"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-17:59",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01024",
      "displayName": "Санжар",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_3",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "active",
      "observations": [
        "EVT-4028"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-18:06",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01025",
      "displayName": "Ильяс",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_4",
      "spriteId": "character.prisoner.default",
      "blockId": "D",
      "status": "active",
      "observations": [
        "EVT-4029"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-19:13",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01026",
      "displayName": "Рамазан",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_1",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4030"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-10:20",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01027",
      "displayName": "Айгуль",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_2",
      "spriteId": "character.prisoner.default",
      "blockId": "B",
      "status": "active",
      "observations": [
        "EVT-4031"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-11:27",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01028",
      "displayName": "Алия",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_3",
      "spriteId": "character.prisoner.default",
      "blockId": "C",
      "status": "active",
      "observations": [
        "EVT-4032"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-2-12:34",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01029",
      "displayName": "Динара",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_4",
      "spriteId": "character.prisoner.default",
      "blockId": "D",
      "status": "active",
      "observations": [
        "EVT-4033"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-3-13:41",
      "storyFlags": {
        "hasShortDialogue": true
      }
    },
    {
      "id": "Q-01030",
      "displayName": "Сауле",
      "roleTier": "secondary",
      "portraitAssetId": "portrait.npc_1",
      "spriteId": "character.prisoner.default",
      "blockId": "A",
      "status": "active",
      "observations": [
        "EVT-4034"
      ],
      "riskAssessment": {
        "label": "LOW",
        "modelVersion": "pending-tree"
      },
      "lastUpdatedAt": "game-day-1-14:48",
      "storyFlags": {
        "hasShortDialogue": true
      }
    }
  ]
};

export function createSeededRng(seed = DEFAULT_SEED) {
  let state = (Number(seed) >>> 0) || 1;
  return function nextRandom() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

export function extractPortraitIdsFromManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || !manifest.sprites) {
    return [...DEFAULT_AVAILABLE_PORTRAITS];
  }
  const ids = Object.keys(manifest.sprites).filter((id) => id.startsWith("portrait."));
  return ids.length > 0 ? ids : [...DEFAULT_AVAILABLE_PORTRAITS];
}

export function resolvePortraitId(
  preferredId,
  availablePortraits = DEFAULT_AVAILABLE_PORTRAITS,
  fallbackPortrait = DEFAULT_FALLBACK_PORTRAIT,
  rng = null
) {
  const validSet = new Set(availablePortraits);

  if (preferredId && validSet.has(preferredId)) {
    return preferredId;
  }

  const reusablePool = availablePortraits.filter((id) => id !== "portrait.erasyl");
  if (reusablePool.length > 0 && rng) {
    return pickOne(reusablePool, rng);
  }

  if (validSet.has(fallbackPortrait)) {
    return fallbackPortrait;
  }

  return availablePortraits[0] || DEFAULT_FALLBACK_PORTRAIT;
}

function cloneBaseCharacter(raw, availablePortraits, fallbackPortrait, rng) {
  return {
    id: String(raw.id),
    displayName: String(raw.displayName),
    roleTier: raw.roleTier,
    portraitAssetId: resolvePortraitId(raw.portraitAssetId, availablePortraits, fallbackPortrait, rng),
    spriteId: raw.spriteId || "character.prisoner.default",
    blockId: raw.blockId || "A",
    status: raw.status || "active",
    observations: Array.isArray(raw.observations) ? [...raw.observations] : [],
    riskAssessment: raw.riskAssessment
      ? { ...raw.riskAssessment }
      : { label: "LOW", modelVersion: "pending-tree" },
    lastUpdatedAt: raw.lastUpdatedAt || "game-day-1-08:00",
    storyFlags: raw.storyFlags ? { ...raw.storyFlags } : {}
  };
}

export function generatePrisoners(options = {}) {
  const {
    seed = DEFAULT_SEED,
    totalCount = DEFAULT_TOTAL_COUNT,
    characters = DEFAULT_CHARACTERS,
    manifest = null,
    availablePortraits = manifest
      ? extractPortraitIdsFromManifest(manifest)
      : DEFAULT_AVAILABLE_PORTRAITS,
    fallbackPortrait = DEFAULT_FALLBACK_PORTRAIT
  } = options;

  const rng = createSeededRng(seed);
  const mainList = Array.isArray(characters?.main) ? characters.main : [];
  const secondaryList = Array.isArray(characters?.secondary) ? characters.secondary : [];

  const prisoners = [];
  const usedIds = new Set();

  for (const raw of mainList) {
    const profile = cloneBaseCharacter(raw, availablePortraits, fallbackPortrait, rng);
    if (!usedIds.has(profile.id)) {
      usedIds.add(profile.id);
      prisoners.push(profile);
    }
  }

  for (const raw of secondaryList) {
    const profile = cloneBaseCharacter(raw, availablePortraits, fallbackPortrait, rng);
    if (!usedIds.has(profile.id)) {
      usedIds.add(profile.id);
      prisoners.push(profile);
    }
  }

  const backgroundNeeded = Math.max(0, totalCount - prisoners.length);
  let seqNumber = 1;
  let eventCounter = 5000;

  for (let i = 0; i < backgroundNeeded; i++) {
    let id;
    do {
      id = `Q-${String(seqNumber).padStart(5, "0")}`;
      seqNumber += 1;
    } while (usedIds.has(id));
    usedIds.add(id);

    const firstName = pickOne(FIRST_NAMES, rng);
    const lastInitial = pickOne(LAST_NAME_INITIALS, rng);
    const blockId = pickOne(BLOCKS, rng);
    const status = pickOne(STATUSES, rng);

    const obsCount = Math.floor(rng() * 4);
    const observations = [];
    for (let k = 0; k < obsCount; k++) {
      eventCounter += 1;
      observations.push(`EVT-${eventCounter}`);
    }

    const day = 1 + Math.floor(rng() * 3);
    const hour = String(Math.floor(rng() * 24)).padStart(2, "0");
    const minute = String(Math.floor(rng() * 60)).padStart(2, "0");

    prisoners.push({
      id,
      displayName: `${firstName} ${lastInitial}`,
      roleTier: "background",
      portraitAssetId: resolvePortraitId(null, availablePortraits, fallbackPortrait, rng),
      spriteId: "character.prisoner.default",
      blockId,
      status,
      observations,
      riskAssessment: {
        label: "LOW",
        modelVersion: "pending-tree"
      },
      lastUpdatedAt: `game-day-${day}-${hour}:${minute}`,
      storyFlags: {}
    });
  }

  return prisoners;
}

export function findPrisonerById(prisoners, id) {
  if (!Array.isArray(prisoners) || !id) {
    return null;
  }
  const target = String(id).trim().toUpperCase();
  return prisoners.find((p) => String(p.id).toUpperCase() === target) || null;
}

export function validatePrisonerDataset(
  prisoners,
  availablePortraits = DEFAULT_AVAILABLE_PORTRAITS
) {
  const errors = [];
  const validPortraits = new Set(availablePortraits);
  const seenIds = new Set();
  const counts = { total: 0, main: 0, secondary: 0, background: 0 };

  if (!Array.isArray(prisoners)) {
    return { valid: false, errors: ["prisoners must be an array"], counts };
  }

  counts.total = prisoners.length;
  if (prisoners.length !== 1000) {
    errors.push(`Expected 1000 prisoners, got ${prisoners.length}`);
  }

  const requiredFields = [
    "id",
    "displayName",
    "roleTier",
    "blockId",
    "status",
    "portraitAssetId",
    "observations",
    "riskAssessment",
    "lastUpdatedAt",
    "storyFlags"
  ];

  for (const p of prisoners) {
    for (const field of requiredFields) {
      if (!(field in p)) {
        errors.push(`Missing field "${field}" in prisoner ${p?.id}`);
      }
    }

    if (seenIds.has(p.id)) {
      errors.push(`Duplicate ID detected: ${p.id}`);
    }
    seenIds.add(p.id);

    if (p.roleTier in counts) {
      counts[p.roleTier] += 1;
    } else {
      errors.push(`Unknown roleTier "${p.roleTier}" in ${p.id}`);
    }

    if (!validPortraits.has(p.portraitAssetId)) {
      errors.push(`Invalid portraitAssetId "${p.portraitAssetId}" in ${p.id}`);
    }

    if (!Array.isArray(p.observations)) {
      errors.push(`observations must be an array in ${p.id}`);
    }
  }

  if (counts.main !== 6) errors.push(`Expected 6 main, got ${counts.main}`);
  if (counts.secondary !== 24) errors.push(`Expected 24 secondary, got ${counts.secondary}`);
  if (counts.background !== 970) errors.push(`Expected 970 background, got ${counts.background}`);

  return {
    valid: errors.length === 0,
    errors,
    counts
  };
}
