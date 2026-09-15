import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StyleSheet, StyleProp, ViewStyle } from "react-native";
/**
 * The minimum of a test instance's tree needed to walk up to a laid-out
 * ancestor. The project has no types for react-test-renderer, so a structural
 * type keeps the import away.
 */
type TestInstance = {
  props: { style?: unknown };
  parent: TestInstance | null;
};
import { resetRouterMock } from "@/src/test-utils/router";
import SettingsScreen from "@/app/(tabs)/settings";
import { DATA_VERSION } from "@/src/constants/storage";
import { Recipe } from "@/src/types/app";
import {
  exportRecipeTemplate,
  exportRecipes,
  importRecipes,
} from "@/src/utils/fileOperations";
import { RecipeParseError } from "@/src/utils/recipes";
import {
  makeRecipe,
  readStorage,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

jest.mock("@/src/utils/fileOperations", () => ({
  exportRecipeTemplate: jest.fn(),
  exportRecipes: jest.fn(),
  importRecipes: jest.fn(),
}));

const exportsRecipes = exportRecipes as jest.Mock;
const exportsTemplate = exportRecipeTemplate as jest.Mock;
const imports = importRecipes as jest.Mock;

const bread = makeRecipe({ id: "bread", title: "Bread" });
const incoming: Recipe[] = [makeRecipe({ id: "new", title: "Imported loaf" })];

beforeEach(() => {
  resetRouterMock();
  imports.mockResolvedValue(null);
  exportsRecipes.mockResolvedValue(undefined);
  exportsTemplate.mockResolvedValue(undefined);
});

/**
 * Settings draws before storage has been read, so a test has to wait for the
 * cookbook to arrive. The recipe count in About is what reflects it.
 */
async function renderSettings(recipes: Recipe[] = []) {
  await seedStorage({ recipes });
  renderWithProviders(<SettingsScreen />);
  await waitFor(() =>
    expect(screen.getByText("Recipes stored")).toBeVisible()
  );
  await waitFor(() => {
    const exportButton = screen.getByRole("button", { name: "Export recipes" });
    return recipes.length
      ? expect(exportButton).not.toBeDisabled()
      : expect(exportButton).toBeDisabled();
  });
}

describe("the settings screen", () => {
  describe("preferences", () => {
    it("names the letter size in use", async () => {
      await renderSettings();

      expect(screen.getByText("Default")).toBeVisible();
    });

    it("changes the letter size, and keeps it", async () => {
      await renderSettings();

      fireEvent(screen.getByLabelText("Font size"), "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });

      await waitFor(() => expect(screen.getByText("Larger")).toBeVisible());
      await waitFor(async () =>
        expect((await readStorage())?.settings.fontSizeLevel).toBe(3)
      );
    });
  });

  describe("the cook's name", () => {
    it("records it", async () => {
      await renderSettings();

      fireEvent.changeText(
        screen.getByPlaceholderText("Who is cooking?"),
        "Nonna"
      );

      await waitFor(async () =>
        expect((await readStorage())?.settings.authorName).toBe("Nonna")
      );
    });

    it("explains what the name is used for", async () => {
      await renderSettings();

      expect(
        screen.getByText(/set as the author of new\s+recipes/)
      ).toBeVisible();
    });
  });

  describe("exporting", () => {
    it("cannot export a cookbook with nothing in it", async () => {
      await renderSettings();

      expect(
        screen.getByRole("button", { name: "Export recipes" })
      ).toBeDisabled();
    });

    it("writes the cookbook to a file", async () => {
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Export recipes" }));

      await waitFor(() =>
        expect(exportsRecipes).toHaveBeenCalledWith([
          expect.objectContaining({ id: "bread" }),
        ])
      );
    });

    it("says so when the export fails", async () => {
      exportsRecipes.mockRejectedValue(new Error("No room on the device."));
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Export recipes" }));

      await waitFor(() => expect(screen.getByText("Export failed")).toBeVisible());
      expect(screen.getByText("No room on the device.")).toBeVisible();
    });

    it("falls back to plain words for a failure that carries none", async () => {
      exportsRecipes.mockRejectedValue("something odd");
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Export recipes" }));

      await waitFor(() => expect(screen.getByText("Please try again.")).toBeVisible());
    });

    it("writes the template for an agent to work from", async () => {
      await renderSettings();

      fireEvent.press(
        screen.getByRole("button", {
          name: "Export recipe template (for agents)",
        })
      );

      await waitFor(() => expect(exportsTemplate).toHaveBeenCalledTimes(1));
    });

    it("says so when the template export fails", async () => {
      exportsTemplate.mockRejectedValue(new Error("Nope."));
      await renderSettings();

      fireEvent.press(
        screen.getByRole("button", {
          name: "Export recipe template (for agents)",
        })
      );

      await waitFor(() => expect(screen.getByText("Export failed")).toBeVisible());
    });
  });

  describe("importing", () => {
    it("does nothing when the file picker is dismissed", async () => {
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));

      await waitFor(() => expect(imports).toHaveBeenCalled());
      expect(screen.queryByText("Import recipes", { exact: true })).toBeTruthy();
      expect(screen.queryByText("Replace everything")).toBeNull();
    });

    it("asks whether to add or replace when there is already a cookbook", async () => {
      imports.mockResolvedValue(incoming);
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));

      await waitFor(() =>
        expect(screen.getByText("Add to my recipes")).toBeVisible()
      );
      expect(screen.getByText("Replace everything")).toBeVisible();
      expect(
        screen.getByText(/Read 1 recipe from that file\. Add it alongside/)
      ).toBeVisible();
    });

    it("only offers to add when the cookbook is empty", async () => {
      imports.mockResolvedValue(incoming);
      await renderSettings();

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));

      await waitFor(() =>
        expect(screen.getByText("Add to my cookbook")).toBeVisible()
      );
      expect(screen.queryByText("Replace everything")).toBeNull();
      expect(
        screen.getByText(/Your cookbook is empty, so it will be added as it is/)
      ).toBeVisible();
    });

    it("adds the imported recipes alongside the existing ones", async () => {
      imports.mockResolvedValue(incoming);
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));
      await waitFor(() =>
        expect(screen.getByText("Add to my recipes")).toBeVisible()
      );
      fireEvent.press(screen.getByText("Add to my recipes"));

      await waitFor(() =>
        expect(screen.getByText("Import complete")).toBeVisible()
      );
      expect(
        screen.getByText("Added 1 recipe to your cookbook.")
      ).toBeVisible();
      expect((await readStorage())?.recipes).toHaveLength(2);
    });

    it("replaces the cookbook when that is what was asked for", async () => {
      imports.mockResolvedValue(incoming);
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));
      await waitFor(() =>
        expect(screen.getByText("Replace everything")).toBeVisible()
      );
      fireEvent.press(screen.getByText("Replace everything"));

      await waitFor(async () => {
        const stored = await readStorage();
        expect(stored?.recipes).toHaveLength(1);
        expect(stored?.recipes[0].title).toBe("Imported loaf");
      });
      expect(
        screen.getByText("Your cookbook now holds the 1 recipe from that file.")
      ).toBeVisible();
    });

    it("imports nothing when the question is cancelled", async () => {
      imports.mockResolvedValue(incoming);
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));
      await waitFor(() => expect(screen.getByText("Cancel")).toBeVisible());
      fireEvent.press(screen.getByText("Cancel"));

      expect(screen.queryByText("Add to my recipes")).toBeNull();
      expect((await readStorage())?.recipes).toHaveLength(1);
    });

    it("explains a file it could not read", async () => {
      imports.mockRejectedValue(
        new RecipeParseError("That file is not valid JSON.")
      );
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));

      await waitFor(() => expect(screen.getByText("Import failed")).toBeVisible());
      expect(screen.getByText("That file is not valid JSON.")).toBeVisible();
    });

    it("falls back to general advice for a failure of another kind", async () => {
      imports.mockRejectedValue(new Error("EACCES"));
      await renderSettings([bread]);

      fireEvent.press(screen.getByRole("button", { name: "Import recipes" }));

      await waitFor(() =>
        expect(
          screen.getByText(
            "The file could not be read. Please check it and try again."
          )
        ).toBeVisible()
      );
    });
  });

  describe("the data section", () => {
    // The nearest ancestor with a flexDirection is the container the buttons
    // share. (Compared by identity of that ancestor, never by toBe on the
    // raw test instances, whose diff printer can blow up the heap.)
    function rowContainer(node: TestInstance): TestInstance {
      let current = node;
      let walked = 0;
      while (walked < 20) {
        const style = StyleSheet.flatten(
          current.props.style as StyleProp<ViewStyle>
        ) as ViewStyle | undefined;
        if (style?.flexDirection) return current;
        if (!current.parent) {
          throw new Error("No laid-out ancestor found");
        }
        current = current.parent;
        walked += 1;
      }
      throw new Error("No laid-out ancestor found");
    }

    function buttonStyle(node: TestInstance): ViewStyle {
      const style = node.props.style as StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
      const resolved =
        typeof style === "function" ? style({ pressed: false }) : style;
      return StyleSheet.flatten(resolved) as ViewStyle;
    }

    it("places the import and export buttons side by side on one row", async () => {
      await renderSettings([bread]);

      const importButton = screen.getByRole("button", {
        name: "Import recipes",
      }) as unknown as TestInstance;
      const exportButton = screen.getByRole("button", {
        name: "Export recipes",
      }) as unknown as TestInstance;

      expect(rowContainer(importButton)).toBe(rowContainer(exportButton));
      expect(buttonStyle(rowContainer(importButton)).flexDirection).toBe(
        "row"
      );

      // Both buttons stretch to fill half the row, so neither takes more
      // space than the other.
      expect(buttonStyle(importButton).flex).toBe(1);
      expect(buttonStyle(exportButton).flex).toBe(1);
    });
  });

  describe("about", () => {
    it("states the app version, the data format and the recipe count", async () => {
      await renderSettings([bread]);

      expect(screen.getByText("App version")).toBeVisible();
      expect(screen.getByText("1.0.0")).toBeVisible();
      expect(screen.getByText(`v${DATA_VERSION}`)).toBeVisible();
      expect(screen.getByText("Recipes stored")).toBeVisible();
      expect(screen.getByText("1")).toBeVisible();
    });
  });
});
