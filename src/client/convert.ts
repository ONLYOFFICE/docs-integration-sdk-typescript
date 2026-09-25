/** Red, green and blue components, each 0–255. */
export type RgbColor = readonly [number, number, number];

/** Column separator for CSV input: none, tab, semicolon, colon, comma or space. */
export type CsvDelimiter = 0 | 1 | 2 | 3 | 4 | 5;

/** How a PDF, XPS or OXPS page is split into text blocks while it is read. */
export type TextAssociation = "blockChar" | "blockLine" | "plainLine" | "plainParagraph";

/** Layout of a form printed to PDF or to an image. */
export interface DocumentLayout {
  drawPlaceHolders?: boolean;
  drawFormHighlight?: boolean;
  /** Render as if printed, DOCX to PDF only. Default: `false`. */
  isPrint?: boolean;
}

/** How a PDF, XPS or OXPS source document is read. */
export interface DocumentRenderer {
  /** Text splitting mode. Default: `"plainLine"`. */
  textAssociation?: TextAssociation;
}

/** PDF output settings. */
export interface PdfOptions {
  /** Produce a fillable PDF form rather than a plain PDF. */
  form?: boolean;
}

/** Size of a page, in CSS-like units such as `"210mm"`. */
export interface PageSize {
  /** Default: `"297mm"`. */
  height?: string;
  /** Default: `"210mm"`. */
  width?: string;
}

/** Page margins, in CSS-like units such as `"17.8mm"`. */
export interface PageMargins {
  /** Default: `"19.1mm"`. */
  bottom?: string;
  /** Default: `"17.8mm"`. */
  left?: string;
  /** Default: `"17.8mm"`. */
  right?: string;
  /** Default: `"19.1mm"`. */
  top?: string;
}

/**
 * Layout used when a spreadsheet is converted to PDF or to an image.
 *
 * At most 1500 pages are produced in a single conversion.
 */
export interface SpreadsheetLayout {
  /** Height of the converted area, in pages. `0` leaves it unbounded. Default: `0`. */
  fitToHeight?: number;
  /** Width of the converted area, in pages. `0` leaves it unbounded. Default: `0`. */
  fitToWidth?: number;
  /** Keep the grid lines. Default: `false`. */
  gridLines?: boolean;
  /** Keep the row and column headings. Default: `false`. */
  headings?: boolean;
  /** Convert the whole sheet rather than its print area. Default: `true`. */
  ignorePrintArea?: boolean;
  margins?: PageMargins;
  /** Default: `"portrait"`. */
  orientation?: "landscape" | "portrait";
  pageSize?: PageSize;
  /** Scale of the output, in percent. Default: `100`. */
  scale?: number;
}

/** Settings for an image output format: BMP, GIF, JPG or PNG. */
export interface Thumbnail {
  /**
   * How the page is fitted into the frame: `0` stretches it, `1` keeps the aspect
   * ratio, `2` ignores width and height and renders at 96 dpi. Default: `2`.
   */
  aspect?: 0 | 1 | 2;
  /** Render only the first page rather than every page. Default: `true`. */
  first?: boolean;
  /** Height in pixels. Default: `100`. */
  height?: number;
  /** Width in pixels. Default: `100`. */
  width?: number;
}

/** A styled piece of watermark text. */
export interface WatermarkRun {
  bold?: boolean;
  /** Highlight of the text, in RGB. */
  fill?: RgbColor;
  /** Font name, such as `"Arial"`. */
  "font-family"?: string;
  /** Font size in points. */
  "font-size"?: string | number;
  italic?: boolean;
  strikeout?: boolean;
  /** The text itself. `<%br%>` starts a new line. */
  text?: string;
  underline?: boolean;
}

/** A line of watermark text. */
export interface WatermarkParagraph {
  /** Horizontal alignment: `0` right, `1` left, `2` center, `3` justified. */
  align?: 0 | 1 | 2 | 3;
  /** Highlight of the paragraph, in RGB. */
  fill?: RgbColor;
  linespacing?: number;
  runs?: WatermarkRun[];
}

/** Watermark stamped onto a PDF or image output. */
export interface Watermark {
  /** Vertical alignment: `0` bottom, `1` center, `4` top. */
  align?: 0 | 1 | 4;
  /** Fill color in RGB, or the URL of an image — a `data:` URL included. */
  fill?: RgbColor | string;
  /** Height in millimeters. */
  height?: number;
  /** Margins around the text, in millimeters. */
  margins?: readonly number[];
  paragraphs?: WatermarkParagraph[];
  /** Rotation angle in degrees. */
  rotate?: number;
  /** Stroke color in RGB. */
  stroke?: RgbColor;
  /** Stroke width in millimeters. */
  "stroke-width"?: number;
  /** Opacity of the watermark, from `0` to `1`. */
  transparent?: number;
  /** Preset shape geometry, such as `"rect"`. */
  type?: string;
  /** Width in millimeters. */
  width?: number;
}

/** Body of a request to the conversion service. */
export interface ConvertRequest {
  /**
   * Return as soon as the conversion is queued instead of waiting for it. Repeat the
   * same request unchanged to collect the result. Default: `false`.
   */
  async?: boolean;
  /**
   * Encoding of a CSV or TXT source document, as a code page number: `1251` Cyrillic,
   * `65001` UTF-8, and so on.
   */
  codePage?: number;
  /** Column separator of a CSV source document. */
  delimiter?: CsvDelimiter;
  documentLayout?: DocumentLayout;
  documentRenderer?: DocumentRenderer;
  /** Extension of the source document, without the dot. */
  filetype: string;
  /** Identifier of the source document. A new key forces a new conversion. */
  key: string;
  /** Extension of the target format, or `"ooxml"` or `"odf"` to pick it by family. */
  outputtype: string;
  /** Password of a protected source document. The converted file has none. */
  password?: string;
  pdf?: PdfOptions;
  /** Locale for the currency and date formats of a spreadsheet. Default: `"en-US"`. */
  region?: string;
  spreadsheetLayout?: SpreadsheetLayout;
  thumbnail?: Thumbnail;
  /** Name of the converted file, extension included. */
  title?: string;
  /** JWT signature of this body. Required once the document server has a secret. */
  token?: string;
  /** Absolute URL the document server downloads the source document from. */
  url: string;
  watermark?: Watermark;
}

/**
 * Body of a request to convert a document sent along with it, rather than one the
 * document server downloads from `url`.
 *
 * `title` names the converted file, which the answer carries in its `Content-Disposition`.
 */
export type ConvertFileRequest = Omit<ConvertRequest, "key" | "url"> & {
  /**
   * Identifier of the source document. The service makes one up when it is left out, which
   * leaves an `async` conversion nothing to be asked for again by.
   */
  key?: string;
};

/**
 * What a conversion of a document sent along with the request answers: the converted file,
 * or, while an `async` one is still running, how far it has got.
 */
export type ConvertFileResult =
  | {
      endConvert: false;
      /** Progress of the conversion, in percent. */
      percent: number;
    }
  | {
      endConvert: true;
      /** The converted file, unread, so a large one can be streamed. */
      file: Response;
    };

/**
 * Why a conversion failed:
 *
 * - `-1` unknown error
 * - `-2` conversion timeout
 * - `-3` conversion error
 * - `-4` error while downloading the source document
 * - `-5` incorrect password
 * - `-6` error while accessing the conversion result database
 * - `-7` input error
 * - `-8` invalid token
 * - `-9` the output format is ambiguous and has to be named explicitly
 * - `-10` size limit exceeded
 *
 * A code the service does not document stays a number of its own rather than being forced
 * into the union, so a `switch` over it is never exhaustive.
 */
export type ConversionErrorCode = -1 | -2 | -3 | -4 | -5 | -6 | -7 | -8 | -9 | -10 | (number & {});

/**
 * Body of a response from the conversion service.
 *
 * Either the conversion reports its progress or it reports an `error`, so a body that
 * carries a code carries nothing else.
 */
export interface ConvertResponse {
  /** Whether the conversion has finished. */
  endConvert?: boolean;
  error?: ConversionErrorCode;
  /** Extension of the converted file. */
  fileType?: string;
  /** URL of the converted file. Present once the conversion has finished. */
  fileUrl?: string;
  /** Progress of the conversion, in percent. */
  percent?: number;
}
