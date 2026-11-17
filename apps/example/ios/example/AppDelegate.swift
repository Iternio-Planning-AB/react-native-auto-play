import UIKit

/// React Native is started by the scene delegates of @iternio/react-native-auto-play, see the
/// UIApplicationSceneManifest in Info.plist
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  /// set to the phone window by the library, for libraries reading UIApplication.shared.delegate?.window
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    true
  }
}
