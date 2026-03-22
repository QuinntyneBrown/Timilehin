export interface DevotionalSummary {
  id: number;
  title: string;
  date: string;
  scriptureReference: string;
  excerpt: string;
}

export interface DevotionalDetail {
  id: number;
  title: string;
  date: string;
  scriptureReference: string;
  reflectionText: string;
  prayerPrompt: string;
}

export interface CreateDevotional {
  title: string;
  date: string;
  scriptureReference: string;
  reflectionText: string;
  prayerPrompt: string;
}

export interface UpdateDevotional {
  title?: string;
  date?: string;
  scriptureReference?: string;
  reflectionText?: string;
  prayerPrompt?: string;
}
