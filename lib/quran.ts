export type QuranReference = {
  surahNumber: number;
  firstAyahNumber: number;
  lastAyahNumber?: number;
};

export type QuranQuoteSegment = {
  text: string;
  start: number;
  end: number;
};

// Conventional Arabic surah names, indexed by the canonical surah number.
// These labels are deliberately kept separate from the verse text itself.
const surahNamesArabic = [
  "",
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس",
] as const;

const arabicDigits: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

export function getQuranSurahNameArabic(surahNumber: number): string | undefined {
  return surahNamesArabic[surahNumber];
}

export function toArabicNumerals(value: number): string {
  return String(value).replace(/\d/g, (digit) => arabicDigits[digit]);
}

export function formatArabicQuranReference({
  surahNumber,
  firstAyahNumber,
  lastAyahNumber,
}: QuranReference): string | undefined {
  const surahName = getQuranSurahNameArabic(surahNumber);
  if (!surahName || firstAyahNumber < 1) {
    return undefined;
  }

  const finalAyahNumber = lastAyahNumber ?? firstAyahNumber;
  const ayahLabel =
    finalAyahNumber === firstAyahNumber
      ? `الآية ${toArabicNumerals(firstAyahNumber)}`
      : `الآيات ${toArabicNumerals(firstAyahNumber)}–${toArabicNumerals(finalAyahNumber)}`;

  return `سورة ${surahName} · ${ayahLabel}`;
}

export function quranReferencesInText(text: string): QuranReference[] {
  return [...text.matchAll(/\bQur(?:an|['’]an)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi)].map(
    (match) => ({
      surahNumber: Number(match[1]),
      firstAyahNumber: Number(match[2]),
      lastAyahNumber: match[3] ? Number(match[3]) : undefined,
    }),
  );
}

function quranReferencesWithPositions(text: string) {
  return [...text.matchAll(/\bQur(?:an|['’]an)\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi)].map(
    (match) => ({
      reference: {
        surahNumber: Number(match[1]),
        firstAyahNumber: Number(match[2]),
        lastAyahNumber: match[3] ? Number(match[3]) : undefined,
      },
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }),
  );
}

function arabicLetterCount(text: string): number {
  return (text.match(/[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FC]/gu) ?? []).length;
}

/**
 * Arabic Qur'an quotes in article bodies are followed by (or introduced by)
 * their English reference. Look ahead first because that is the predominant
 * article pattern, then fall back to the preceding two lines.
 */
export function quranReferenceNearLine(
  lines: string[],
  lineIndex: number,
): QuranReference | undefined {
  const nearbyIndexes = [
    lineIndex + 1,
    lineIndex + 2,
    lineIndex,
    lineIndex - 1,
    lineIndex - 2,
  ];

  for (const index of nearbyIndexes) {
    if (index < 0 || index >= lines.length) continue;
    const reference = quranReferencesInText(lines[index])[0];
    if (reference) return reference;
  }

  return undefined;
}

/** Finds Arabic runs that are long enough to be a quoted ayah, not a term. */
export function quranQuoteSegmentsInLine(text: string): QuranQuoteSegment[] {
  return [
    ...text.matchAll(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C\u200D\s]+/gu),
  ]
    .map((match) => ({
      text: match[0],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }))
    .filter((segment) => arabicLetterCount(segment.text) >= 8);
}

/**
 * Inline quotes use the closest Qur'an reference in the same sentence. If it
 * has none, use the same nearby-line lookup as a stand-alone quotation.
 */
export function quranReferenceForQuoteSegment(
  lines: string[],
  lineIndex: number,
  segment: QuranQuoteSegment,
): QuranReference | undefined {
  const inlineReferences = quranReferencesWithPositions(lines[lineIndex]);
  if (inlineReferences.length > 0) {
    const beforeQuote = lines[lineIndex].slice(0, segment.start);
    const followingReference = inlineReferences.find(
      (reference) => reference.start >= segment.end,
    );

    if (
      followingReference &&
      /(?:(?:the next verse|next verse)[^.\n]{0,100}|followed by[^.\n]{0,50}|then continues[^.\n]{0,50}|first (?:two )?occurrences? read[^.\n]{0,50})$/i.test(
        beforeQuote,
      )
    ) {
      return followingReference.reference;
    }

    return [...inlineReferences]
      .sort(
        (left, right) =>
          Math.min(Math.abs(left.start - segment.end), Math.abs(left.end - segment.start)) -
          Math.min(Math.abs(right.start - segment.end), Math.abs(right.end - segment.start)),
      )[0]?.reference;
  }

  return quranReferenceNearLine(lines, lineIndex);
}

export function isArabicQuranQuoteLine(text: string): boolean {
  const trimmed = text.trim();
  return (
    arabicLetterCount(trimmed) >= 8 &&
    /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C\u200D\s]+$/u.test(trimmed)
  );
}
