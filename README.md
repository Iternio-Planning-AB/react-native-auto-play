# iOS Development Team Setup

This project uses a local `Development.xcconfig` file for code signing for the example app. This file **should not be committed** to Git.

## Steps
1. Create the file `apps/example/ios/Development.xcconfig`:

```xcconfig
CODE_SIGN_STYLE = Automatic
DEVELOPMENT_TEAM = <YOUR_TEAM_ID_HERE>
````
