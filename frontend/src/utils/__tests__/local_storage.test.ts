import AsyncStorage from "@react-native-async-storage/async-storage";
import { DATA_VERSION, STORAGE_KEY } from "../../constants/storage";
import { loadAppData, saveAppData } from "../local_storage";
import { emptyAppData } from "../recipes";

describe("loadAppData", () => {
  it("returns an empty cookbook when nothing has ever been stored", async () => {
    await expect(loadAppData()).resolves.toMatchObject({
      recipes: [],
      version: DATA_VERSION,
    });
  });

  it("reads stored data back through the normaliser", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 4, recipes: [{ title: "Toast" }] })
    );

    const data = await loadAppData();

    expect(data.recipes).toHaveLength(1);
    expect(data.recipes[0].title).toBe("Toast");
    // The normaliser fills in what an older payload never wrote.
    expect(data.recipes[0].id).toBeTruthy();
    expect(data.version).toBe(DATA_VERSION);
  });

  it("degrades to an empty cookbook when the stored JSON is broken", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});
    await AsyncStorage.setItem(STORAGE_KEY, "{not json");

    await expect(loadAppData()).resolves.toEqual(
      expect.objectContaining({ recipes: [] })
    );
    expect(logged).toHaveBeenCalledWith(
      "Failed to load app data:",
      expect.any(Error)
    );

    logged.mockRestore();
  });

  it("degrades to an empty cookbook when storage itself fails", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});
    jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValueOnce(new Error("storage is unavailable"));

    await expect(loadAppData()).resolves.toEqual(
      expect.objectContaining({ recipes: [] })
    );

    logged.mockRestore();
  });
});

describe("saveAppData", () => {
  it("writes the data under the app's storage key", async () => {
    const data = { ...emptyAppData(), lastUpdated: 1700000000000 };

    await saveAppData(data);

    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? "")).toEqual(
      data
    );
  });

  it("logs and rethrows when the write fails", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("disk full");
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(failure);

    await expect(saveAppData(emptyAppData())).rejects.toThrow("disk full");
    expect(logged).toHaveBeenCalledWith("Failed to save app data:", failure);

    logged.mockRestore();
  });
});

describe("a round trip", () => {
  it("reads back what it wrote", async () => {
    const data = {
      ...emptyAppData(),
      recipes: [
        {
          description: "",
          id: "r1",
          ingredients: [{ amount: 1, name: "flour", unit: "g" }],
          people_served: 2,
          steps: [{ description: "Bake", order: 1 }],
          times_cooked: 1,
          title: "Bread",
        },
      ],
    };

    await saveAppData(data);

    expect(await loadAppData()).toEqual(data);
  });
});
