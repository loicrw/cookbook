# Welcome to the Cookbook Expo App 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Useful commands

1. Install dependencies

   ```bash
   npm install
   ```

1. Start the app

   ```bash
   npx expo start
   ```

1. Run the tests

   ```bash
   npm test
   ```

   `npm run test:watch` re-runs what a change affects, and `npm run test:coverage`
   adds a coverage report. See [How to test](../docs/how-to-test.md).

1. Check a change before committing it

   ```bash
   npm run check
   ```

   Regenerates the typed-route declarations, then typechecks, lints, tests and
   builds the web bundle. Expo only regenerates `.expo/types/router.d.ts` from
   the Metro dev server, so `tsc` on its own can fail against a stale route
   list. `npm run routes` does that step alone.

1. Publish the app to github pages

   ```bash
   npm run deploy
   ```

## Documentation

The reference documentation lives in [`docs/`](../docs), next to this folder:

- [How the frontend is put together](../docs/architecture.md): the directory
  structure, how app data is stored and read back, importing and exporting, and
  the letter-size preference.
- [How to test](../docs/how-to-test.md): running the suite, what is set up,
  where tests live, and how to write one.

## Getting started

In the output of `npx expo start`, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

Screens live in the **app** directory, which uses
[file-based routing](https://docs.expo.dev/router/introduction). Components and
logic live in **src**.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
