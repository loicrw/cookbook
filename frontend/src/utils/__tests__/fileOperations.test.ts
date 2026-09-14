import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { DATA_VERSION } from "../../constants/storage";
import {
  RECIPE_TEMPLATE,
  RECIPE_TEMPLATE_FILE_NAME,
} from "../../constants/recipeTemplate";
import { Recipe } from "../../types/app";
import {
  exportRecipeTemplate,
  exportRecipes,
  importRecipes,
} from "../fileOperations";
import { RecipeParseError } from "../recipes";

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

const picker = DocumentPicker.getDocumentAsync as jest.Mock;
const readFile = FileSystem.readAsStringAsync as jest.Mock;
const writeFile = FileSystem.writeAsStringAsync as jest.Mock;
const sharingAvailable = Sharing.isAvailableAsync as jest.Mock;
const share = Sharing.shareAsync as jest.Mock;

const recipe: Recipe = {
  description: "",
  id: "r1",
  ingredients: [{ amount: 1, name: "flour", unit: "g" }],
  people_served: 2,
  steps: [{ description: "Bake", order: 1 }],
  times_cooked: 0,
  title: "Bread",
};

/** The platform is read at call time, so a test can pick which path runs. */
const originalPlatform = Platform.OS;
function setPlatform(os: typeof Platform.OS): void {
  (Platform as { OS: typeof Platform.OS }).OS = os;
}

/** Stands in for the browser APIs the web download path reaches for. */
function stubWebGlobals() {
  const anchor = {
    click: jest.fn(),
    remove: jest.fn(),
    download: "",
    href: "",
  };
  const blobs: { parts: string[]; type?: string }[] = [];

  const globals = globalThis as Record<string, any>;
  const saved = {
    Blob: globals.Blob,
    URL: globals.URL,
    document: globals.document,
  };

  globals.Blob = class {
    constructor(parts: string[], options?: { type?: string }) {
      blobs.push({ parts, type: options?.type });
    }
  };
  globals.URL = {
    createObjectURL: jest.fn(() => "blob:cookbook"),
    revokeObjectURL: jest.fn(),
  };
  globals.document = {
    body: { appendChild: jest.fn() },
    createElement: jest.fn(() => anchor),
  };

  return {
    anchor,
    blobs,
    get createObjectURL() {
      return globals.URL.createObjectURL as jest.Mock;
    },
    get revokeObjectURL() {
      return globals.URL.revokeObjectURL as jest.Mock;
    },
    get appendChild() {
      return globals.document.body.appendChild as jest.Mock;
    },
    restore() {
      globals.Blob = saved.Blob;
      globals.URL = saved.URL;
      globals.document = saved.document;
    },
  };
}

// Exported files are named after the day they were written, so the clock is
// pinned rather than the filename being matched loosely.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-09-14T10:30:00.000Z") });
});

afterEach(() => {
  jest.useRealTimers();
  setPlatform(originalPlatform);
});

describe("exportRecipes", () => {
  it("refuses to write a file with nothing in it", async () => {
    await expect(exportRecipes([])).rejects.toThrow(
      "There are no recipes to export yet."
    );
  });

  describe("on web", () => {
    let web: ReturnType<typeof stubWebGlobals>;

    beforeEach(() => {
      setPlatform("web");
      web = stubWebGlobals();
    });

    afterEach(() => web.restore());

    it("downloads the cookbook, stamped and dated", async () => {

      await exportRecipes([recipe]);

      expect(web.blobs).toHaveLength(1);
      expect(web.blobs[0].type).toBe("application/json");
      expect(JSON.parse(web.blobs[0].parts[0])).toEqual({
        exportedAt: "2026-09-14T10:30:00.000Z",
        recipes: [recipe],
        version: DATA_VERSION,
      });
      expect(web.anchor.download).toBe("cookbook-2026-09-14.json");
    });

    it("clicks the link and then clears up after itself", async () => {
      await exportRecipes([recipe]);

      expect(web.anchor.href).toBe("blob:cookbook");
      expect(web.appendChild).toHaveBeenCalledWith(web.anchor);
      expect(web.anchor.click).toHaveBeenCalledTimes(1);
      expect(web.anchor.remove).toHaveBeenCalledTimes(1);
      expect(web.revokeObjectURL).toHaveBeenCalledWith("blob:cookbook");
    });
  });

  describe("on a device", () => {
    beforeEach(() => setPlatform("ios"));

    it("writes the file and offers the share sheet", async () => {
      sharingAvailable.mockResolvedValue(true);

      await exportRecipes([recipe]);

      expect(writeFile).toHaveBeenCalledWith(
        "file:///documents/cookbook-2026-09-14.json",
        expect.stringContaining('"Bread"')
      );
      expect(share).toHaveBeenCalledWith(
        "file:///documents/cookbook-2026-09-14.json",
        { mimeType: "application/json" }
      );
    });

    it("still writes the file where sharing is unavailable", async () => {
      sharingAvailable.mockResolvedValue(false);

      await exportRecipes([recipe]);

      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(share).not.toHaveBeenCalled();
    });
  });
});

describe("exportRecipeTemplate", () => {
  it("downloads the template under its own name on web", async () => {
    setPlatform("web");
    const web = stubWebGlobals();

    await exportRecipeTemplate();

    expect(JSON.parse(web.blobs[0].parts[0])).toEqual(
      JSON.parse(JSON.stringify(RECIPE_TEMPLATE))
    );
    expect(web.anchor.download).toBe(RECIPE_TEMPLATE_FILE_NAME);

    web.restore();
  });

  it("writes the template to a file on a device", async () => {
    setPlatform("android");
    sharingAvailable.mockResolvedValue(true);

    await exportRecipeTemplate();

    expect(writeFile).toHaveBeenCalledWith(
      `file:///documents/${RECIPE_TEMPLATE_FILE_NAME}`,
      expect.stringContaining("Spaghetti carbonara")
    );
  });
});

describe("importRecipes", () => {
  const payload = JSON.stringify({ recipes: [{ title: "Toast" }] });

  it("asks only for JSON files", async () => {
    picker.mockResolvedValue({ canceled: true });

    await importRecipes();

    expect(picker).toHaveBeenCalledWith({
      type: "application/json",
      copyToCacheDirectory: true,
    });
  });

  it("returns nothing when the picker is dismissed", async () => {
    picker.mockResolvedValue({ canceled: true });
    await expect(importRecipes()).resolves.toBeNull();
  });

  it("returns nothing when the picker comes back with no file", async () => {
    picker.mockResolvedValue({ canceled: false, assets: [] });
    await expect(importRecipes()).resolves.toBeNull();

    picker.mockResolvedValue({ canceled: false });
    await expect(importRecipes()).resolves.toBeNull();
  });

  describe("on a device", () => {
    beforeEach(() => {
      setPlatform("ios");
      picker.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file:///cache/cookbook.json" }],
      });
    });

    it("reads the picked file and parses it", async () => {
      readFile.mockResolvedValue(payload);

      const imported = await importRecipes();

      expect(readFile).toHaveBeenCalledWith("file:///cache/cookbook.json");
      expect(imported?.[0].title).toBe("Toast");
    });

    it("reports a file that is not JSON in words a user can act on", async () => {
      readFile.mockResolvedValue("this is not json");

      await expect(importRecipes()).rejects.toThrow(RecipeParseError);
      await expect(importRecipes()).rejects.toThrow(
        "That file is not valid JSON."
      );
    });

    it("passes a parse failure straight through", async () => {
      readFile.mockResolvedValue(JSON.stringify({ count: 3 }));

      await expect(importRecipes()).rejects.toThrow(
        /does not look like a cookbook export/
      );
    });
  });

  describe("on web", () => {
    class FakeFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      onerror: (() => void) | null = null;
      static contents: string | null = payload;

      readAsText() {
        if (FakeFileReader.contents === null) {
          this.onerror?.();
        } else {
          this.onload?.({ target: { result: FakeFileReader.contents } });
        }
      }
    }

    const globals = globalThis as Record<string, any>;
    let savedFileReader: unknown;

    beforeEach(() => {
      setPlatform("web");
      savedFileReader = globals.FileReader;
      globals.FileReader = FakeFileReader;
      FakeFileReader.contents = payload;
    });

    afterEach(() => {
      globals.FileReader = savedFileReader;
    });

    it("reads the file the browser handed over", async () => {
      picker.mockResolvedValue({
        canceled: false,
        assets: [{ file: { name: "cookbook.json" } }],
      });

      const imported = await importRecipes();

      expect(imported?.[0].title).toBe("Toast");
      // The device reader must not be used on web.
      expect(readFile).not.toHaveBeenCalled();
    });

    it("reports an asset the browser gave no file for", async () => {
      picker.mockResolvedValue({ canceled: false, assets: [{}] });

      await expect(importRecipes()).rejects.toThrow(
        "The selected file could not be read."
      );
    });

    it("reports a read that fails part way through", async () => {
      picker.mockResolvedValue({
        canceled: false,
        assets: [{ file: { name: "cookbook.json" } }],
      });
      FakeFileReader.contents = null;

      await expect(importRecipes()).rejects.toThrow(RecipeParseError);
    });
  });
});
