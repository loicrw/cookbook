# Welcome to the Cookbook Expo App 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Useful commands
1. Start the app

   ```bash
   npx expo start
   ```

1. Publish the app to github pages

   ```bash
   npm run deploy
   ``` 

1. Install dependencies

   ```bash
   npm install
   ```

## Directory Structure

```
app/
├── components/            # Reusable UI components
│   ├── IncrementButton.tsx
│   ├── ExportButton.tsx
│   ├── ImportButton.tsx
│   └── index.ts           # Component exports
├── constants/             # App constants
│   └── storage.ts         # Storage-related constants
├── styles/                # Shared styles
│   └── common.ts          # Common component styles
├── types/                 # TypeScript type definitions
│   └── app.ts             # App data types
├── utils/                 # Utility functions
│   ├── local_storage.ts   # AsyncStorage operations
│   └── fileOperations.ts  # File import/export operations
└── index.tsx              # Main app component
```

## Getting started

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
