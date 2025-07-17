export interface Style {
  titleSize: number;
  headingSpacing: number;
  paragraphSpacing: number;
  lineSpacing: number;
  // Font size options
  heading1Size?: number;
  heading2Size?: number;
  heading3Size?: number;
  heading4Size?: number;
  heading5Size?: number;
  paragraphSize?: number;
  listItemSize?: number;
  codeBlockSize?: number;
  blockquoteSize?: number;
  tocFontSize?: number;
  // TOC level-specific styling
  tocHeading1FontSize?: number;
  tocHeading2FontSize?: number;
  tocHeading3FontSize?: number;
  tocHeading4FontSize?: number;
  tocHeading5FontSize?: number;
  tocHeading1Bold?: boolean;
  tocHeading2Bold?: boolean;
  tocHeading3Bold?: boolean;
  tocHeading4Bold?: boolean;
  tocHeading5Bold?: boolean;
  tocHeading1Italic?: boolean;
  tocHeading2Italic?: boolean;
  tocHeading3Italic?: boolean;
  tocHeading4Italic?: boolean;
  tocHeading5Italic?: boolean;
  // Alignment options
  paragraphAlignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  headingAlignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  heading1Alignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  heading2Alignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  heading3Alignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  heading4Alignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  heading5Alignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  blockquoteAlignment?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
}

export interface Options {
  documentType?: "document" | "report";
  style?: Style;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ProcessedContent {
  children: any[];
  skipLines: number;
}

export interface HeadingConfig {
  level: number;
  size: number;
  style?: string;
  alignment?: any;
}

export interface ListItemConfig {
  text: string;
  boldText?: string;
  isNumbered?: boolean;
  listNumber?: number;
  sequenceId?: number;
}

export const defaultStyle: Style = {
  titleSize: 32,
  headingSpacing: 240,
  paragraphSpacing: 240,
  lineSpacing: 1.15,
  // Default font sizes
  heading1Size: 32,
  heading2Size: 28,
  heading3Size: 24,
  heading4Size: 20,
  heading5Size: 18,
  paragraphSize: 24,
  listItemSize: 24,
  codeBlockSize: 20,
  blockquoteSize: 24,
  // Default alignments
  paragraphAlignment: "LEFT",
  heading1Alignment: "LEFT",
  heading2Alignment: "LEFT",
  heading3Alignment: "LEFT",
  heading4Alignment: "LEFT",
  heading5Alignment: "LEFT",
  blockquoteAlignment: "LEFT",
  headingAlignment: "LEFT",
};

export const headingConfigs: Record<number, HeadingConfig> = {
  1: { level: 1, size: 0, style: "Title" },
  2: { level: 2, size: 0, style: "Heading2" },
  3: { level: 3, size: 0 },
  4: { level: 4, size: 0 },
  5: { level: 5, size: 0 },
};
