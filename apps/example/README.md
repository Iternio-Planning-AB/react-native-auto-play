# React Native Auto Play Example

This example app showcases the features of the `react-native-autoplay` library.

## Getting Started

1.  **Install dependencies:**

    ```bash
    yarn install
    ```

2.  **Run the app:**

    *   **iOS:**

        ```bash
        yarn ios
        ```

        You can test CarPlay with the iOS Simulator or with the CarPlay Simulator app, which is available as part of the "Additional Tools for Xcode". 

    *   **Android:**

        To run the app on Android Auto, you need to set up the Desktop Head Unit (DHU). For more information, see the [Android Developer documentation](https://developer.android.com/training/cars/testing/dhu).

        You also need to forward a port to the DHU. You can use the `adb_port_setup.sh` script located in the root of this project.

        ```bash
        ../../adb_port_setup.sh
        ```

        Then, you can run the app:

        ```bash
        yarn android
        ```

## Features

This example app demonstrates how to:

*   **Use the `MapTemplate`** as the root template for a navigation app.
*   **Add map actions and buttons** to the `MapTemplate`.
*   **Simulate a navigation session** with maneuvers.
*   **Use various templates**, including:
    *   `GridTemplate`
    *   `ListTemplate`
    *   `SearchTemplate`
    *   `InformationTemplate`
    *   `MessageTemplate`
*   **Display content on the instrument cluster** using `AutoPlayCluster`.
*   **Display content on the CarPlay dashboard** using `CarPlayDashboard`.
*   **Access telemetry data** on Android Auto.
*   **Use voice input** on Android Auto.
