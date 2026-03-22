export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  reference: string;
  verses: BibleVerse[];
  translation: string;
}

export interface VerseOfTheDay {
  reference: string;
  text: string;
}
