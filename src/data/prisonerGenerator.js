/*
 * 1 000 вымышленных досье для игрового мира QAMAL.
 * Не создаём AI-метки из имени или внешности.
 * Внешний файл assets/manifest.json находится у участника №4.
 */

function createRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state += 0x6D2B79F5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const FIRST_NAMES = [
    "Алихан", "Бекзат", "Нурлан", "Ербол", "Марат",
    "Тимур", "Айдын", "Руслан", "Ержан", "Саян",
    "Арсен", "Данияр", "Аскар", "Жандос", "Серик"
];
const LAST_NAMES = [
    "Садыков", "Омаров", "Иманов", "Сериков", "Абдрахманов",
    "Есенов", "Каримов", "Ахметов", "Тулегенов", "Мусин"
];
const BLOCKS = ["A", "B", "C", "D"];

const DEFAULT_MAIN = ["Ерасыл", "Арман", "Руслан", "Данияр", "Самат", "Мирас"];
const DEFAULT_SUPPORTING = [
    "Асылбек", "Батыр", "Ермек", "Серик", "Азамат", "Ислам",
    "Кайрат", "Аман", "Талгат", "Даулет", "Рауан", "Алишер",
    "Бекарыс", "Ерлан", "Жасулан", "Мурат", "Нурбол", "Олжас",
    "Ринат", "Санжар", "Тимур", "Улан", "Шынгыс", "Эльдар"
];

function makeProfile(index, tier, name, portraitAssetId, random) {
    return {
        id: "Q-" + String(1001 + index).padStart(5, "0"),
        displayName: name,
        roleTier: tier,
        portraitAssetId,
        blockId: BLOCKS[Math.floor(random() * BLOCKS.length)],
        status: "active",
        observations: [],
        riskAssessment: { label: null, modelVersion: null },
        lastUpdatedAt: "game-day-1-00:00",
        storyFlags: tier === "main" ? { hasSeenOwnFile: false } : {}
    };
}

/*
 * Параметры:
 * seed - одинаковое число даёт одинаковые 1000 профилей.
 * portraitAssetIds - список РЕАЛЬНЫХ ID из assets/manifest.json.
 * charactersConfig - необязательное содержимое data/characters.json.
 */
export function generatePrisoners(options = {}) {
    const {
        seed = 2026,
        portraitAssetIds = ["portrait.default"],
        charactersConfig = {
            main: DEFAULT_MAIN.map((displayName) => ({ displayName })),
            supporting: DEFAULT_SUPPORTING.map((displayName) => ({ displayName }))
        }
    } = options;

    if (!Array.isArray(portraitAssetIds) || portraitAssetIds.length === 0) {
        throw new Error("Нужно передать существующие portraitAssetIds от участника №4");
    }
    if (charactersConfig?.main?.length !== 6
        || charactersConfig?.supporting?.length !== 24) {
        throw new Error("Нужно 6 сюжетных и 24 второстепенных персонажа");
    }

    const random = createRandom(seed);
    const profiles = [];

    for (let index = 0; index < 1000; index++) {
        const roleTier = index < 6 ? "main"
            : index < 30 ? "supporting" : "background";
        const config = roleTier === "main" ? charactersConfig.main[index]
            : roleTier === "supporting" ? charactersConfig.supporting[index - 6]
                : null;
        const name = config?.displayName ?? (
            FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)] + " "
            + LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]
        );
        const preferred = config?.portraitAssetId;
        // Сюжетный ID используется только тогда, когда он есть в каталоге.
        const portraitAssetId = portraitAssetIds.includes(preferred)
            ? preferred
            : portraitAssetIds[Math.floor(random() * portraitAssetIds.length)];

        profiles.push(makeProfile(index, roleTier, name, portraitAssetId, random));
    }

    return profiles;
}

// Проверка манифеста на этапе интеграции с графикой №4.
export function validatePortraitLinks(profiles, assetManifest) {
    const available = new Set(Object.keys(assetManifest?.sprites ?? {}));
    const missing = [...new Set(profiles
        .map((profile) => profile.portraitAssetId)
        .filter((id) => !available.has(id)))];
    return { valid: missing.length === 0, missing };
}
